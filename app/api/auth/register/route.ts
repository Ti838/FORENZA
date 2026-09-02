import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { z } from 'zod'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid government/official email'),
  badgeNumber: z.string().min(2, 'Badge or Personnel ID required'),
  department: z.string().min(2, 'Department name required'),
  role: z.enum(['INVESTIGATING_OFFICER', 'VAULT_CUSTODIAN', 'LAB_ANALYST', 'JUDGE', 'SUPERVISOR', 'ADMIN']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  device_identifier: z.string().min(8, 'Device token required'),
  device_name: z.string().min(1, 'Device name required'),
})

export async function POST(request: NextRequest) {
  const { ip_address, user_agent } = extractRequestMeta(request)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { fullName, email, badgeNumber, department, role, password, device_identifier, device_name } = parsed.data

  const supabase = createAdminClient()

  try {
    // 1. Create Auth User in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        badge_number: badgeNumber,
        department,
        roles: [role],
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? 'Could not create personnel account' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. Insert or update in public.users table if it exists
    await supabase.from('users').upsert({
      id: userId,
      email: email.trim().toLowerCase(),
      full_name: fullName,
      badge_number: badgeNumber,
      department,
      is_active: true,
    })

    // 3. Insert into user_roles
    await supabase.from('user_roles').upsert({
      user_id: userId,
      role: role,
    })

    // 4. Register Device
    await supabase.from('devices').upsert({
      user_id: userId,
      device_identifier,
      device_name,
      platform: 'web',
      status: 'APPROVED',
      last_seen_at: new Date().toISOString(),
    })

    // 5. Create Audit Log
    await createAuditLog({
      actor_id: userId,
      actor_email: email,
      category: 'AUTHENTICATION',
      action: 'USER_REGISTERED',
      success: true,
      metadata: { role, badgeNumber, department, device_name },
      ip_address,
      user_agent,
    })

    return NextResponse.json({
      success: true,
      message: 'Personnel account successfully created and approved.',
      user: {
        id: userId,
        email,
        full_name: fullName,
        role,
      },
    })
  } catch (err: any) {
    console.error('[FORENZA REGISTER ERROR]', err)
    return NextResponse.json(
      { error: err.message ?? 'Failed to complete registration' },
      { status: 500 }
    )
  }
}
