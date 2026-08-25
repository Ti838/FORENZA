import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Rate limiting store (in-memory for MVP — use Redis/Upstash in production)
// ---------------------------------------------------------------------------
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_LOGIN_MAX ?? '5', 10)
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_SECONDS ?? '300', 10) * 1000

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = loginAttempts.get(key)

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count }
}

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password too short'),
  device_identifier: z.string().min(16, 'Invalid device identifier'),
  device_name: z.string().min(1, 'Device name required'),
  platform: z.enum(['ios', 'android', 'web']),
})

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  // --- Parse body ---
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { email, password, device_identifier, device_name, platform } = parsed.data

  // --- Rate limit by email + IP ---
  const rlKey = `login:${email}:${ip_address ?? 'unknown'}`
  const { allowed } = checkRateLimit(rlKey)

  if (!allowed) {
    await createAuditLog({
      actor_email: email,
      category: 'AUTHENTICATION',
      action: 'LOGIN_RATE_LIMITED',
      success: false,
      ip_address,
      user_agent,
      request_id,
      metadata: { email, device_identifier },
    })
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait before trying again.' },
      { status: 429 }
    )
  }

  const supabase = createAdminClient()

  // --- Authenticate with Supabase Auth ---
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    await createAuditLog({
      actor_email: email,
      category: 'AUTHENTICATION',
      action: 'LOGIN_FAILED',
      success: false,
      ip_address,
      user_agent,
      request_id,
      metadata: { email, reason: 'invalid_credentials' },
    })
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  const userId = authData.user.id

  // --- Check profile is active ---
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_active, mfa_enabled')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
  }

  if (!profile.is_active) {
    await createAuditLog({
      actor_id: userId,
      actor_email: email,
      category: 'AUTHENTICATION',
      action: 'LOGIN_FAILED_INACTIVE',
      success: false,
      ip_address,
      user_agent,
      request_id,
    })
    return NextResponse.json({ error: 'Account is inactive. Contact your administrator.' }, { status: 403 })
  }

  // --- Verify device is approved ---
  const { data: device } = await supabase
    .from('approved_devices')
    .select('id, status, device_name')
    .eq('user_id', userId)
    .eq('device_identifier', device_identifier)
    .single()

  if (!device) {
    // Register as pending if not found
    await supabase.from('approved_devices').upsert({
      user_id: userId,
      device_identifier,
      device_name,
      platform,
      status: 'PENDING',
    }, { onConflict: 'user_id,device_identifier' })

    await createAuditLog({
      actor_id: userId,
      actor_email: email,
      category: 'AUTHENTICATION',
      action: 'LOGIN_FAILED_DEVICE_PENDING',
      success: false,
      ip_address,
      user_agent,
      request_id,
      metadata: { device_identifier, device_name, platform },
    })

    return NextResponse.json(
      {
        error: 'Device not approved. A registration request has been submitted to your administrator.',
        device_status: 'PENDING',
      },
      { status: 403 }
    )
  }

  if (device.status !== 'APPROVED') {
    await createAuditLog({
      actor_id: userId,
      actor_email: email,
      category: 'AUTHENTICATION',
      action: `LOGIN_FAILED_DEVICE_${device.status}`,
      success: false,
      ip_address,
      user_agent,
      request_id,
      metadata: { device_identifier, device_status: device.status },
    })
    return NextResponse.json(
      { error: `Device ${device.status.toLowerCase()}. Contact your administrator.`, device_status: device.status },
      { status: 403 }
    )
  }

  // --- Update device last_seen_at ---
  await supabase
    .from('approved_devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', device.id)

  // --- Get user roles ---
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  const roles = userRoles?.map((r) => r.role) ?? []

  // --- Update last_login_at ---
  await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId)

  await createAuditLog({
    actor_id: userId,
    actor_email: email,
    category: 'AUTHENTICATION',
    action: 'LOGIN_SUCCESS',
    success: true,
    ip_address,
    user_agent,
    request_id,
    metadata: { roles, device_identifier, mfa_required: profile.mfa_enabled },
  })

  // --- Return session ---
  // If MFA is enabled, require MFA verification before granting full access
  return NextResponse.json({
    success: true,
    user: {
      id: userId,
      email: profile.email,
      full_name: profile.full_name,
      roles,
      mfa_enabled: profile.mfa_enabled,
    },
    session: authData.session,
    mfa_required: profile.mfa_enabled,
  })
}
