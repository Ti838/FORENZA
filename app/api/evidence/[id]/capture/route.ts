import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { generateEvidenceHash, EvidenceHashInput } from '@/lib/crypto/evidence-hash'
import { extendCustodyChain, GENESIS_HASH, CustodyEventInput } from '@/lib/crypto/custody-chain'
import { verifyGeofence } from '@/lib/geofence'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const captureSchema = z.object({
  timestamp_utc: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  gps_accuracy: z.number().min(0),
  compass_heading: z.number().min(0).max(360).optional(),
  media_type: z.enum(['PHOTO', 'VIDEO']),
  mime_type: z.string().min(1),
  file_size_bytes: z.number().positive(),
  file_sha256: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid SHA-256 format'),
  storage_path: z.string().min(1),
  override_id: z.string().uuid().optional(),
})

// POST /api/evidence/:id/capture
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:capture')) {
    return NextResponse.json({ error: 'Forbidden — only INVESTIGATING_OFFICER can capture evidence' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = captureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Fetch evidence + case
  const { data: evidence } = await supabase.from('evidence')
    .select('*, case:cases(id, crime_scene_latitude, crime_scene_longitude)')
    .eq('id', evidenceId).single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 })
  if (evidence.status !== 'REGISTERED') {
    return NextResponse.json({ error: `Cannot capture: evidence is in ${evidence.status} state` }, { status: 409 })
  }
  if (evidence.registered_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden — you did not register this evidence' }, { status: 403 })
  }

  const { latitude, longitude, timestamp_utc, media_type, mime_type, file_size_bytes, file_sha256, storage_path, compass_heading, gps_accuracy, override_id } = parsed.data
  const caseData = evidence.case as any

  // --- Geofence verification ---
  let geofenceVerified = false
  let distanceMeters = 0

  if (caseData?.crime_scene_latitude && caseData?.crime_scene_longitude) {
    const geofenceRadius = parseInt(process.env.GEOFENCE_DEFAULT_RADIUS_METERS ?? '500', 10)
    const geo = verifyGeofence(latitude, longitude, caseData.crime_scene_latitude, caseData.crime_scene_longitude, geofenceRadius)
    distanceMeters = geo.distance_meters
    geofenceVerified = geo.result === 'PERIMETER_VERIFIED'

    // Block if outside perimeter and no approved override
    if (!geofenceVerified && !override_id) {
      return NextResponse.json({
        error: 'GEOFENCE_VIOLATION',
        message: `Capture location is ${Math.round(distanceMeters)}m from crime scene (limit: ${geofenceRadius}m). A supervisor override is required.`,
        distance_meters: distanceMeters,
        allowed_radius_meters: geofenceRadius,
      }, { status: 422 })
    }

    // Verify override if provided
    if (override_id) {
      const { data: override } = await adminClient.from('supervisor_overrides')
        .select('id, status').eq('id', override_id).eq('evidence_id', evidenceId).single()
      if (!override || override.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Invalid or unapproved supervisor override' }, { status: 422 })
      }
    }
  } else {
    // No crime scene GPS — allow capture but mark as unverified
    geofenceVerified = false
  }

  // --- Insert media record ---
  const { data: mediaRecord, error: mediaError } = await adminClient.from('evidence_media').insert({
    evidence_id: evidenceId,
    media_type,
    mime_type,
    storage_path,
    file_size_bytes,
    file_sha256,
    captured_by: user.id,
    captured_at: timestamp_utc,
    is_primary: true,
  }).select().single()

  if (mediaError) return NextResponse.json({ error: 'Failed to record media metadata' }, { status: 500 })

  // --- Update evidence with capture metadata ---
  const { error: evidenceError } = await adminClient.from('evidence').update({
    status: 'CAPTURED',
    captured_by: user.id,
    captured_at: timestamp_utc,
    capture_latitude: latitude,
    capture_longitude: longitude,
    capture_gps_accuracy: gps_accuracy,
    capture_compass_heading: compass_heading ?? null,
    capture_distance_meters: distanceMeters,
    geofence_verified: geofenceVerified,
    geofence_override_id: override_id ?? null,
  }).eq('id', evidenceId)

  if (evidenceError) return NextResponse.json({ error: 'Failed to update evidence capture data' }, { status: 500 })

  // --- Create evidence event ---
  await adminClient.from('evidence_events').insert({
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    event_type: 'CAPTURED',
    actor_id: user.id,
    latitude,
    longitude,
    from_status: 'REGISTERED',
    to_status: 'CAPTURED',
    metadata: { media_id: mediaRecord.id, geofence_verified: geofenceVerified, distance_meters: distanceMeters },
  })

  // --- Create genesis custody log ---
  const custodyEventInput: CustodyEventInput = {
    custody_id: crypto.randomUUID(),
    evidence_id: evidenceId,
    action: 'CAPTURED',
    sender_id: null,
    receiver_id: user.id,
    timestamp: timestamp_utc,
    latitude,
    longitude,
  }

  const custodyHash = await extendCustodyChain(GENESIS_HASH, custodyEventInput)
  const canonicalData = {
    custody_id: custodyEventInput.custody_id,
    evidence_id: evidenceId,
    action: 'CAPTURED',
    receiver_id: user.id,
    timestamp: timestamp_utc,
  }

  await adminClient.from('custody_logs').insert({
    id: custodyEventInput.custody_id,
    evidence_id: evidenceId,
    action: 'CAPTURED',
    sender_id: null,
    receiver_id: user.id,
    previous_hash: GENESIS_HASH,
    current_hash: custodyHash,
    latitude,
    longitude,
    location_accuracy: gps_accuracy,
    canonical_data: canonicalData,
  })

  await createAuditLog({
    actor_id: user.id,
    category: 'EVIDENCE_MANAGEMENT',
    action: 'EVIDENCE_CAPTURED',
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { media_id: mediaRecord.id, geofence_verified: geofenceVerified, latitude, longitude },
  })

  return NextResponse.json({
    success: true,
    data: {
      evidence_id: evidenceId,
      media_id: mediaRecord.id,
      geofence_verified: geofenceVerified,
      distance_meters: distanceMeters,
      status: 'CAPTURED',
    },
  })
}
