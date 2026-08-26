import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { extendCustodyChain, GENESIS_HASH, CustodyEventInput } from '@/lib/crypto/custody-chain'
import { z } from 'zod'

const labReceiveSchema = z.object({
  handover_token: z.string().min(1),
  notes: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

// POST /api/lab/:id/receive
// Lab analyst receives evidence, extends custody chain, sets status to LAB_RECEIVED.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'lab:receive')) {
    return NextResponse.json({ error: 'Forbidden — LAB_ANALYST only' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const parsed = labReceiveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { handover_token, notes, latitude, longitude } = parsed.data

  // Verify handover token
  const { verifyHandoverToken } = await import('@/lib/tokens')
  const tokenVerification = await verifyHandoverToken(handover_token)
  if (!tokenVerification.valid || tokenVerification.evidence_id !== evidenceId) {
    await createAuditLog({
      actor_id: user.id, category: 'SECURITY_EVENT', action: 'INVALID_HANDOVER_TOKEN_LAB',
      evidence_id: evidenceId, success: false, ip_address, user_agent, request_id,
      metadata: { error: tokenVerification.error },
    })
    return NextResponse.json({ error: 'Invalid or expired handover token' }, { status: 401 })
  }

  const { sha256 } = await import('@/lib/crypto/evidence-hash')
  const tokenHash = await sha256(handover_token)
  const { data: tokenRecord } = await adminClient.from('handover_tokens')
    .select('*').eq('token_hash', tokenHash).single()

  if (!tokenRecord || tokenRecord.is_revoked || tokenRecord.used_at) {
    return NextResponse.json({ error: 'Handover token is invalid, used, or revoked' }, { status: 401 })
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Handover token has expired' }, { status: 401 })
  }

  const { data: evidence } = await adminClient.from('evidence')
    .select('id, case_id, status, current_holder_id, evidence_number')
    .eq('id', evidenceId).single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })

  if (!['SEALED', 'IN_TRANSIT', 'TRANSFERRED', 'VAULT_STORED'].includes(evidence.status)) {
    return NextResponse.json({ error: `Evidence cannot be received by lab in state: ${evidence.status}` }, { status: 409 })
  }

  if (evidence.current_holder_id !== tokenVerification.sender_id) {
    return NextResponse.json({ error: 'Token sender is no longer the current holder' }, { status: 409 })
  }

  if (user.id === tokenVerification.sender_id) {
    return NextResponse.json({ error: 'Cannot receive evidence from yourself' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { data: latestCustody } = await adminClient.from('custody_logs')
    .select('current_hash').eq('evidence_id', evidenceId)
    .order('created_at', { ascending: false }).limit(1).single()
  const previousHash = latestCustody?.current_hash ?? GENESIS_HASH

  const custodyId = crypto.randomUUID()
  const custodyEventInput: CustodyEventInput = {
    custody_id: custodyId, evidence_id: evidenceId, action: 'LAB_RECEIVED',
    sender_id: tokenVerification.sender_id, receiver_id: user.id,
    timestamp: now, latitude: latitude ?? null, longitude: longitude ?? null,
  }
  const newHash = await extendCustodyChain(previousHash, custodyEventInput)

  const [tokenUpdate, custodyInsert, evidenceUpdate, eventInsert] = await Promise.all([
    adminClient.from('handover_tokens').update({ used_at: now, used_by: user.id }).eq('id', tokenRecord.id),
    adminClient.from('custody_logs').insert({
      id: custodyId, evidence_id: evidenceId, action: 'LAB_RECEIVED',
      sender_id: tokenVerification.sender_id, receiver_id: user.id,
      previous_hash: previousHash, current_hash: newHash,
      latitude: latitude ?? null, longitude: longitude ?? null, notes: notes ?? null,
      canonical_data: { custody_id: custodyId, evidence_id: evidenceId, action: 'LAB_RECEIVED', sender_id: tokenVerification.sender_id, receiver_id: user.id, timestamp: now },
    }),
    adminClient.from('evidence').update({ current_holder_id: user.id, status: 'LAB_RECEIVED' }).eq('id', evidenceId),
    adminClient.from('evidence_events').insert({
      evidence_id: evidenceId, case_id: evidence.case_id, event_type: 'LAB_RECEIVED',
      actor_id: user.id, latitude: latitude ?? null, longitude: longitude ?? null,
      from_status: evidence.status, to_status: 'LAB_RECEIVED',
      metadata: { custody_id: custodyId, sender_id: tokenVerification.sender_id, custody_hash: newHash },
    }),
  ])

  if (custodyInsert.error || evidenceUpdate.error) {
    return NextResponse.json({ error: 'Lab receipt failed — database error' }, { status: 500 })
  }

  await createAuditLog({
    actor_id: user.id, category: 'LAB_OPERATIONS', action: 'LAB_EVIDENCE_RECEIVED',
    evidence_id: evidenceId, case_id: evidence.case_id, success: true,
    ip_address, user_agent, request_id,
    metadata: { sender_id: tokenVerification.sender_id, custody_hash: newHash },
  })

  return NextResponse.json({
    success: true,
    data: { evidence_id: evidenceId, new_status: 'LAB_RECEIVED', custody_id: custodyId, custody_hash: newHash, received_at: now },
  })
}
