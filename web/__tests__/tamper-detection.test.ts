import { describe, it, expect } from 'vitest'
import {
  generateEvidenceHash,
  verifyEvidenceHash,
  EvidenceHashInput,
} from '../lib/crypto/evidence-hash'
import {
  extendCustodyChain,
  verifyCustodyChain,
  GENESIS_HASH,
  CustodyChainEvent,
} from '../lib/crypto/custody-chain'

describe('FORENZA Cryptographic Tamper Detection Engine', () => {
  const baseInput: EvidenceHashInput = {
    evidence_id: '550e8400-e29b-41d4-a716-446655440000',
    case_id: '660e8400-e29b-41d4-a716-446655440001',
    evidence_number: 'EVD-2024-0001',
    officer_id: '770e8400-e29b-41d4-a716-446655440002',
    timestamp_utc: '2024-01-15T09:00:00.000Z',
    latitude: 40.7128,
    longitude: -74.006,
    gps_accuracy: 5.2,
    media_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    media_type: 'PHOTO',
    mime_type: 'image/jpeg',
    file_size_bytes: 2048576,
  }

  it('verifies genuine, un-tampered evidence hash', async () => {
    const masterHash = await generateEvidenceHash(baseInput)
    const verification = await verifyEvidenceHash(masterHash, baseInput)

    expect(verification.status).toBe('INTEGRITY_VERIFIED')
    expect(verification.match).toBe(true)
  })

  it('detects tampering in GPS coordinates by 0.0001 degrees', async () => {
    const originalMasterHash = await generateEvidenceHash(baseInput)

    const tamperedInput = {
      ...baseInput,
      latitude: 40.7129, // modified by 10 meters
    }

    const verification = await verifyEvidenceHash(originalMasterHash, tamperedInput)
    expect(verification.status).toBe('COMPROMISED_TAMPERED')
    expect(verification.match).toBe(false)
  })

  it('detects tampering in media SHA-256 byte payload', async () => {
    const originalMasterHash = await generateEvidenceHash(baseInput)

    const tamperedInput = {
      ...baseInput,
      media_sha256: 'deadbeef98fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    }

    const verification = await verifyEvidenceHash(originalMasterHash, tamperedInput)
    expect(verification.status).toBe('COMPROMISED_TAMPERED')
    expect(verification.match).toBe(false)
  })

  it('detects custody chain hash link breaks across multi-node handover', async () => {
    // Node 1: CAPTURED
    const event1: CustodyChainEvent = {
      id: 'cust-1',
      evidence_id: baseInput.evidence_id,
      action: 'CAPTURED',
      sender_id: null,
      receiver_id: baseInput.officer_id,
      previous_hash: GENESIS_HASH,
      current_hash: '',
      latitude: 40.7128,
      longitude: -74.006,
      canonical_data: {},
      created_at: '2024-01-15T09:00:00.000Z',
    }
    event1.current_hash = await extendCustodyChain(GENESIS_HASH, {
      custody_id: event1.id,
      evidence_id: event1.evidence_id,
      action: event1.action,
      sender_id: event1.sender_id,
      receiver_id: event1.receiver_id,
      timestamp: event1.created_at,
      latitude: event1.latitude,
      longitude: event1.longitude,
    })

    // Node 2: SEALED
    const event2: CustodyChainEvent = {
      id: 'cust-2',
      evidence_id: baseInput.evidence_id,
      action: 'SEALED',
      sender_id: baseInput.officer_id,
      receiver_id: baseInput.officer_id,
      previous_hash: event1.current_hash,
      current_hash: '',
      latitude: 40.7128,
      longitude: -74.006,
      canonical_data: {},
      created_at: '2024-01-15T09:15:00.000Z',
    }
    event2.current_hash = await extendCustodyChain(event1.current_hash, {
      custody_id: event2.id,
      evidence_id: event2.evidence_id,
      action: event2.action,
      sender_id: event2.sender_id,
      receiver_id: event2.receiver_id,
      timestamp: event2.created_at,
      latitude: event2.latitude,
      longitude: event2.longitude,
    })

    // Valid chain test
    const validResult = await verifyCustodyChain([event1, event2])
    expect(validResult.status).toBe('VERIFIED')
    expect(validResult.verified_events).toBe(2)

    // Simulate illicit alteration of Node 1 timestamp
    const tamperedEvent1 = {
      ...event1,
      created_at: '2024-01-15T08:59:59.000Z',
    }

    const tamperedResult = await verifyCustodyChain([tamperedEvent1, event2])
    expect(tamperedResult.status).toBe('BROKEN')
    expect(tamperedResult.broken_event_id).toBe('cust-1')
  })
})
