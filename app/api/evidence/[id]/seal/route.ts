import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { generateEvidenceHash, EvidenceHashInput } from '@/lib/crypto/evidence-hash'
import { generateQrToken } from '@/lib/tokens'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

// POST /api/evidence/:id/seal
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:seal')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch evidence with media
  const { data: evidence } = await supabase.from('evidence')
    .select('*, primary_media:evidence_media(*, is_primary)')
    .eq('id', evidenceId)
    .single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 })
  if (evidence.status !== 'CAPTURED') {
    return NextResponse.json({ error: `Cannot seal: evidence must be in CAPTURED state (currently: ${evidence.status})` }, { status: 409 })
  }
  if (evidence.registered_by !== user.id) {
    return NextResponse.json({ error: 'Only the registering officer can seal this evidence' }, { status: 403 })
  }

  // Get primary media
  const primaryMedia = Array.isArray(evidence.primary_media)
    ? evidence.primary_media.find((m: any) => m.is_primary)
    : evidence.primary_media

  if (!primaryMedia) {
    return NextResponse.json({ error: 'No media found for this evidence — capture must complete before sealing' }, { status: 409 })
  }

  // Verify classification exists
  const { data: classification } = await adminClient.from('evidence_classifications')
    .select('id').eq('evidence_id', evidenceId).single()

  if (!classification) {
    return NextResponse.json({
      error: 'Evidence must be classified before sealing. Complete AI or manual classification first.'
    }, { status: 409 })
  }

  // --- Generate master hash ---
  const hashInput: EvidenceHashInput = {
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    evidence_number: evidence.evidence_number,
    officer_id: evidence.registered_by,
    timestamp_utc: evidence.captured_at!,
    latitude: parseFloat(evidence.capture_latitude),
    longitude: parseFloat(evidence.capture_longitude),
    gps_accuracy: evidence.capture_gps_accuracy ? parseFloat(evidence.capture_gps_accuracy) : null,
    media_sha256: primaryMedia.file_sha256,
    media_type: primaryMedia.media_type,
    mime_type: primaryMedia.mime_type,
    file_size_bytes: primaryMedia.file_size_bytes,
  }

  const masterHash = await generateEvidenceHash(hashInput)

  // --- Update evidence to SEALED with master hash ---
  const { error: sealError } = await adminClient.from('evidence')
    .update({ status: 'SEALED', master_hash: masterHash })
    .eq('id', evidenceId)

  if (sealError) return NextResponse.json({ error: 'Failed to seal evidence' }, { status: 500 })

  // --- Generate QR token ---
  const qrTokenId = crypto.randomUUID()
  const { token: qrToken, tokenHash, expiresAt } = await generateQrToken(evidenceId, qrTokenId)

  await adminClient.from('qr_tokens').insert({
    id: qrTokenId,
    evidence_id: evidenceId,
    token_hash: tokenHash,
    issued_by: user.id,
    expires_at: expiresAt.toISOString(),
  })

  // --- Evidence event ---
  await adminClient.from('evidence_events').insert({
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    event_type: 'SEALED',
    actor_id: user.id,
    from_status: 'CAPTURED',
    to_status: 'SEALED',
    metadata: { master_hash: masterHash, qr_token_id: qrTokenId },
  })

  await adminClient.from('evidence_events').insert({
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    event_type: 'QR_GENERATED',
    actor_id: user.id,
    metadata: { qr_token_id: qrTokenId, expires_at: expiresAt.toISOString() },
  })

  await createAuditLog({
    actor_id: user.id,
    category: 'EVIDENCE_MANAGEMENT',
    action: 'EVIDENCE_SEALED',
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { master_hash: masterHash },
  })

  return NextResponse.json({
    success: true,
    data: {
      evidence_id: evidenceId,
      status: 'SEALED',
      master_hash: masterHash,
      qr_token: qrToken,        // JWT — only returned once
      qr_token_id: qrTokenId,
      qr_expires_at: expiresAt.toISOString(),
    },
  })
}
