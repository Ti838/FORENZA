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
    // Unauthorized / Potential Intrusion — Generate Multiple Synthetic Decoy Scatter Locations (Ghost Coordinates Swarm)
    const decoySwarm = [
      { id: 'decoy-1', latitude: 23.8103 + (Math.random() - 0.5) * 0.1, longitude: 90.4125 + (Math.random() - 0.5) * 0.1, accuracy: 100, speed: 45, captured_at: new Date().toISOString(), sequence_number: 1 },
      { id: 'decoy-2', latitude: 22.3569 + (Math.random() - 0.5) * 0.1, longitude: 91.7832 + (Math.random() - 0.5) * 0.1, accuracy: 150, speed: 60, captured_at: new Date().toISOString(), sequence_number: 2 },
      { id: 'decoy-3', latitude: 24.3745 + (Math.random() - 0.5) * 0.1, longitude: 88.6042 + (Math.random() - 0.5) * 0.1, accuracy: 200, speed: 30, captured_at: new Date().toISOString(), sequence_number: 3 },
      { id: 'decoy-4', latitude: 22.8456 + (Math.random() - 0.5) * 0.1, longitude: 89.5403 + (Math.random() - 0.5) * 0.1, accuracy: 120, speed: 50, captured_at: new Date().toISOString(), sequence_number: 4 },
      { id: 'decoy-5', latitude: 24.8949 + (Math.random() - 0.5) * 0.1, longitude: 91.8687 + (Math.random() - 0.5) * 0.1, accuracy: 180, speed: 40, captured_at: new Date().toISOString(), sequence_number: 5 },
    ]

    await createAuditLog({
      actor_id: user.id,
      category: 'SECURITY_EVENT',
      action: 'DECOY_TELEMETRY_SERVED_TO_UNAUTHORIZED_PROBE',
      evidence_id: evidenceId,
      success: true,
      metadata: { probe_user_id: user.id, decoy_points_served: decoySwarm.length },
    })

    return NextResponse.json({ data: decoySwarm, is_decoy: true })
  }

  const { data } = await supabase.from('transit_telemetry')
    .select('id, latitude, longitude, accuracy, altitude, speed, heading, captured_at, sequence_number')
    .eq('evidence_id', evidenceId)
    .order('sequence_number', { ascending: true })

  return NextResponse.json({ data: data ?? [] })
}
