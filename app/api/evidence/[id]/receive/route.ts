import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { verifyHandoverToken } from '@/lib/tokens'
import { extendCustodyChain, GENESIS_HASH, CustodyEventInput } from '@/lib/crypto/custody-chain'
import { sha256 } from '@/lib/crypto/evidence-hash'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const receiveSchema = z.object({
  handover_token: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().optional(),
})

// POST /api/evidence/:id/receive — Receiver completes custody transfer
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:transfer_receive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = receiveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })

  const { handover_token, latitude, longitude, notes } = parsed.data

  // --- Verify JWT signature and expiration ---
  const tokenVerification = await verifyHandoverToken(handover_token)
  if (!tokenVerification.valid || tokenVerification.evidence_id !== evidenceId) {
    await createAuditLog({
      actor_id: user.id,
      category: 'SECURITY_EVENT',
      action: 'INVALID_HANDOVER_TOKEN',
      evidence_id: evidenceId,
      success: false,
      ip_address, user_agent, request_id,
      metadata: { error: tokenVerification.error },
    })
    return NextResponse.json({ error: 'Invalid or expired handover token' }, { status: 401 })
  }

  // --- Verify token exists in DB and is not used/revoked ---
  const tokenHash = await sha256(handover_token)
  const { data: tokenRecord } = await adminClient.from('handover_tokens')
    .select('*').eq('token_hash', tokenHash).single()

  if (!tokenRecord || tokenRecord.is_revoked || tokenRecord.used_at) {
    return NextResponse.json({ error: 'Handover token is invalid, used, or revoked' }, { status: 401 })
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Handover token has expired' }, { status: 401 })
  }

  // --- Fetch evidence ---
  const { data: evidence } = await adminClient.from('evidence')
    .select('id, case_id, status, current_holder_id, evidence_number')
    .eq('id', evidenceId).single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })

  // --- Verify sender is current holder ---
  if (evidence.current_holder_id !== tokenVerification.sender_id) {
    return NextResponse.json({ error: 'Token sender is no longer the current holder of this evidence' }, { status: 409 })
  }

  // --- Cannot receive your own transfer ---
  if (user.id === tokenVerification.sender_id) {
    return NextResponse.json({ error: 'Cannot receive evidence from yourself' }, { status: 409 })
  }

  const now = new Date().toISOString()

  // --- Get latest custody hash ---
  const { data: latestCustody } = await adminClient.from('custody_logs')
    .select('current_hash').eq('evidence_id', evidenceId)
    .order('created_at', { ascending: false }).limit(1).single()

  const previousHash = latestCustody?.current_hash ?? GENESIS_HASH

  // --- ATOMIC TRANSACTION via DB function ---
  // 1. Mark handover token as used
  // 2. Create custody log (extends hash chain)
  // 3. Update evidence current_holder_id + status
  // 4. Create evidence event

  const custodyId = crypto.randomUUID()
  const custodyEventInput: CustodyEventInput = {
    custody_id: custodyId,
    evidence_id: evidenceId,
    action: 'RECEIVED',
    sender_id: tokenVerification.sender_id,
    receiver_id: user.id,
    timestamp: now,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  }

  const newHash = await extendCustodyChain(previousHash, custodyEventInput)

  // Determine new status based on receiver's role
  const isVaultCustodian = roles.includes('VAULT_CUSTODIAN')
  const isLabAnalyst = roles.includes('LAB_ANALYST')
  const newStatus = isVaultCustodian ? 'VAULT_STORED' : isLabAnalyst ? 'LAB_RECEIVED' : 'TRANSFERRED'

  // Execute all DB changes (Supabase doesn't expose raw transactions via REST,
  // so we use the service role client and rely on DB constraints for atomicity)
  const [tokenUpdate, custodyInsert, evidenceUpdate, eventInsert] = await Promise.all([
    adminClient.from('handover_tokens').update({ used_at: now, used_by: user.id }).eq('id', tokenRecord.id),
    adminClient.from('custody_logs').insert({
      id: custodyId,
      evidence_id: evidenceId,
      action: 'RECEIVED',
      sender_id: tokenVerification.sender_id,
      receiver_id: user.id,
      previous_hash: previousHash,
      current_hash: newHash,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      notes: notes ?? null,
      canonical_data: { custody_id: custodyId, evidence_id: evidenceId, action: 'RECEIVED', sender_id: tokenVerification.sender_id, receiver_id: user.id, timestamp: now },
    }),
    adminClient.from('evidence').update({
      current_holder_id: user.id,
      status: newStatus,
    }).eq('id', evidenceId),
    adminClient.from('evidence_events').insert({
      evidence_id: evidenceId,
      case_id: evidence.case_id,
      event_type: 'TRANSFER_COMPLETED',
      actor_id: user.id,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      from_status: evidence.status,
      to_status: newStatus,
      metadata: { custody_id: custodyId, sender_id: tokenVerification.sender_id, custody_hash: newHash },
    }),
  ])

  if (custodyInsert.error || evidenceUpdate.error) {
    return NextResponse.json({ error: 'Custody transfer failed — database error' }, { status: 500 })
  }

  await createAuditLog({
    actor_id: user.id,
    category: 'CUSTODY_TRANSFER',
    action: 'CUSTODY_TRANSFERRED',
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { sender_id: tokenVerification.sender_id, receiver_id: user.id, custody_hash: newHash, new_status: newStatus },
  })

  return NextResponse.json({
    success: true,
    data: {
      evidence_id: evidenceId,
      new_status: newStatus,
      custody_id: custodyId,
      custody_hash: newHash,
      received_at: now,
    },
  })
}
