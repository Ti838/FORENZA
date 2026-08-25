import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { generateHandoverToken } from '@/lib/tokens'
import { extendCustodyChain, GENESIS_HASH, CustodyEventInput } from '@/lib/crypto/custody-chain'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const transferSchema = z.object({
  notes: z.string().optional(),
})

// POST /api/evidence/:id/transfer — Sender generates handover token
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:transfer_initiate')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = transferSchema.safeParse(body ?? {})
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 422 })

  // Verify evidence exists, sender is current holder, and evidence is SEALED
  const { data: evidence } = await supabase.from('evidence')
    .select('id, case_id, status, current_holder_id, evidence_number')
    .eq('id', evidenceId).single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 })
  if (evidence.current_holder_id !== user.id) {
    return NextResponse.json({ error: 'You are not the current holder of this evidence' }, { status: 403 })
  }
  if (!['SEALED', 'VAULT_STORED', 'ANALYSIS_COMPLETED', 'TRANSFERRED'].includes(evidence.status)) {
    return NextResponse.json({ error: `Evidence must be in a transferable state (currently: ${evidence.status})` }, { status: 409 })
  }

  // Generate handover token
  const tokenId = crypto.randomUUID()
  const { token, tokenHash, expiresAt } = await generateHandoverToken(evidenceId, user.id, tokenId)

  // Revoke any existing unused handover tokens for this evidence
  await adminClient.from('handover_tokens')
    .update({ is_revoked: true })
    .eq('evidence_id', evidenceId)
    .is('used_at', null)
    .eq('is_revoked', false)

  // Store new handover token
  await adminClient.from('handover_tokens').insert({
    id: tokenId,
    evidence_id: evidenceId,
    sender_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  // Evidence event — TRANSFER_INITIATED
  await adminClient.from('evidence_events').insert({
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    event_type: 'TRANSFER_INITIATED',
    actor_id: user.id,
    metadata: { handover_token_id: tokenId, expires_at: expiresAt.toISOString() },
  })

  await createAuditLog({
    actor_id: user.id,
    category: 'CUSTODY_TRANSFER',
    action: 'TRANSFER_TOKEN_GENERATED',
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { token_id: tokenId, expires_at: expiresAt.toISOString() },
  })

  return NextResponse.json({
    success: true,
    data: {
      handover_token: token,    // JWT — returned once only
      token_id: tokenId,
      expires_at: expiresAt.toISOString(),
      evidence_number: evidence.evidence_number,
    },
  })
}
