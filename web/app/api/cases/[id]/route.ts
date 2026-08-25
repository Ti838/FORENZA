import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const updateCaseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  crime_type: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  crime_scene_latitude: z.number().min(-90).max(90).optional(),
  crime_scene_longitude: z.number().min(-180).max(180).optional(),
  incident_datetime: z.string().datetime().optional(),
  assigned_officer_id: z.string().uuid().nullable().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CLOSED', 'ARCHIVED']).optional(),
})

async function getAuthContext(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  return { user, roles: userRoles?.map((r) => r.role as any) ?? [], supabase, adminClient }
}

// GET /api/cases/:id
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.roles, 'case:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await ctx.supabase
    .from('cases')
    .select(`
      *,
      assigned_officer:profiles!cases_assigned_officer_id_fkey(id, full_name, badge_number, department),
      evidence(id, evidence_number, status, current_holder_id, captured_at, master_hash)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Case not found or access denied' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

// PATCH /api/cases/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const ctx = await getAuthContext(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.roles, 'case:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = updateCaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Verify case exists and user has access
  const { data: existingCase } = await ctx.supabase.from('cases').select('id, case_number').eq('id', id).single()
  if (!existingCase) return NextResponse.json({ error: 'Case not found or access denied' }, { status: 404 })

  // If assigning officer, verify role
  if (parsed.data.assigned_officer_id) {
    const { data: officerRole } = await ctx.adminClient
      .from('user_roles').select('role')
      .eq('user_id', parsed.data.assigned_officer_id).eq('role', 'INVESTIGATING_OFFICER').single()
    if (!officerRole) return NextResponse.json({ error: 'Assigned user must have INVESTIGATING_OFFICER role' }, { status: 422 })
  }

  const { data: updated, error } = await ctx.adminClient
    .from('cases').update(parsed.data).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })

  await createAuditLog({
    actor_id: ctx.user.id,
    category: 'CASE_MANAGEMENT',
    action: 'CASE_UPDATED',
    case_id: id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { changes: parsed.data },
  })

  return NextResponse.json({ data: updated, success: true })
}
