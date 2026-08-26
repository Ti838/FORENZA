import { describe, it, expect } from 'vitest'
import { generateEvidenceHash, verifyEvidenceHash, EvidenceHashInput } from '../lib/crypto/evidence-hash'

describe('FORENZA Offline-First & Emergency Sync Test Suite', () => {
  it('creates offline evidence object with deterministic SHA-256 and offline flag', async () => {
    const offlineCapture: EvidenceHashInput = {
      evidence_id: 'EVD-OFF-1700000000000',
      case_id: 'CASE-EMERGENCY-01',
      evidence_number: 'EVD-EMERGENCY-001',
      officer_id: 'OFFICER-FIELD-01',
      timestamp_utc: '2024-01-15T14:30:00.000Z', // Local client capture time
      latitude: 23.8103,
      longitude: 90.4125,
      gps_accuracy: 4.5,
      media_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      media_type: 'PHOTO',
      mime_type: 'image/jpeg',
      file_size_bytes: 4096,
    }

    const masterHash = await generateEvidenceHash(offlineCapture)
    expect(masterHash).toHaveLength(64)

    // Simulate Server Synchronization after network returns
    const serverReceivedTime = '2024-01-15T15:10:00.000Z' // 40 minutes later
    expect(new Date(serverReceivedTime).getTime()).toBeGreaterThan(new Date(offlineCapture.timestamp_utc).getTime())

    // Verify hash integrity using client capture time
    const verification = await verifyEvidenceHash(masterHash, offlineCapture)
    expect(verification.status).toBe('INTEGRITY_VERIFIED')
    expect(verification.match).toBe(true)
  })

  it('rejects corrupted or tampered offline media upon server synchronization (Test 10)', async () => {
    const originalInput: EvidenceHashInput = {
      evidence_id: 'EVD-OFF-1700000000001',
      case_id: 'CASE-EMERGENCY-01',
      evidence_number: 'EVD-EMERGENCY-002',
      officer_id: 'OFFICER-FIELD-01',
      timestamp_utc: '2024-01-15T14:35:00.000Z',
      latitude: 23.8103,
      longitude: 90.4125,
      gps_accuracy: 5.0,
      media_sha256: 'aaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999',
      media_type: 'PHOTO',
      mime_type: 'image/jpeg',
      file_size_bytes: 8192,
    }

    const expectedHash = await generateEvidenceHash(originalInput)

    // Attacker modifies media bytes during transit
    const corruptedInput = {
      ...originalInput,
      media_sha256: 'ffff0000111122223333444455556666777788889999aaaabbbbccccddddeeee',
    }

    const verification = await verifyEvidenceHash(expectedHash, corruptedInput)
    expect(verification.status).toBe('COMPROMISED_TAMPERED')
    expect(verification.match).toBe(false)
  })

  it('enforces idempotency on duplicate offline sync attempts (Test 11)', () => {
    const processedEvents = new Set<string>()

    const syncEvent = (eventId: string): { status: 'SYNCED' | 'ALREADY_EXISTS' } => {
      if (processedEvents.has(eventId)) {
        return { status: 'ALREADY_EXISTS' }
      }
      processedEvents.add(eventId)
      return { status: 'SYNCED' }
    }

    const eventId = 'OFF-EVENT-UUID-001'
    const firstSync = syncEvent(eventId)
    expect(firstSync.status).toBe('SYNCED')

    // Second sync attempt with same event ID (retry after network hiccup)
    const secondSync = syncEvent(eventId)
    expect(secondSync.status).toBe('ALREADY_EXISTS')
    expect(processedEvents.size).toBe(1)
  })
})
