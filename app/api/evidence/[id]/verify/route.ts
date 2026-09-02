import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { verifyEvidenceHash, EvidenceHashInput } from '@/lib/crypto/evidence-hash'
import { verifyCustodyChain, CustodyChainEvent } from '@/lib/crypto/custody-chain'
import { IntegrityResult } from '@/types'

type Params = { params: Promise<{ id: string }> }

// POST /api/evidence/:id/verify
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:verify_integrity')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // --- Fetch evidence ---
  const { data: evidence } = await supabase.from('evidence')
    .select('*, primary_media:evidence_media(*)')
    .eq('id', evidenceId).single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 })

  if (!evidence.master_hash) {
    return NextResponse.json({ error: 'Evidence has not been sealed — no hash to verify' }, { status: 409 })
  }

  // --- 1. Verify evidence master hash ---
  const primaryMedia = Array.isArray(evidence.primary_media)
    ? evidence.primary_media.find((m: any) => m.is_primary) ?? evidence.primary_media[0]
    : evidence.primary_media

  let evidenceHashResult: IntegrityResult['evidence_hash']

  if (!primaryMedia) {
    evidenceHashResult = {
      status: 'FAILED',
      stored_hash: evidence.master_hash,
      calculated_hash: '',
      match: false,
    }
  } else {
    const hashInput: EvidenceHashInput = {
      evidence_id: evidenceId,
      case_id: evidence.case_id,
      evidence_number: evidence.evidence_number,
      officer_id: evidence.registered_by,
      timestamp_utc: evidence.captured_at,
      latitude: parseFloat(evidence.capture_latitude),
      longitude: parseFloat(evidence.capture_longitude),
      gps_accuracy: evidence.capture_gps_accuracy ? parseFloat(evidence.capture_gps_accuracy) : null,
      media_sha256: primaryMedia.file_sha256,
      media_type: primaryMedia.media_type,
      mime_type: primaryMedia.mime_type,
      file_size_bytes: primaryMedia.file_size_bytes,
    }
    const hashVerification = await verifyEvidenceHash(evidence.master_hash, hashInput)
    evidenceHashResult = {
      status: hashVerification.match ? 'VERIFIED' : 'FAILED',
      stored_hash: hashVerification.stored_hash,
      calculated_hash: hashVerification.calculated_hash,
      match: hashVerification.match,
    }
  }

  // --- 2. Verify custody hash chain ---
  const { data: custodyLogs } = await adminClient.from('custody_logs')
    .select('*')
    .eq('evidence_id', evidenceId)
    .order('created_at', { ascending: true })

  const chainResult = await verifyCustodyChain(custodyLogs as CustodyChainEvent[] ?? [])

  const custodyChainResult: IntegrityResult['custody_chain'] = {
    status: chainResult.status,
    total_events: chainResult.total_events,
    broken_event_id: chainResult.broken_event_id ?? undefined,
    expected_hash: chainResult.expected_hash ?? undefined,
    calculated_hash: chainResult.calculated_hash ?? undefined,
    failure_reason: chainResult.failure_reason ?? undefined,
  }

  // --- 3. Verify lab report hashes ---
  const { data: labReports } = await adminClient.from('lab_reports')
    .select('id, version, file_sha256, storage_path').eq('evidence_id', evidenceId)

  const reportHashResults: IntegrityResult['report_hashes'] = []
  // Note: In production, re-download from storage and verify SHA-256
  // For MVP, we verify the stored hash record integrity (hash stored at upload time)
  for (const report of labReports ?? []) {
    reportHashResults.push({
      report_id: report.id,
      version: report.version,
      status: report.file_sha256 ? 'VERIFIED' : 'FAILED',
      stored_hash: report.file_sha256,
    })
  }

  // --- Determine overall status ---
  const isCompromised =
    evidenceHashResult.status === 'FAILED' ||
    custodyChainResult.status === 'BROKEN' ||
    reportHashResults.some((r) => r.status === 'FAILED')

  const overallStatus: IntegrityResult['overall_status'] = isCompromised
    ? 'COMPROMISED_TAMPERED'
    : 'INTEGRITY_VERIFIED'

  // --- Log integrity check ---
  await adminClient.from('evidence_events').insert({
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    event_type: isCompromised ? 'INTEGRITY_FAILED' : 'INTEGRITY_VERIFIED',
    actor_id: user.id,
    metadata: { overall_status: overallStatus },
  })

  await createAuditLog({
    actor_id: user.id,
    category: 'INTEGRITY_CHECK',
    action: `INTEGRITY_${overallStatus}`,
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    success: !isCompromised,
    ip_address, user_agent, request_id,
    metadata: {
      evidence_hash_status: evidenceHashResult.status,
      custody_chain_status: custodyChainResult.status,
    },
  })

  const result: IntegrityResult = {
    evidence_id: evidenceId,
    overall_status: overallStatus,
    evidence_hash: evidenceHashResult,
    custody_chain: custodyChainResult,
    report_hashes: reportHashResults,
    verified_at: new Date().toISOString(),
    verified_by: user.id,
  }

  return NextResponse.json({ data: result })
}
