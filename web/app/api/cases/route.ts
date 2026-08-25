import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { z } from 'zod'

const createCaseSchema = z.object({
  case_number: z.string().min(3).regex(/^[A-Z0-9\-]+$/, 'Case number must be uppercase alphanumeric with hyphens'),
  title: z.string().min(3).max(200),
  crime_type: z.string().min(2).max(100),
  description: z.string().optional(),
  crime_scene_latitude: z.number().min(-90).max(90).optional(),
  crime_scene_longitude: z.number().min(-180).max(180).optional(),
  incident_datetime: z.string().datetime().optional(),
  assigned_officer_id: z.string().uuid().optional(),
})

// GET /api/cases
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'case:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // RLS handles the actual data filtering — query via user client
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') ?? '20', 10), 100)
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')

  let query = supabase
    .from('cases')
    .select(`
      *,
      assigned_officer:profiles!cases_assigned_officer_id_fkey(id, full_name, badge_number)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`case_number.ilike.%${search}%,title.ilike.%${search}%`)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })

  return NextResponse.json({ data, total: count ?? 0, page, per_page: perPage })
}

// POST /api/cases
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'case:create')) {
    return NextResponse.json({ error: 'Forbidden — only ADMIN or SUPERVISOR can create cases' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = createCaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Check case_number uniqueness
  const { data: existing } = await adminClient.from('cases').select('id').eq('case_number', parsed.data.case_number).single()
  if (existing) return NextResponse.json({ error: 'Case number already exists' }, { status: 409 })

  // Verify assigned officer exists and has INVESTIGATING_OFFICER role if provided
  if (parsed.data.assigned_officer_id) {
    const { data: officerRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', parsed.data.assigned_officer_id)
      .eq('role', 'INVESTIGATING_OFFICER')
      .single()

    if (!officerRole) {
      return NextResponse.json({ error: 'Assigned officer must have INVESTIGATING_OFFICER role' }, { status: 422 })
    }
  }

  const { data: newCase, error } = await adminClient.from('cases').insert({
    ...parsed.data,
    created_by: user.id,
    status: 'ACTIVE',
  }).select().single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }

  await createAuditLog({
    actor_id: user.id,
    category: 'CASE_MANAGEMENT',
    action: 'CASE_CREATED',
    case_id: newCase.id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { case_number: newCase.case_number, title: newCase.title },
  })

  return NextResponse.json({ data: newCase, success: true }, { status: 201 })
}
