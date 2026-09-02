import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const registerSampleSchema = z.object({
  sample_number: z.string().min(1).max(50),
  description: z.string().min(2).max(500),
  quantity_unit: z.string().min(1).max(50),
  initial_quantity: z.number().positive(),
  notes: z.string().optional(),
})

// POST /api/lab/:id/sample — Register a lab sample from evidence
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'lab:register_sample')) {
    return NextResponse.json({ error: 'Forbidden — LAB_ANALYST only' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const parsed = registerSampleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { data: evidence } = await adminClient.from('evidence')
    .select('id, case_id, status, current_holder_id')
    .eq('id', evidenceId).single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })

  if (!['LAB_RECEIVED', 'UNDER_ANALYSIS'].includes(evidence.status)) {
    return NextResponse.json({ error: `Evidence must be in LAB_RECEIVED or UNDER_ANALYSIS state (currently: ${evidence.status})` }, { status: 409 })
  }

  if (evidence.current_holder_id !== user.id) {
    return NextResponse.json({ error: 'Only the current holder (lab analyst) can register samples' }, { status: 403 })
  }

  // Check sample number uniqueness per evidence
  const { data: existingSample } = await adminClient.from('lab_samples')
    .select('id').eq('evidence_id', evidenceId).eq('sample_number', parsed.data.sample_number).single()
  if (existingSample) {
    return NextResponse.json({ error: 'Sample number already exists for this evidence item' }, { status: 409 })
  }

  const now = new Date().toISOString()

  const { data: sample, error: sampleError } = await adminClient.from('lab_samples').insert({
    evidence_id: evidenceId,
    sample_number: parsed.data.sample_number,
    description: parsed.data.description,
    quantity_unit: parsed.data.quantity_unit,
    initial_quantity: parsed.data.initial_quantity,
    consumed_quantity: 0,
    remaining_quantity: parsed.data.initial_quantity,
    registered_by: user.id,
    registered_at: now,
    notes: parsed.data.notes ?? null,
  }).select().single()

  if (sampleError || !sample) {
    return NextResponse.json({ error: 'Failed to register sample' }, { status: 500 })
  }

  // Update evidence status to UNDER_ANALYSIS if it was just LAB_RECEIVED
  if (evidence.status === 'LAB_RECEIVED') {
    await adminClient.from('evidence').update({ status: 'UNDER_ANALYSIS' }).eq('id', evidenceId)
    await adminClient.from('evidence_events').insert({
      evidence_id: evidenceId, case_id: evidence.case_id, event_type: 'ANALYSIS_STARTED',
      actor_id: user.id, from_status: 'LAB_RECEIVED', to_status: 'UNDER_ANALYSIS',
      metadata: { sample_number: parsed.data.sample_number },
    })
  }

  await adminClient.from('evidence_events').insert({
    evidence_id: evidenceId, case_id: evidence.case_id, event_type: 'SAMPLE_REGISTERED',
    actor_id: user.id, metadata: { sample_id: sample.id, sample_number: parsed.data.sample_number },
  })

  await createAuditLog({
    actor_id: user.id, category: 'LAB_OPERATIONS', action: 'SAMPLE_REGISTERED',
    evidence_id: evidenceId, case_id: evidence.case_id, success: true,
    ip_address, user_agent, request_id,
    metadata: { sample_id: sample.id, sample_number: parsed.data.sample_number, initial_quantity: parsed.data.initial_quantity, unit: parsed.data.quantity_unit },
  })

  return NextResponse.json({ success: true, data: sample }, { status: 201 })
}

// GET /api/lab/:id/sample — List all samples for evidence
export async function GET(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'lab:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: samples, error } = await adminClient.from('lab_samples')
    .select('*, consumption:sample_consumption(*)')
    .eq('evidence_id', evidenceId)
    .order('registered_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch samples' }, { status: 500 })

  return NextResponse.json({ data: samples ?? [] })
}
