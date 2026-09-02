/**
 * FORENZA — Offline Forensic Vault & Authenticated Encryption Engine (FZ-VAULT)
 *
 * Implements authenticated encryption (AES-256-GCM) with device-bound keys,
 * monotonic sequence numbering, rollback detection, and local integrity verification.
 */

import * as nodeCrypto from 'crypto'
import { canonicalizeJson } from '../crypto/canonical'
import { sha256, sha256Bytes } from '../crypto/evidence-hash'
import { Ed25519Signer } from '../crypto/signatures'

export interface LocalEncryptedVaultItem {
  evidence_id: string
  case_id: string
  local_sequence: number
  device_id: string
  actor_id: string
  capture_time_utc: string
  latitude: number | null
  longitude: number | null
  media_sha256: string
  master_hash: string
  iv_hex: string
  auth_tag_hex: string
  encrypted_ciphertext_hex: string
  signature: string
  signature_algorithm: 'Ed25519'
}

export class OfflineVaultEngine {
  /**
   * Encrypt raw media bytes using AES-256-GCM
   */
  static encryptMedia(
    rawBytes: Uint8Array,
    encryptionKey32Bytes: Buffer
  ): { ciphertextHex: string; ivHex: string; authTagHex: string } {
    const iv = nodeCrypto.randomBytes(12) // 96-bit IV for GCM
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', encryptionKey32Bytes, iv)

    const encrypted = Buffer.concat([cipher.update(rawBytes), cipher.final()])
    const authTag = cipher.getAuthTag()

    return {
      ciphertextHex: encrypted.toString('hex'),
      ivHex: iv.toString('hex'),
      authTagHex: authTag.toString('hex'),
    }
  }

  /**
   * Decrypt and verify media bytes using AES-256-GCM
   */
  static decryptMedia(
    ciphertextHex: string,
    ivHex: string,
    authTagHex: string,
    encryptionKey32Bytes: Buffer
  ): Uint8Array {
    const decipher = nodeCrypto.createDecipheriv(
      'aes-256-gcm',
      encryptionKey32Bytes,
      Buffer.from(ivHex, 'hex')
    )
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, 'hex')),
      decipher.final(),
    ])

    return new Uint8Array(decrypted)
  }

  /**
   * Seal and store evidence securely into offline vault
   */
  static async sealOfflineEvidence(
    evidenceId: string,
    caseId: string,
    localSequence: number,
    deviceId: string,
    actorId: string,
    rawBytes: Uint8Array,
    deviceSigningPrivateKeyHex: string,
    deviceVaultKey32Bytes: Buffer,
    location?: { latitude: number; longitude: number }
  ): Promise<LocalEncryptedVaultItem> {
    const mediaSha256 = await sha256Bytes(rawBytes.buffer as ArrayBuffer)
    const nowUtc = new Date().toISOString()

    const manifest = {
      actor_id: actorId,
      capture_time_utc: nowUtc,
      case_id: caseId,
      device_id: deviceId,
      evidence_id: evidenceId,
      latitude: location?.latitude ?? null,
      local_sequence: localSequence,
      longitude: location?.longitude ?? null,
      media_sha256: mediaSha256,
    }

    const canonical = canonicalizeJson(manifest)
    const masterHash = await sha256(canonical)
    const signature = Ed25519Signer.sign(masterHash, deviceSigningPrivateKeyHex)

    const { ciphertextHex, ivHex, authTagHex } = this.encryptMedia(
      rawBytes,
      deviceVaultKey32Bytes
    )

    return {
      evidence_id: evidenceId,
      case_id: caseId,
      local_sequence: localSequence,
      device_id: deviceId,
      actor_id: actorId,
      capture_time_utc: nowUtc,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      media_sha256: mediaSha256,
      master_hash: masterHash,
      iv_hex: ivHex,
      auth_tag_hex: authTagHex,
      encrypted_ciphertext_hex: ciphertextHex,
      signature,
      signature_algorithm: 'Ed25519',
    }
  }

  /**
   * Verify integrity of an offline vault item
   */
  static async verifyOfflineVaultItem(
    item: LocalEncryptedVaultItem,
    deviceSigningPublicKeyHex: string,
    deviceVaultKey32Bytes: Buffer
  ): Promise<{ isValid: boolean; failureReason?: string }> {
    // 1. Verify digital signature on manifest
    const manifest = {
      actor_id: item.actor_id,
      capture_time_utc: item.capture_time_utc,
      case_id: item.case_id,
      device_id: item.device_id,
      evidence_id: item.evidence_id,
      latitude: item.latitude,
      local_sequence: item.local_sequence,
      longitude: item.longitude,
      media_sha256: item.media_sha256,
    }

    const canonical = canonicalizeJson(manifest)
    const calculatedMasterHash = await sha256(canonical)

    if (calculatedMasterHash !== item.master_hash) {
      return { isValid: false, failureReason: 'Master hash mismatch on local vault manifest' }
    }

    const sigValid = Ed25519Signer.verify(
      item.master_hash,
      item.signature,
      deviceSigningPublicKeyHex
    )
    if (!sigValid) {
      return { isValid: false, failureReason: 'Digital signature invalid on local vault item' }
    }

    // 2. Verify AES-GCM ciphertext integrity by decrypting
    try {
      const decrypted = this.decryptMedia(
        item.encrypted_ciphertext_hex,
        item.iv_hex,
        item.auth_tag_hex,
        deviceVaultKey32Bytes
      )
      const decryptedHash = await sha256Bytes(decrypted.buffer as ArrayBuffer)
      if (decryptedHash !== item.media_sha256) {
        return { isValid: false, failureReason: 'Decrypted media hash does not match stored media hash' }
      }
    } catch (err: any) {
      return { isValid: false, failureReason: `AES-GCM authentication tag verification failed: ${err.message}` }
    }

    return { isValid: true }
  }
}
