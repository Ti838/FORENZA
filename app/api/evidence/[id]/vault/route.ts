import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const vaultReceiveSchema = z.object({
  handover_token: z.string().min(1),
  vault_id: z.string().min(1),
  rack: z.string().optional(),
  shelf: z.string().optional(),
  bin: z.string().optional(),
  notes: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

// POST /api/evidence/:id/vault
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'vault:receive')) {
    return NextResponse.json({ error: 'Forbidden — only VAULT_CUSTODIAN can receive evidence' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = vaultReceiveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })

  const { vault_id, rack, shelf, bin, notes, latitude, longitude } = parsed.data

  // Fetch evidence
  const { data: evidence } = await adminClient.from('evidence').select('id, case_id, status, current_holder_id').eq('id', evidenceId).single()
  if (!evidence) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })

  // Must be the current holder (already received via transfer)
  if (evidence.current_holder_id !== user.id) {
    return NextResponse.json({ error: 'You are not the current holder of this evidence' }, { status: 403 })
  }

  if (!['TRANSFERRED', 'IN_TRANSIT', 'VAULT_STORED'].includes(evidence.status)) {
    return NextResponse.json({ error: `Evidence must be in transit state (currently: ${evidence.status})` }, { status: 409 })
  }

  const locationLabel = [vault_id, rack, shelf, bin].filter(Boolean).join(' / ')
  const now = new Date().toISOString()

  // Check if vault location already exists
  const { data: existingVault } = await adminClient.from('vault_locations').select('id').eq('evidence_id', evidenceId).single()
  if (existingVault) {
    return NextResponse.json({ error: 'Evidence already has a vault location recorded' }, { status: 409 })
  }

  // Create vault location record
  await adminClient.from('vault_locations').insert({
    evidence_id: evidenceId,
    vault_id,
    rack: rack ?? null,
    shelf: shelf ?? null,
    bin: bin ?? null,
    location_label: locationLabel,
    stored_at: now,
    custodian_id: user.id,
    notes: notes ?? null,
  })

  // Update evidence status to VAULT_STORED
  await adminClient.from('evidence').update({ status: 'VAULT_STORED' }).eq('id', evidenceId)

  // Evidence event
  await adminClient.from('evidence_events').insert({
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    event_type: 'VAULT_STORED',
    actor_id: user.id,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    from_status: evidence.status,
    to_status: 'VAULT_STORED',
    metadata: { vault_id, location_label: locationLabel },
  })

  await createAuditLog({
    actor_id: user.id,
    category: 'VAULT_OPERATIONS',
    action: 'VAULT_STORED',
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { vault_id, location_label: locationLabel },
  })

  return NextResponse.json({
    success: true,
    data: { evidence_id: evidenceId, status: 'VAULT_STORED', location_label: locationLabel, stored_at: now },
  })
}
