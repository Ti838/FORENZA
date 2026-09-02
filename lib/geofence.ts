/**
 * FORENZA — Geofence Verification
 *
 * Haversine formula for GPS distance calculation.
 * Used to enforce the evidence capture perimeter.
 */

const EARTH_RADIUS_METERS = 6_371_000

/**
 * Convert degrees to radians.
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate the great-circle distance between two GPS coordinates
 * using the Haversine formula.
 *
 * @param lat1 - Latitude of point 1 (degrees)
 * @param lon1 - Longitude of point 1 (degrees)
 * @param lat2 - Latitude of point 2 (degrees)
 * @param lon2 - Longitude of point 2 (degrees)
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = toRadians(lat1)
  const φ2 = toRadians(lat2)
  const Δφ = toRadians(lat2 - lat1)
  const Δλ = toRadians(lon2 - lon1)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

export type GeofenceResult = 'PERIMETER_VERIFIED' | 'OUTSIDE_PERIMETER'

export interface GeofenceVerification {
  result: GeofenceResult
  distance_meters: number
  allowed_radius_meters: number
  capture_latitude: number
  capture_longitude: number
  crime_scene_latitude: number
  crime_scene_longitude: number
  verified_at: string
}

/**
 * Verify whether a capture location is within the crime scene perimeter.
 *
 * @param captureLat - Officer's capture latitude
 * @param captureLon - Officer's capture longitude
 * @param crimeLat - Crime scene latitude
 * @param crimeLon - Crime scene longitude
 * @param radiusMeters - Allowed radius (default: 500m per spec)
 */
export function verifyGeofence(
  captureLat: number,
  captureLon: number,
  crimeLat: number,
  crimeLon: number,
  radiusMeters: number = 500
): GeofenceVerification {
  const distance = haversineDistance(captureLat, captureLon, crimeLat, crimeLon)
  const verified = distance <= radiusMeters

  return {
    result: verified ? 'PERIMETER_VERIFIED' : 'OUTSIDE_PERIMETER',
    distance_meters: Math.round(distance * 100) / 100,
    allowed_radius_meters: radiusMeters,
    capture_latitude: captureLat,
    capture_longitude: captureLon,
    crime_scene_latitude: crimeLat,
    crime_scene_longitude: crimeLon,
    verified_at: new Date().toISOString(),
  }
}

export interface GpsTelemetryPoint {
  latitude: number
  longitude: number
  timestamp_ms: number
}

export interface GpsSpoofingAnalysis {
  is_spoofed: boolean
  anomaly_type?: 'RAPID_FLUCTUATION' | 'IMPOSSIBLE_VELOCITY' | 'MOCK_LOCATION_JITTER'
  fluctuation_count: number
  max_velocity_mps: number
  confidence_score: number
  reason: string
}

/**
 * Detect GPS Spoofing, Mock Location hops, and multi-location erratic fluctuation.
 * Flags attacks where coordinates jump across 20+ artificial locations or exhibit impossible velocity.
 */
export function detectGpsFluctuationAndSpoofing(
  telemetryTrail: GpsTelemetryPoint[],
  maxAllowedSpeedMps: number = 45.0 // ~162 km/h
): GpsSpoofingAnalysis {
  if (!telemetryTrail || telemetryTrail.length < 2) {
    return {
      is_spoofed: false,
      fluctuation_count: 0,
      max_velocity_mps: 0,
      confidence_score: 1.0,
      reason: 'Insufficient telemetry points for statistical anomaly detection.',
    }
  }

  let maxVelocity = 0
  let erraticJumps = 0

  for (let i = 1; i < telemetryTrail.length; i++) {
    const p1 = telemetryTrail[i - 1]
    const p2 = telemetryTrail[i]
    const distMeters = haversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
    const timeDeltaSec = Math.max(0.001, (p2.timestamp_ms - p1.timestamp_ms) / 1000)
    const velocityMps = distMeters / timeDeltaSec

    if (velocityMps > maxVelocity) {
      maxVelocity = velocityMps
    }

    // Erratic jump: Sudden displacement of > 500 meters in under 2 seconds
    if (distMeters > 500 && timeDeltaSec < 2) {
      erraticJumps++
    }
  }

  // 1. Check for Impossible Velocity / Teleportation
  if (maxVelocity > maxAllowedSpeedMps) {
    return {
      is_spoofed: true,
      anomaly_type: 'IMPOSSIBLE_VELOCITY',
      fluctuation_count: erraticJumps,
      max_velocity_mps: Math.round(maxVelocity * 100) / 100,
      confidence_score: 0.99,
      reason: `Impossible velocity detected: ${Math.round(maxVelocity * 3.6)} km/h exceeds physical boundary.`,
    }
  }

  // 2. Check for multi-location erratic fluctuation (e.g. > 10 erratic jumps across 20 points)
  if (erraticJumps >= 5 || (telemetryTrail.length >= 20 && erraticJumps >= 3)) {
    return {
      is_spoofed: true,
      anomaly_type: 'RAPID_FLUCTUATION',
      fluctuation_count: erraticJumps,
      max_velocity_mps: Math.round(maxVelocity * 100) / 100,
      confidence_score: 0.95,
      reason: `Multi-location GPS fluctuation detected across ${telemetryTrail.length} telemetry points.`,
    }
  }

  return {
    is_spoofed: false,
    fluctuation_count: erraticJumps,
    max_velocity_mps: Math.round(maxVelocity * 100) / 100,
    confidence_score: 0.98,
    reason: 'GPS telemetry trajectory is physically consistent and continuous.',
  }
}

export interface CloakedGpsMesh {
  cloaked_broadcast_points: Array<{ latitude: number; longitude: number; label: string }>
  decoy_count: number
  is_stealth_active: boolean
  noise_radius_km: number
  cloaked_at: string
}

/**
 * Tactical Location Cloaking & Honey-Decoy Generator
 * Generates 20+ dynamic fluctuating decoy locations across a randomized mesh
 * so adversaries intercepting network traffic or sniffing telemetry see erratic
 * fluctuating phantom coordinates and cannot pinpoint the officer's true physical location.
 */
export function generateCloakedHoneyLocations(
  realLat: number,
  realLon: number,
  decoyCount: number = 20,
  noiseRadiusKm: number = 15
): CloakedGpsMesh {
  const decoys: Array<{ latitude: number; longitude: number; label: string }> = []
  
  // 1 degree latitude ~ 111km
  const latDelta = noiseRadiusKm / 111.0
  const lonDelta = noiseRadiusKm / (111.0 * Math.cos(realLat * (Math.PI / 180)))

  for (let i = 0; i < decoyCount; i++) {
    // Generate pseudo-random scattered points across multiple quadrants
    const angle = (i * (360 / decoyCount) + (i * 17)) * (Math.PI / 180)
    const distanceFactor = 0.3 + ((i * 37) % 70) / 100 // 0.3 to 1.0 radius

    const phantomLat = realLat + Math.sin(angle) * latDelta * distanceFactor
    const phantomLon = realLon + Math.cos(angle) * lonDelta * distanceFactor

    decoys.push({
      latitude: Math.round(phantomLat * 100000) / 100000,
      longitude: Math.round(phantomLon * 100000) / 100000,
      label: `DECOY_NODE_${String(i + 1).padStart(2, '0')}`,
    })
  }

  // Shuffle decoys so the order constantly fluctuates
  for (let i = decoys.length - 1; i > 0; i--) {
    const j = (i * 13) % decoys.length
    const temp = decoys[i]
    decoys[i] = decoys[j]
    decoys[j] = temp
  }

  return {
    cloaked_broadcast_points: decoys,
    decoy_count: decoys.length,
    is_stealth_active: true,
    noise_radius_km: noiseRadiusKm,
    cloaked_at: new Date().toISOString(),
  }
}


