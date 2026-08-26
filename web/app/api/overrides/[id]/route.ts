import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const decisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  decision_notes: z.string().optional(),
})

// PATCH /api/overrides/:id — Supervisor approve or reject override
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: overrideId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'override:approve')) {
    return NextResponse.json({ error: 'Forbidden — SUPERVISOR or ADMIN only' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = decisionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { status, decision_notes } = parsed.data

  const { data: overrideRecord } = await adminClient
    .from('supervisor_overrides')
    .select('*, evidence:evidence(id, case_id, status)')
    .eq('id', overrideId)
    .single()

  if (!overrideRecord) return NextResponse.json({ error: 'Override not found' }, { status: 404 })
  if (overrideRecord.status !== 'PENDING') {
    return NextResponse.json({ error: `Override has already been decided (${overrideRecord.status})` }, { status: 409 })
  }

  const now = new Date().toISOString()

  // Update override
  const { error: updateError } = await adminClient
    .from('supervisor_overrides')
    .update({
      status,
      supervisor_id: user.id,
      decision_notes: decision_notes ?? null,
      decided_at: now,
    })
    .eq('id', overrideId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update override' }, { status: 500 })
  }

  // If approved, update evidence record to attach geofence_override_id and set geofence_verified = true
  if (status === 'APPROVED') {
    await adminClient.from('evidence').update({
      geofence_override_id: overrideId,
      geofence_verified: true,
    }).eq('id', overrideRecord.evidence_id)

    await adminClient.from('evidence_events').insert({
      evidence_id: overrideRecord.evidence_id,
      case_id: overrideRecord.case_id,
      event_type: 'SUPERVISOR_OVERRIDE',
      actor_id: user.id,
      metadata: { override_id: overrideId, decision_notes },
    })
  }

  await createAuditLog({
    actor_id: user.id,
    category: 'EVIDENCE_MANAGEMENT',
    action: `OVERRIDE_${status}`,
    evidence_id: overrideRecord.evidence_id,
    case_id: overrideRecord.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { override_id: overrideId, decision_notes, status },
  })

  return NextResponse.json({
    success: true,
    data: { override_id: overrideId, status, decided_at: now },
  })
}
