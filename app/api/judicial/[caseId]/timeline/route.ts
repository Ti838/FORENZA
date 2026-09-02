import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'

type Params = { params: Promise<{ caseId: string }> }

// GET /api/judicial/:caseId/timeline
// Returns the full ordered event history for all evidence in a case.
// Available to JUDGE, AUDITOR, SUPERVISOR, ADMIN only.
export async function GET(request: NextRequest, { params }: Params) {
  const { caseId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'judicial:read')) {
    return NextResponse.json({ error: 'Forbidden — judicial access only' }, { status: 403 })
  }

  // Fetch case metadata
  const { data: caseData } = await adminClient.from('cases')
    .select('id, case_number, title, crime_type, status, incident_datetime, crime_scene_latitude, crime_scene_longitude, created_at')
    .eq('id', caseId).single()

  if (!caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  // Fetch all evidence items for this case
  const { data: evidenceList } = await adminClient.from('evidence')
    .select(`
      id, evidence_number, status, master_hash, hash_algorithm, captured_at,
      capture_latitude, capture_longitude, geofence_verified,
      classification:evidence_classifications(
        ai_object, ai_category, ai_confidence, final_object, final_category, classification_method, confirmed_at
      ),
      current_holder:profiles!evidence_current_holder_id_fkey(id, full_name, badge_number),
      registered_by_profile:profiles!evidence_registered_by_fkey(id, full_name, badge_number),
      lab_reports(id, version, title, file_sha256, is_final, created_at),
      vault_locations(id, vault_id, location_label, stored_at)
    `)
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  // Fetch all evidence events for this case, ordered chronologically
  const { data: events } = await adminClient.from('evidence_events')
    .select(`
      id, evidence_id, event_type, actor_id, latitude, longitude,
      from_status, to_status, metadata, notes, created_at,
      actor:profiles!evidence_events_actor_id_fkey(id, full_name, badge_number)
    `)
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  // Fetch all custody logs for evidence in this case
  const evidenceIds = evidenceList?.map((e) => e.id) ?? []
  let custodyLogs: any[] = []
  if (evidenceIds.length > 0) {
    const { data: custody } = await adminClient.from('custody_logs')
      .select(`
        id, evidence_id, action, previous_hash, current_hash,
        latitude, longitude, notes, created_at,
        sender:profiles!custody_logs_sender_id_fkey(id, full_name, badge_number),
        receiver:profiles!custody_logs_receiver_id_fkey(id, full_name, badge_number)
      `)
      .in('evidence_id', evidenceIds)
      .order('created_at', { ascending: true })
    custodyLogs = custody ?? []
  }

  await createAuditLog({
    actor_id: user.id, category: 'JUDICIAL_ACCESS', action: 'CASE_TIMELINE_ACCESSED',
    case_id: caseId, success: true, ip_address, user_agent, request_id,
    metadata: { evidence_count: evidenceList?.length ?? 0 },
  })

  return NextResponse.json({
    data: {
      case: caseData,
      evidence: evidenceList ?? [],
      events: events ?? [],
      custody_logs: custodyLogs,
      accessed_at: new Date().toISOString(),
      accessed_by: user.id,
    }
  })
}
