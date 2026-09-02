import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { z } from 'zod'

const registerEvidenceSchema = z.object({
  case_id: z.string().uuid(),
  evidence_number: z.string().min(1).regex(/^[A-Z0-9\-]+$/, 'Evidence number must be uppercase alphanumeric with hyphens'),
})

// GET /api/evidence — List evidence items
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') ?? '20', 10), 100)
  const caseId = url.searchParams.get('case_id')
  const status = url.searchParams.get('status')
  const holderId = url.searchParams.get('current_holder_id')

  let query = adminClient
    .from('evidence')
    .select(`
      id, case_id, evidence_number, status, master_hash, current_holder_id,
      captured_at, capture_latitude, capture_longitude, geofence_verified, created_at,
      case:cases!evidence_case_id_fkey(id, case_number, title),
      current_holder:profiles!evidence_current_holder_id_fkey(id, full_name, badge_number),
      classification:evidence_classifications(final_category, final_object, classification_method, ai_confidence)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (caseId) query = query.eq('case_id', caseId)
  if (status) query = query.eq('status', status)
  if (holderId) query = query.eq('current_holder_id', holderId)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 })

  const formattedData = (data ?? []).map((e: any) => ({
    ...e,
    classification: Array.isArray(e.classification) ? e.classification[0] : e.classification,
  }))

  return NextResponse.json({ data: formattedData, total: count ?? 0, page, per_page: perPage })
}

// POST /api/evidence — Register a new evidence item
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:register')) {
    return NextResponse.json({ error: 'Forbidden — only INVESTIGATING_OFFICER can register evidence' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = registerEvidenceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Verify case exists and officer has access
  const { data: caseData } = await supabase.from('cases').select('id, case_number, assigned_officer_id, status').eq('id', parsed.data.case_id).single()
  if (!caseData) return NextResponse.json({ error: 'Case not found or access denied' }, { status: 404 })
  if (caseData.status === 'CLOSED' || caseData.status === 'ARCHIVED') {
    return NextResponse.json({ error: 'Cannot add evidence to a closed or archived case' }, { status: 409 })
  }

  // Check for duplicate evidence_number within case
  const { data: existing } = await adminClient.from('evidence').select('id').eq('case_id', parsed.data.case_id).eq('evidence_number', parsed.data.evidence_number).single()
  if (existing) return NextResponse.json({ error: 'Evidence number already exists in this case' }, { status: 409 })

  const { data: evidence, error } = await adminClient.from('evidence').insert({
    case_id: parsed.data.case_id,
    evidence_number: parsed.data.evidence_number,
    status: 'REGISTERED',
    registered_by: user.id,
    current_holder_id: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to register evidence' }, { status: 500 })

  // Create genesis evidence event
  await adminClient.from('evidence_events').insert({
    evidence_id: evidence.id,
    case_id: parsed.data.case_id,
    event_type: 'REGISTERED',
    actor_id: user.id,
    from_status: null,
    to_status: 'REGISTERED',
    metadata: { evidence_number: parsed.data.evidence_number },
  })

  await createAuditLog({
    actor_id: user.id,
    category: 'EVIDENCE_MANAGEMENT',
    action: 'EVIDENCE_REGISTERED',
    evidence_id: evidence.id,
    case_id: parsed.data.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { evidence_number: evidence.evidence_number },
  })

  return NextResponse.json({ data: evidence, success: true }, { status: 201 })
}
