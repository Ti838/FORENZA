import { describe, it, expect } from 'vitest'
import { haversineDistance, verifyGeofence } from '../lib/geofence'

describe('Haversine Distance Calculation', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance(0, 0, 0, 0)).toBe(0)
  })

  it('calculates approximate distance between two points', () => {
    // London to Paris: ~340km
    const dist = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522)
    expect(dist).toBeGreaterThan(340000)
    expect(dist).toBeLessThan(345000)
  })

  it('handles short distances within 500m geofence', () => {
    // ~200m apart (approximately)
    const dist = haversineDistance(48.8566, 2.3522, 48.8584, 2.3522)
    expect(dist).toBeGreaterThan(0)
    expect(dist).toBeLessThan(500)
  })

  it('handles antipodal points (max distance)', () => {
    const dist = haversineDistance(0, 0, 0, 180)
    // Should be approximately 20,015km (half Earth circumference)
    expect(dist).toBeGreaterThan(20_000_000)
    expect(dist).toBeLessThan(20_100_000)
  })
})

describe('Geofence Verification', () => {
  const CRIME_LAT = 48.8566
  const CRIME_LON = 2.3522

  it('verifies capture within 500m radius', () => {
    // ~100m away
    const result = verifyGeofence(48.8575, 2.3522, CRIME_LAT, CRIME_LON, 500)
    expect(result.result).toBe('PERIMETER_VERIFIED')
    expect(result.distance_meters).toBeLessThan(500)
  })

  it('blocks capture outside 500m radius', () => {
    // ~1km away
    const result = verifyGeofence(48.8656, 2.3522, CRIME_LAT, CRIME_LON, 500)
    expect(result.result).toBe('OUTSIDE_PERIMETER')
    expect(result.distance_meters).toBeGreaterThan(500)
  })

  it('returns correct metadata', () => {
    const result = verifyGeofence(48.8575, 2.3522, CRIME_LAT, CRIME_LON, 500)
    expect(result.capture_latitude).toBe(48.8575)
    expect(result.capture_longitude).toBe(2.3522)
    expect(result.crime_scene_latitude).toBe(CRIME_LAT)
    expect(result.allowed_radius_meters).toBe(500)
    expect(result.verified_at).toBeTruthy()
  })

  it('works with custom radius', () => {
    // ~400m apart (within 1000m but outside default 500m)
    const result = verifyGeofence(48.8566, 2.3590, CRIME_LAT, CRIME_LON, 1000)
    expect(result.result).toBe('PERIMETER_VERIFIED')
  })
})
