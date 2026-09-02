import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { haversineDistance } from '@/lib/geofence'
import { z } from 'zod'

const createOverrideSchema = z.object({
  evidence_id: z.string().uuid(),
  capture_latitude: z.number().min(-90).max(90),
  capture_longitude: z.number().min(-180).max(180),
  reason: z.string().min(10, 'Override reason must be at least 10 characters'),
})

// GET /api/overrides — list override requests
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const caseId = url.searchParams.get('case_id')

  let query = adminClient.from('supervisor_overrides').select(`
    *,
    officer:profiles!supervisor_overrides_officer_id_fkey(id, full_name, badge_number),
    supervisor:profiles!supervisor_overrides_supervisor_id_fkey(id, full_name, badge_number),
    evidence:evidence!supervisor_overrides_evidence_id_fkey(id, evidence_number, status),
    case:cases!supervisor_overrides_case_id_fkey(id, case_number, title)
  `).order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (caseId) query = query.eq('case_id', caseId)

  // If officer, only their own requests unless they have override:approve
  if (!hasPermission(roles, 'override:approve')) {
    query = query.eq('officer_id', user.id)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST /api/overrides — request an override
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'override:request')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = createOverrideSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { evidence_id, capture_latitude, capture_longitude, reason } = parsed.data

  const { data: evidence } = await adminClient.from('evidence')
    .select('id, case_id, status, registered_by, case:cases(id, crime_scene_latitude, crime_scene_longitude)')
    .eq('id', evidence_id)
    .single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })

  const caseObj = Array.isArray(evidence.case) ? evidence.case[0] : evidence.case
  const sceneLat = caseObj?.crime_scene_latitude ? Number(caseObj.crime_scene_latitude) : null
  const sceneLon = caseObj?.crime_scene_longitude ? Number(caseObj.crime_scene_longitude) : null

  let distanceMeters = 0
  if (sceneLat !== null && sceneLon !== null) {
    distanceMeters = haversineDistance(capture_latitude, capture_longitude, sceneLat, sceneLon)
  }

  const { data: overrideRecord, error: insertError } = await adminClient.from('supervisor_overrides').insert({
    evidence_id,
    case_id: evidence.case_id,
    officer_id: user.id,
    capture_latitude,
    capture_longitude,
    crime_scene_latitude: sceneLat,
    crime_scene_longitude: sceneLon,
    distance_meters: distanceMeters,
    reason,
    status: 'PENDING',
  }).select().single()

  if (insertError || !overrideRecord) {
    return NextResponse.json({ error: 'Failed to create override request', details: insertError?.message }, { status: 500 })
  }

  await createAuditLog({
    actor_id: user.id,
    category: 'EVIDENCE_MANAGEMENT',
    action: 'OVERRIDE_REQUESTED',
    evidence_id,
    case_id: evidence.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { override_id: overrideRecord.id, distance_meters: distanceMeters, reason },
  })

  return NextResponse.json({ success: true, data: overrideRecord }, { status: 201 })
}
