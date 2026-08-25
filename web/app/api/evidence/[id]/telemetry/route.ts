import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const telemetrySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  altitude: z.number().optional(),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  captured_at: z.string().datetime(),
  sequence_number: z.number().int().min(0),
})

// POST /api/evidence/:id/telemetry
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Log suspicious unauthorized telemetry attempt
    await createAuditLog({
      category: 'SECURITY_EVENT',
      action: 'UNAUTHORIZED_TELEMETRY_ATTEMPT',
      success: false,
      ip_address,
      user_agent,
      request_id,
      metadata: { evidence_id: evidenceId },
    })
    // Return decoy response — not revealing authorization failure reason
    return NextResponse.json({ success: true, message: 'Telemetry recorded' }, { status: 200 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const parsed = telemetrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Verify the submitter is the current evidence holder AND evidence is IN_TRANSIT
  const { data: evidence } = await adminClient.from('evidence')
    .select('id, status, current_holder_id, case_id')
    .eq('id', evidenceId).single()

  if (!evidence || evidence.current_holder_id !== user.id || evidence.status !== 'IN_TRANSIT') {
    // Suspicious — authenticated user submitting telemetry for evidence they don't hold
    await createAuditLog({
      actor_id: user.id,
      category: 'SECURITY_EVENT',
      action: 'UNAUTHORIZED_TELEMETRY_SUBMISSION',
      evidence_id: evidenceId,
      success: false,
      ip_address, user_agent, request_id,
      metadata: {
        evidence_status: evidence?.status ?? 'not_found',
        current_holder: evidence?.current_holder_id ?? null,
        submitter: user.id,
      },
    })
    // Return decoy/generic response — do not reveal real evidence state
    return NextResponse.json({ success: true, message: 'Telemetry recorded' }, { status: 200 })
  }

  const { latitude, longitude, accuracy, altitude, speed, heading, captured_at, sequence_number } = parsed.data

  await adminClient.from('transit_telemetry').insert({
    evidence_id: evidenceId,
    custodian_id: user.id,
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    altitude: altitude ?? null,
    speed: speed ?? null,
    heading: heading ?? null,
    captured_at,
    sequence_number,
  })

  return NextResponse.json({ success: true })
}

// GET /api/evidence/:id/telemetry — route data for maps
export async function GET(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  const allowedRoles = ['ADMIN', 'SUPERVISOR', 'JUDGE', 'AUDITOR', 'VAULT_CUSTODIAN', 'LAB_ANALYST']
  if (!roles.some((r: string) => allowedRoles.includes(r))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data } = await supabase.from('transit_telemetry')
    .select('id, latitude, longitude, accuracy, altitude, speed, heading, captured_at, sequence_number')
    .eq('evidence_id', evidenceId)
    .order('sequence_number', { ascending: true })

  return NextResponse.json({ data: data ?? [] })
}
