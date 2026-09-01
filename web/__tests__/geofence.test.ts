import { describe, it, expect } from 'vitest'
import { haversineDistance, verifyGeofence, detectGpsFluctuationAndSpoofing, generateCloakedHoneyLocations } from '../lib/geofence'

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

describe('GPS Spoofing & Multi-Location Fluctuation Detection', () => {
  it('detects impossible velocity teleportation (>162 km/h)', () => {
    const now = Date.now()
    const trail = [
      { latitude: 48.8566, longitude: 2.3522, timestamp_ms: now },
      { latitude: 51.5074, longitude: -0.1278, timestamp_ms: now + 5000 }, // 340km in 5 seconds
    ]
    const analysis = detectGpsFluctuationAndSpoofing(trail)
    expect(analysis.is_spoofed).toBe(true)
    expect(analysis.anomaly_type).toBe('IMPOSSIBLE_VELOCITY')
    expect(analysis.confidence_score).toBeGreaterThan(0.9)
  })

  it('detects erratic multi-location fluctuation across 20+ jump points', () => {
    const now = Date.now()
    const trail = []
    for (let i = 0; i < 25; i++) {
      // Alternating coordinates jumping 1km back and forth every 500ms
      trail.push({
        latitude: 48.8566 + (i % 2 === 0 ? 0.01 : -0.01),
        longitude: 2.3522 + (i % 2 === 0 ? 0.01 : -0.01),
        timestamp_ms: now + i * 500,
      })
    }
    const analysis = detectGpsFluctuationAndSpoofing(trail)
    expect(analysis.is_spoofed).toBe(true)
    expect(analysis.anomaly_type).toBe('IMPOSSIBLE_VELOCITY')
  })

  it('verifies physically consistent officer pedestrian movement', () => {
    const now = Date.now()
    const trail = [
      { latitude: 48.8566, longitude: 2.3522, timestamp_ms: now },
      { latitude: 48.8567, longitude: 2.3523, timestamp_ms: now + 10000 }, // ~15m in 10s (walking speed)
      { latitude: 48.8568, longitude: 2.3524, timestamp_ms: now + 20000 },
    ]
    const analysis = detectGpsFluctuationAndSpoofing(trail)
    expect(analysis.is_spoofed).toBe(false)
    expect(analysis.fluctuation_count).toBe(0)
  })
})

describe('Tactical Location Cloaking & Honey-Decoy Fluctuation Defense', () => {
  it('generates 20+ fluctuating phantom decoy coordinates around the real origin', () => {
    const realLat = 23.8103
    const realLon = 90.4125
    const mesh = generateCloakedHoneyLocations(realLat, realLon, 25, 10)

    expect(mesh.is_stealth_active).toBe(true)
    expect(mesh.decoy_count).toBe(25)
    expect(mesh.cloaked_broadcast_points.length).toBe(25)

    // Check that all 25 decoy points are within the 10km noise radius but physically dispersed
    mesh.cloaked_broadcast_points.forEach((point) => {
      const dist = haversineDistance(realLat, realLon, point.latitude, point.longitude)
      expect(dist).toBeLessThanOrEqual(12000) // Within noise radius bounds
      expect(point.label).toMatch(/^DECOY_NODE_/)
    })
  })
})


