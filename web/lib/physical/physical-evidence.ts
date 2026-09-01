/**
 * FORENZA — Physical Evidence & Tamper-Evident Seal Engine (FZ-PHOTO)
 *
 * Tracks physical containers, tamper-evident seals, and condition photo verifications.
 */

import { sha256Bytes } from '../crypto/evidence-hash'

export type SealStatus = 'INTACT' | 'BROKEN' | 'REPLACED' | 'VOIDED'

export type PhysicalEvidenceCondition =
  | 'INTACT'
  | 'DAMAGED'
  | 'OPENED'
  | 'BROKEN_SEAL'
  | 'CONTAMINATED'
  | 'UNKNOWN'

export interface ContainerRecord {
  id: string
  container_code: string
  container_type: string
  description?: string
  current_location: string
  created_by: string
  created_at: string
}

export interface SealRecord {
  id: string
  seal_number: string
  container_id?: string
  evidence_id?: string
  seal_type: string
  applied_by: string
  applied_at: string
  broken_by?: string
  broken_at?: string
  broken_reason?: string
  status: SealStatus
}

export interface EvidenceConditionLog {
  id: string
  evidence_id: string
  actor_id: string
  device_id: string
  condition: PhysicalEvidenceCondition
  notes?: string
  photo_storage_path?: string
  photo_hash?: string
  recorded_at: string
}

export class PhysicalEvidenceService {
  /**
   * Apply a new tamper-evident security seal
   */
  static applySeal(
    sealNumber: string,
    appliedBy: string,
    evidenceId?: string,
    containerId?: string
  ): SealRecord {
    return {
      id: crypto.randomUUID(),
      seal_number: sealNumber,
      evidence_id: evidenceId,
      container_id: containerId,
      seal_type: 'TAMPER_EVIDENT_BARCODE_TAPE',
      applied_by: appliedBy,
      applied_at: new Date().toISOString(),
      status: 'INTACT',
    }
  }

  /**
   * Record seal breakage with mandatory justification
   */
  static breakSeal(
    seal: SealRecord,
    brokenBy: string,
    reason: string
  ): SealRecord {
    if (seal.status === 'BROKEN') {
      throw new Error(`Seal ${seal.seal_number} is already recorded as BROKEN.`)
    }

    return {
      ...seal,
      status: 'BROKEN',
      broken_by: brokenBy,
      broken_at: new Date().toISOString(),
      broken_reason: reason,
    }
  }

  /**
   * Record condition verification with optional photographic documentation
   */
  static async recordCondition(
    evidenceId: string,
    actorId: string,
    deviceId: string,
    condition: PhysicalEvidenceCondition,
    notes?: string,
    photoBytes?: ArrayBuffer
  ): Promise<EvidenceConditionLog> {
    let photoHash: string | undefined
    if (photoBytes) {
      photoHash = await sha256Bytes(photoBytes)
    }

    return {
      id: crypto.randomUUID(),
      evidence_id: evidenceId,
      actor_id: actorId,
      device_id: deviceId,
      condition,
      notes,
      photo_hash: photoHash,
      recorded_at: new Date().toISOString(),
    }
  }
}
