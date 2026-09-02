import { describe, it, expect } from 'vitest'
import { canonicalizeJson } from '../lib/crypto/canonical'
import { Ed25519Signer } from '../lib/crypto/signatures'
import { EvidenceSealingEngine, EvidenceMetadata } from '../lib/crypto/manifest'
import { DeviceTrustService, DeviceKeyRecord } from '../lib/device/device-trust'

describe('Phase 1: Cryptographic Engine & Device Trust', () => {
  describe('RFC 8785 Canonical JSON Serialization', () => {
    it('should sort object keys deterministically', () => {
      const objA = { b: 2, a: 1, c: { z: 26, y: 25 } }
      const objB = { a: 1, c: { y: 25, z: 26 }, b: 2 }

      const canonA = canonicalizeJson(objA)
      const canonB = canonicalizeJson(objB)

      expect(canonA).toBe('{"a":1,"b":2,"c":{"y":25,"z":26}}')
      expect(canonA).toBe(canonB)
    })

    it('should handle arrays, primitives, and null correctly', () => {
      const data = {
        evidence_id: 'FZ-2026-001',
        tags: ['weapons', 'ballistics'],
        is_sealed: true,
        count: 3,
        notes: null,
      }
      expect(canonicalizeJson(data)).toBe(
        '{"count":3,"evidence_id":"FZ-2026-001","is_sealed":true,"notes":null,"tags":["weapons","ballistics"]}'
      )
    })
  })

  describe('Ed25519 Asymmetric Signatures', () => {
    it('should generate valid Ed25519 keypairs, sign, and verify messages', () => {
      const keys = Ed25519Signer.generateKeyPair()
      expect(keys.publicKeyHex).toBeDefined()
      expect(keys.privateKeyHex).toBeDefined()

      const message = 'FORENZA_CANONICAL_HASH_1234567890abcdef'
      const signatureHex = Ed25519Signer.sign(message, keys.privateKeyHex)

      expect(signatureHex).toBeDefined()
      expect(signatureHex.length).toBeGreaterThan(64)

      const isValid = Ed25519Signer.verify(message, signatureHex, keys.publicKeyHex)
      expect(isValid).toBe(true)

      // Signature verification fails if message is modified
      const isTamperedValid = Ed25519Signer.verify(
        message + '_tampered',
        signatureHex,
        keys.publicKeyHex
      )
      expect(isTamperedValid).toBe(false)
    })
  })

  describe('FZ-SEAL Evidence Manifest Engine', () => {
    it('should seal evidence and verify complete cryptographic integrity', async () => {
      const keys = Ed25519Signer.generateKeyPair()
      const dummyRawBytes = new TextEncoder().encode('RAW_FORENSIC_EVIDENCE_MEDIA_BYTES_JPG').buffer

      const contentHash = await EvidenceSealingEngine.computeContentHash(dummyRawBytes)
      expect(contentHash).toMatch(/^[a-f0-9]{64}$/)

      const metadata: EvidenceMetadata = {
        evidence_id: 'FZ-2026-CASE001-EV000001',
        case_id: 'CASE-001',
        evidence_number: 'EV000001',
        officer_id: 'OFFICER-77',
        device_id: 'DEV-PIXEL-9-SECURE',
        acquisition_timestamp_utc: '2026-09-01T12:00:00.000Z',
        acquisition_location: {
          latitude: 37.7749,
          longitude: -122.4194,
          gps_accuracy: 2.5,
        },
        acquisition_method: 'PHYSICAL_SCENE_ACQUISITION',
        mime_type: 'image/jpeg',
        original_filename: 'crime_scene_photo_01.jpg',
        file_size_bytes: 4096,
        schema_version: '1.0.0',
      }

      const sealedRecord = await EvidenceSealingEngine.sealEvidence(
        metadata,
        contentHash,
        keys.privateKeyHex,
        'KEY-DEV-01'
      )

      expect(sealedRecord.master_hash).toMatch(/^[a-f0-9]{64}$/)
      expect(sealedRecord.signature).toBeDefined()

      // Verification should succeed with correct inputs
      const verification = await EvidenceSealingEngine.verifySealedEvidence(
        sealedRecord,
        dummyRawBytes,
        keys.publicKeyHex
      )
      expect(verification.isValid).toBe(true)
      expect(verification.contentMatch).toBe(true)
      expect(verification.masterHashMatch).toBe(true)
      expect(verification.signatureValid).toBe(true)

      // Verification fails if raw bytes are modified
      const tamperedBytes = new TextEncoder().encode('TAMPERED_FORENSIC_BYTES').buffer
      const tamperedContentVerification = await EvidenceSealingEngine.verifySealedEvidence(
        sealedRecord,
        tamperedBytes,
        keys.publicKeyHex
      )
      expect(tamperedContentVerification.isValid).toBe(false)
      expect(tamperedContentVerification.contentMatch).toBe(false)

      // Verification fails if manifest is altered
      const alteredRecord = {
        ...sealedRecord,
        manifest: {
          ...sealedRecord.manifest,
          actor_id: 'OFFICER-ROGUE',
        },
      }
      const alteredManifestVerification = await EvidenceSealingEngine.verifySealedEvidence(
        alteredRecord,
        dummyRawBytes,
        keys.publicKeyHex
      )
      expect(alteredManifestVerification.isValid).toBe(false)
      expect(alteredManifestVerification.masterHashMatch).toBe(false)
    })
  })

  describe('FZ-ID Device Trust Engine', () => {
    it('should evaluate device trust states accurately', () => {
      const trustedDevice: DeviceKeyRecord = {
        id: '123',
        device_id: 'DEV-01',
        user_id: 'USR-01',
        device_public_key: 'pubkey',
        algorithm: 'Ed25519',
        key_version: 1,
        platform: 'android',
        device_type: 'MOBILE_FIELD',
        attestation_status: 'HARDWARE_ATTESTED',
        status: 'TRUSTED',
        registered_at: '2026-09-01T00:00:00Z',
        last_seen_at: '2026-09-01T00:00:00Z',
      }

      expect(DeviceTrustService.evaluateTrust(trustedDevice).isAllowed).toBe(true)

      const pendingDevice: DeviceKeyRecord = { ...trustedDevice, status: 'PENDING' }
      expect(DeviceTrustService.evaluateTrust(pendingDevice).isAllowed).toBe(false)

      const revokedDevice: DeviceKeyRecord = { ...trustedDevice, status: 'REVOKED' }
      expect(DeviceTrustService.evaluateTrust(revokedDevice).isAllowed).toBe(false)

      const compromisedDevice: DeviceKeyRecord = { ...trustedDevice, status: 'COMPROMISED' }
      expect(DeviceTrustService.evaluateTrust(compromisedDevice).isAllowed).toBe(false)

      expect(DeviceTrustService.evaluateTrust(null).isAllowed).toBe(false)
    })

    it('should document platform storage methods without faking hardware', () => {
      expect(DeviceTrustService.getSecureStorageMethod('android')).toContain('Android Keystore')
      expect(DeviceTrustService.getSecureStorageMethod('ios')).toContain('Apple Keychain')
      expect(DeviceTrustService.getSecureStorageMethod('windows')).toContain('Windows DPAPI')
      expect(DeviceTrustService.getSecureStorageMethod('macos')).toContain('macOS Keychain')
      expect(DeviceTrustService.getSecureStorageMethod('linux')).toContain('Secret Service')
      expect(DeviceTrustService.getSecureStorageMethod('web')).toContain('WebAuthn')
    })
  })
})
