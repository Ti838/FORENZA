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
