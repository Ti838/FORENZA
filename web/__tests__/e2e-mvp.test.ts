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
import { verifyGeofence } from '../lib/geofence'
import { hasPermission } from '../lib/rbac'

describe('FORENZA End-to-End MVP Full Lifecycle Simulation', () => {
  const crimeSceneLat = 40.7128
  const crimeSceneLon = -74.006

  const officerId = '550e8400-e29b-41d4-a716-446655440001'
  const vaultCustodianId = '550e8400-e29b-41d4-a716-446655440002'
  const labAnalystId = '550e8400-e29b-41d4-a716-446655440003'

  const caseId = 'case-2024-001'
  const evidenceId = 'evd-2024-001'
  const evidenceNumber = 'EVD-2024-001'

  it('executes complete 12-step forensic chain of custody lifecycle', async () => {
    // 1. Geofence Check (Officer is 120m away from crime scene)
    const officerCaptureLat = 40.7135
    const officerCaptureLon = -74.005
    const geofenceCheck = verifyGeofence(officerCaptureLat, officerCaptureLon, crimeSceneLat, crimeSceneLon, 500)

    expect(geofenceCheck.result).toBe('PERIMETER_VERIFIED')
    expect(geofenceCheck.distance_meters).toBeLessThanOrEqual(500)

    // 2. Original Media Upload & Server-Side SHA-256
    const simulatedMediaBytes = new TextEncoder().encode('PHYSICAL EVIDENCE PHOTO BYTES 12345')
    const mediaSha256 = '4a533b37207901f5e3f4166bbd241a7e5887e320f84052ec0717202216181f70'

    // 3. Evidence Sealing & Master Hash Calculation
    const hashInput: EvidenceHashInput = {
      evidence_id: evidenceId,
      case_id: caseId,
      evidence_number: evidenceNumber,
      officer_id: officerId,
      timestamp_utc: '2024-01-15T09:00:00.000Z',
      latitude: officerCaptureLat,
      longitude: officerCaptureLon,
      gps_accuracy: 4.5,
      media_sha256: mediaSha256,
      media_type: 'PHOTO',
      mime_type: 'image/jpeg',
      file_size_bytes: simulatedMediaBytes.byteLength,
    }

    const masterHash = await generateEvidenceHash(hashInput)
    expect(masterHash).toHaveLength(64)

    // Verify Master Hash integrity
    const hashVerify = await verifyEvidenceHash(masterHash, hashInput)
    expect(hashVerify.status).toBe('INTEGRITY_VERIFIED')

    // 4. Node 1 Custody: CAPTURED by Officer
    const event1: CustodyChainEvent = {
      id: 'cust-node-1',
      evidence_id: evidenceId,
      action: 'CAPTURED',
      sender_id: null,
      receiver_id: officerId,
      previous_hash: GENESIS_HASH,
      current_hash: '',
      latitude: officerCaptureLat,
      longitude: officerCaptureLon,
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

    // 5. Node 2 Custody: SEALED
    const event2: CustodyChainEvent = {
      id: 'cust-node-2',
      evidence_id: evidenceId,
      action: 'SEALED',
      sender_id: officerId,
      receiver_id: officerId,
      previous_hash: event1.current_hash,
      current_hash: '',
      latitude: officerCaptureLat,
      longitude: officerCaptureLon,
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

    // 6. Node 3 Custody: TRANSFERRED to Vault Custodian
    const event3: CustodyChainEvent = {
      id: 'cust-node-3',
      evidence_id: evidenceId,
      action: 'TRANSFERRED',
      sender_id: officerId,
      receiver_id: vaultCustodianId,
      previous_hash: event2.current_hash,
      current_hash: '',
      latitude: 40.7200,
      longitude: -74.0100,
      canonical_data: {},
      created_at: '2024-01-15T11:00:00.000Z',
    }
    event3.current_hash = await extendCustodyChain(event2.current_hash, {
      custody_id: event3.id,
      evidence_id: event3.evidence_id,
      action: event3.action,
      sender_id: event3.sender_id,
      receiver_id: event3.receiver_id,
      timestamp: event3.created_at,
      latitude: event3.latitude,
      longitude: event3.longitude,
    })

    // 7. Node 4 Custody: VAULT_STORED in Vault Facility #1
    const event4: CustodyChainEvent = {
      id: 'cust-node-4',
      evidence_id: evidenceId,
      action: 'VAULT_STORED',
      sender_id: vaultCustodianId,
      receiver_id: vaultCustodianId,
      previous_hash: event3.current_hash,
      current_hash: '',
      latitude: 40.7200,
      longitude: -74.0100,
      canonical_data: {},
      created_at: '2024-01-15T11:30:00.000Z',
    }
    event4.current_hash = await extendCustodyChain(event3.current_hash, {
      custody_id: event4.id,
      evidence_id: event4.evidence_id,
      action: event4.action,
      sender_id: event4.sender_id,
      receiver_id: event4.receiver_id,
      timestamp: event4.created_at,
      latitude: event4.latitude,
      longitude: event4.longitude,
    })

    // 8. Node 5 Custody: LAB_RECEIVED by Lab Analyst
    const event5: CustodyChainEvent = {
      id: 'cust-node-5',
      evidence_id: evidenceId,
      action: 'LAB_RECEIVED',
      sender_id: vaultCustodianId,
      receiver_id: labAnalystId,
      previous_hash: event4.current_hash,
      current_hash: '',
      latitude: 40.7300,
      longitude: -74.0200,
      canonical_data: {},
      created_at: '2024-01-16T09:00:00.000Z',
    }
    event5.current_hash = await extendCustodyChain(event4.current_hash, {
      custody_id: event5.id,
      evidence_id: event5.evidence_id,
      action: event5.action,
      sender_id: event5.sender_id,
      receiver_id: event5.receiver_id,
      timestamp: event5.created_at,
      latitude: event5.latitude,
      longitude: event5.longitude,
    })

    // 9. Laboratory Aliquot Depletion Calculations
    const initialQuantity = 10.0 // mg
    const consumedFirst = 2.5 // mg
    const consumedSecond = 1.5 // mg
    const totalConsumed = consumedFirst + consumedSecond
    const remainingQuantity = initialQuantity - totalConsumed

    expect(remainingQuantity).toBe(6.0)
    expect(totalConsumed).toBeLessThanOrEqual(initialQuantity)

    // 10. Judicial Integrity Verification Across All 5 Nodes
    const fullChain = [event1, event2, event3, event4, event5]
    const chainVerification = await verifyCustodyChain(fullChain)

    expect(chainVerification.status).toBe('VERIFIED')
    expect(chainVerification.verified_events).toBe(5)
    expect(chainVerification.broken_event_id).toBeNull()

    // 11. Role Authorization Checks for Courtroom
    expect(hasPermission(['JUDGE'], 'judicial:read')).toBe(true)
    expect(hasPermission(['JUDGE'], 'judicial:generate_dossier')).toBe(true)
    expect(hasPermission(['JUDGE'], 'evidence:register')).toBe(false) // Judges cannot mutate

    // 12. Deliberate Tamper Injection Test (Modify event #3 receiver)
    const tamperedEvent3 = {
      ...event3,
      receiver_id: 'malicious-unauthorized-actor-id',
    }

    const tamperedChain = [event1, event2, tamperedEvent3, event4, event5]
    const tamperedResult = await verifyCustodyChain(tamperedChain)

    expect(tamperedResult.status).toBe('BROKEN')
    expect(tamperedResult.broken_event_id).toBe('cust-node-3')
  })
})
