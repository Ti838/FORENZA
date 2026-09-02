import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { AppRole } from '@/types'
import { z } from 'zod'

const VALID_ROLES: AppRole[] = [
  'INVESTIGATING_OFFICER', 'SUPERVISOR', 'VAULT_CUSTODIAN',
  'LAB_ANALYST', 'JUDGE', 'AUDITOR', 'ADMIN',
]

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  full_name: z.string().min(2).max(100),
  badge_number: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  roles: z.array(z.enum(VALID_ROLES as [AppRole, ...AppRole[]])).min(1, 'At least one role required'),
})

// GET /api/admin/users — List all users with roles
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'admin:manage_users')) {
    return NextResponse.json({ error: 'Forbidden — ADMIN only' }, { status: 403 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') ?? '50', 10), 200)
  const search = url.searchParams.get('search')

  let query = adminClient
    .from('profiles')
    .select(`
      id, email, full_name, badge_number, department, phone,
      is_active, mfa_enabled, last_login_at, created_at,
      user_roles(role),
      created_by_profile:profiles!profiles_created_by_fkey(id, full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,badge_number.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[FORENZA ADMIN] Users query error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  return NextResponse.json({ data, total: count ?? 0, page, per_page: perPage })
}

// POST /api/admin/users — Create a new user
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const callerRoles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(callerRoles, 'admin:manage_users')) {
    return NextResponse.json({ error: 'Forbidden — ADMIN only' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { email, password, full_name, badge_number, department, phone, roles: newRoles } = parsed.data

  // Check email uniqueness
  const { data: existingUser } = await adminClient
    .from('profiles').select('id').eq('email', email).single()
  if (existingUser) {
    return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
  }

  // Create auth user via admin API
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Admin-created accounts are auto-confirmed
    user_metadata: { full_name },
  })

  if (authError || !authUser.user) {
    console.error('[FORENZA ADMIN] Auth user creation error:', authError)
    return NextResponse.json({ error: 'Failed to create user', details: authError?.message }, { status: 500 })
  }

  const newUserId = authUser.user.id

  // Update profile (trigger auto-creates it, we update the extra fields)
  await adminClient.from('profiles').update({
    full_name,
    badge_number: badge_number ?? null,
    department: department ?? null,
    phone: phone ?? null,
    is_active: true,
    created_by: user.id,
  }).eq('id', newUserId)

  // Assign roles
  const roleInserts = newRoles.map((role) => ({
    user_id: newUserId,
    role,
    assigned_by: user.id,
  }))
  await adminClient.from('user_roles').insert(roleInserts)

  await createAuditLog({
    actor_id: user.id,
    category: 'ADMIN_ACTIONS',
    action: 'USER_CREATED',
    target_user_id: newUserId,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { email, full_name, roles: newRoles, badge_number },
  })

  return NextResponse.json({
    success: true,
    data: {
      id: newUserId,
      email,
      full_name,
      badge_number: badge_number ?? null,
      department: department ?? null,
      roles: newRoles,
    }
  }, { status: 201 })
}
