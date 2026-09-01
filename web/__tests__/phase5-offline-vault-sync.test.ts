import { describe, it, expect } from 'vitest'
import * as nodeCrypto from 'crypto'
import { OfflineVaultEngine } from '../lib/vault/offline-vault'
import { OfflineSyncEngine, OfflineSyncPayload } from '../lib/sync/sync-engine'
import { Ed25519Signer } from '../lib/crypto/signatures'
import { DeviceKeyRecord } from '../lib/device/device-trust'
import { EvidenceStateNode } from '../lib/state/evidence-state-engine'

describe('Phase 5: Offline Forensic Vault & Conflict-Resilient Sync', () => {
  const deviceVaultKey = nodeCrypto.randomBytes(32)
  const deviceKeys = Ed25519Signer.generateKeyPair()

  const trustedDeviceRecord: DeviceKeyRecord = {
    id: 'DEV-REC-01',
    device_id: 'DEV-MOBILE-FIELD-01',
    user_id: 'OFFICER-ALICE',
    device_public_key: deviceKeys.publicKeyHex,
    algorithm: 'Ed25519',
    key_version: 1,
    platform: 'android',
    device_type: 'FIELD_MOBILE',
    attestation_status: 'HARDWARE_ATTESTED',
    status: 'TRUSTED',
    registered_at: '2026-09-01T00:00:00Z',
    last_seen_at: '2026-09-01T00:00:00Z',
  }

  describe('FZ-VAULT Offline Authenticated Encryption Engine (AES-256-GCM)', () => {
    it('should seal and verify offline evidence with AES-256-GCM', async () => {
      const rawMedia = new TextEncoder().encode('CONFIDENTIAL_FORENSIC_OFFLINE_CAPTURE_RAW_JPEG')

      const vaultItem = await OfflineVaultEngine.sealOfflineEvidence(
        'EV-OFFLINE-001',
        'CASE-100',
        1,
        'DEV-MOBILE-FIELD-01',
        'OFFICER-ALICE',
        rawMedia,
        deviceKeys.privateKeyHex,
        deviceVaultKey,
        { latitude: 51.5074, longitude: -0.1278 }
      )

      expect(vaultItem.auth_tag_hex).toBeDefined()
      expect(vaultItem.encrypted_ciphertext_hex).toBeDefined()
      expect(vaultItem.signature).toBeDefined()

      // Verification of intact vault item
      const verification = await OfflineVaultEngine.verifyOfflineVaultItem(
        vaultItem,
        deviceKeys.publicKeyHex,
        deviceVaultKey
      )
      expect(verification.isValid).toBe(true)

      // Tampering in ciphertext must fail AES-GCM authentication
      const tamperedItem = {
        ...vaultItem,
        encrypted_ciphertext_hex: vaultItem.encrypted_ciphertext_hex.slice(0, -2) + 'ff',
      }
      const tamperedVerification = await OfflineVaultEngine.verifyOfflineVaultItem(
        tamperedItem,
        deviceKeys.publicKeyHex,
        deviceVaultKey
      )
      expect(tamperedVerification.isValid).toBe(false)
      expect(tamperedVerification.failureReason).toContain('AES-GCM authentication tag')
    })
  })

  describe('FZ-SYNC Replay & Rollback-Proof Sync Engine', () => {
    it('should accept valid sync, reject untrusted device, reject rollback, and quarantine conflicts', async () => {
      const stateHash = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899'
      const signature = Ed25519Signer.sign(stateHash, deviceKeys.privateKeyHex)

      const basePayload: OfflineSyncPayload = {
        event_id: 'EVT-SYNC-01',
        evidence_id: 'EV-01',
        device_id: 'DEV-MOBILE-FIELD-01',
        local_sequence: 10,
        device_timestamp_utc: '2026-09-01T12:00:00Z',
        parent_state_id: 'STATE-ROOT-00',
        event_type: 'OFFLINE_EVIDENCE_SEALED',
        event_data: { note: 'Captured in emergency offline zone' },
        event_hash: '112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
        state_hash: stateHash,
        signature,
        key_id: 'KEY-DEV-01',
      }

      const serverStateRoot: EvidenceStateNode = {
        state_id: 'STATE-ROOT-00',
        evidence_id: 'EV-01',
        parent_state_id: null,
        event_type: 'INITIAL_REGISTRATION',
        actor_id: 'OFFICER-ALICE',
        device_id: 'DEV-MOBILE-FIELD-01',
        timestamp_utc: '2026-09-01T11:00:00Z',
        latitude: null,
        longitude: null,
        event_data: {},
        previous_state_hash: null,
        event_hash: 'abc',
        state_hash: 'def',
        signature: 'sig',
        signature_algorithm: 'Ed25519',
        key_id: 'k1',
        canonicalization_version: 'RFC8785_v1',
        created_at: '2026-09-01T11:00:00Z',
      }

      const processedIds = new Set<string>()

      // 1. Normal sync acceptance
      const result1 = await OfflineSyncEngine.processSyncEvent(
        basePayload,
        trustedDeviceRecord,
        serverStateRoot,
        processedIds,
        9 // last sequence was 9, payload is 10
      )
      expect(result1.status).toBe('ACCEPTED')
      processedIds.add(basePayload.event_id)

      // 2. Duplicate sync ignore
      const resultDup = await OfflineSyncEngine.processSyncEvent(
        basePayload,
        trustedDeviceRecord,
        serverStateRoot,
        processedIds,
        10
      )
      expect(resultDup.status).toBe('DUPLICATE_IGNORED')

      // 3. Rollback sequence rejection
      const rollbackPayload: OfflineSyncPayload = {
        ...basePayload,
        event_id: 'EVT-SYNC-02',
        local_sequence: 8, // sequence rollback!
      }
      const resultRollback = await OfflineSyncEngine.processSyncEvent(
        rollbackPayload,
        trustedDeviceRecord,
        serverStateRoot,
        processedIds,
        10 // last known sequence is 10
      )
      expect(resultRollback.status).toBe('REJECTED_SEQUENCE_ROLLBACK')

      // 4. Untrusted / Revoked Device rejection
      const revokedDevice = { ...trustedDeviceRecord, status: 'REVOKED' as const }
      const resultUntrusted = await OfflineSyncEngine.processSyncEvent(
        { ...basePayload, event_id: 'EVT-SYNC-03', local_sequence: 11 },
        revokedDevice,
        serverStateRoot,
        processedIds,
        10
      )
      expect(resultUntrusted.status).toBe('REJECTED_UNTRUSTED_DEVICE')

      // 5. Parent state mismatch -> Quarantine into Branch (no silent overwrite)
      const serverAdvancedState: EvidenceStateNode = {
        ...serverStateRoot,
        state_id: 'STATE-SERVER-ADVANCED-01',
      }
      const resultFork = await OfflineSyncEngine.processSyncEvent(
        {
          ...basePayload,
          event_id: 'EVT-SYNC-04',
          local_sequence: 12,
          parent_state_id: 'STATE-OBSOLETE-PARENT',
        },
        trustedDeviceRecord,
        serverAdvancedState,
        processedIds,
        10
      )
      expect(resultFork.status).toBe('QUARANTINED_CONFLICT')
      expect(resultFork.branch_created).toBe(true)
    })
  })
})
