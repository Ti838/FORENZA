/**
 * FORENZA — Evidence Sealing & Deterministic Manifest Engine (FZ-SEAL)
 *
 * Implements canonical evidence sealing, multi-layer hashing,
 * and asymmetric Ed25519 signatures.
 */

import { canonicalizeJson } from './canonical'
import { sha256, sha256Bytes } from './evidence-hash'
import { Ed25519Signer } from './signatures'

export interface EvidenceMetadata {
  evidence_id: string
  case_id: string
  evidence_number: string
  officer_id: string
  device_id: string
  acquisition_timestamp_utc: string
  acquisition_location: {
    latitude: number
    longitude: number
    gps_accuracy?: number | null
  }
  acquisition_method: string
  mime_type: string
  original_filename: string
  file_size_bytes: number
  schema_version: string
}

export interface EvidenceManifest {
  evidence_id: string
  case_id: string
  content_hash: string
  metadata_hash: string
  acquisition_timestamp_utc: string
  acquisition_device_id: string
  actor_id: string
  acquisition_location: {
    latitude: number
    longitude: number
    gps_accuracy?: number | null
  }
  acquisition_method: string
  schema_version: string
}

export interface SealedEvidenceRecord {
  evidence_id: string
  case_id: string
  hash_algorithm: 'SHA-256'
  signature_algorithm: 'Ed25519'
  canonicalization_version: 'RFC8785_v1'
  key_id: string
  content_hash: string
  metadata_hash: string
  master_hash: string
  signature: string
  manifest: EvidenceManifest
  sealed_at_utc: string
}

export class EvidenceSealingEngine {
  /**
   * Compute Content Hash: SHA-256(raw evidence bytes)
   */
  static async computeContentHash(rawBytes: ArrayBuffer): Promise<string> {
    return sha256Bytes(rawBytes)
  }

  /**
   * Compute Metadata Hash: SHA-256(canonical metadata)
   */
  static async computeMetadataHash(metadata: EvidenceMetadata): Promise<string> {
    const canonical = canonicalizeJson(metadata)
    return sha256(canonical)
  }

  /**
   * Build Canonical Evidence Manifest and Compute Master Hash
   */
  static async buildManifest(
    metadata: EvidenceMetadata,
    contentHash: string
  ): Promise<{ manifest: EvidenceManifest; masterHash: string }> {
    const metadataHash = await this.computeMetadataHash(metadata)

    const manifest: EvidenceManifest = {
      evidence_id: metadata.evidence_id,
      case_id: metadata.case_id,
      content_hash: contentHash,
      metadata_hash: metadataHash,
      acquisition_timestamp_utc: metadata.acquisition_timestamp_utc,
      acquisition_device_id: metadata.device_id,
      actor_id: metadata.officer_id,
      acquisition_location: {
        latitude: metadata.acquisition_location.latitude,
        longitude: metadata.acquisition_location.longitude,
        gps_accuracy: metadata.acquisition_location.gps_accuracy ?? null,
      },
      acquisition_method: metadata.acquisition_method,
      schema_version: metadata.schema_version,
    }

    const canonicalManifest = canonicalizeJson(manifest)
    const masterHash = await sha256(canonicalManifest)

    return { manifest, masterHash }
  }

  /**
   * Complete Cryptographic Sealing Operation
   */
  static async sealEvidence(
    metadata: EvidenceMetadata,
    contentHash: string,
    privateKeyHex: string,
    keyId: string
  ): Promise<SealedEvidenceRecord> {
    const { manifest, masterHash } = await this.buildManifest(metadata, contentHash)
    const signature = Ed25519Signer.sign(masterHash, privateKeyHex)

    return {
      evidence_id: metadata.evidence_id,
      case_id: metadata.case_id,
      hash_algorithm: 'SHA-256',
      signature_algorithm: 'Ed25519',
      canonicalization_version: 'RFC8785_v1',
      key_id: keyId,
      content_hash: contentHash,
      metadata_hash: manifest.metadata_hash,
      master_hash: masterHash,
      signature,
      manifest,
      sealed_at_utc: new Date().toISOString(),
    }
  }

  /**
   * Verify Sealed Evidence Integrity & Signature
   */
  static async verifySealedEvidence(
    sealedRecord: SealedEvidenceRecord,
    rawBytes: ArrayBuffer | null,
    publicKeyHex: string
  ): Promise<{
    isValid: boolean
    contentMatch: boolean
    masterHashMatch: boolean
    signatureValid: boolean
    failureReason?: string
  }> {
    // 1. Verify content hash if raw bytes provided
    let contentMatch = true
    if (rawBytes) {
      const calculatedContentHash = await this.computeContentHash(rawBytes)
      contentMatch = calculatedContentHash === sealedRecord.content_hash
      if (!contentMatch) {
        return {
          isValid: false,
          contentMatch: false,
          masterHashMatch: false,
          signatureValid: false,
          failureReason: 'Content hash mismatch — raw evidence bytes have been altered',
        }
      }
    }

    // 2. Recompute Master Hash from Manifest
    const canonicalManifest = canonicalizeJson(sealedRecord.manifest)
    const calculatedMasterHash = await sha256(canonicalManifest)
    const masterHashMatch = calculatedMasterHash === sealedRecord.master_hash

    if (!masterHashMatch) {
      return {
        isValid: false,
        contentMatch,
        masterHashMatch: false,
        signatureValid: false,
        failureReason: 'Master hash mismatch — evidence manifest has been altered',
      }
    }

    // 3. Verify Ed25519 Signature
    const signatureValid = Ed25519Signer.verify(
      sealedRecord.master_hash,
      sealedRecord.signature,
      publicKeyHex
    )

    if (!signatureValid) {
      return {
        isValid: false,
        contentMatch,
        masterHashMatch,
        signatureValid: false,
        failureReason: 'Digital signature invalid — signature does not match public key or master hash',
      }
    }

    return {
      isValid: true,
      contentMatch,
      masterHashMatch: true,
      signatureValid: true,
    }
  }
}
