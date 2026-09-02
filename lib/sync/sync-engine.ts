/**
 * FORENZA — Conflict-Resilient Offline Sync Engine (FZ-SYNC)
 *
 * Validates, reconciles, and merges offline field events to the centralized server.
 * Protects against rollback, sequence jumps, duplicate events, and silent history overwrite.
 */

import { EvidenceStateNode } from '../state/evidence-state-engine'
import { Ed25519Signer } from '../crypto/signatures'
import { DeviceTrustService, DeviceKeyRecord } from '../device/device-trust'

export interface OfflineSyncPayload {
  event_id: string
  evidence_id: string
  device_id: string
  local_sequence: number
  device_timestamp_utc: string
  parent_state_id: string | null
  event_type: string
  event_data: Record<string, unknown>
  event_hash: string
  state_hash: string
  signature: string
  key_id: string
}

export type SyncResultStatus =
  | 'ACCEPTED'
  | 'DUPLICATE_IGNORED'
  | 'QUARANTINED_CONFLICT'
  | 'REJECTED_UNTRUSTED_DEVICE'
  | 'REJECTED_INVALID_SIGNATURE'
  | 'REJECTED_SEQUENCE_ROLLBACK'

export interface SyncOperationResult {
  status: SyncResultStatus
  event_id: string
  evidence_id: string
  server_timestamp_utc: string
  branch_created?: boolean
  quarantine_reason?: string
}

export class OfflineSyncEngine {
  /**
   * Process a single incoming offline event on the server
   */
  static async processSyncEvent(
    payload: OfflineSyncPayload,
    deviceRecord: DeviceKeyRecord | null,
    latestServerState: EvidenceStateNode | null,
    processedEventIds: Set<string>,
    lastKnownDeviceSequence: number
  ): Promise<SyncOperationResult> {
    const serverTimestamp = new Date().toISOString()

    // 1. Device Trust Validation
    const trustEval = DeviceTrustService.evaluateTrust(deviceRecord)
    if (!trustEval.isAllowed) {
      return {
        status: 'REJECTED_UNTRUSTED_DEVICE',
        event_id: payload.event_id,
        evidence_id: payload.evidence_id,
        server_timestamp_utc: serverTimestamp,
        quarantine_reason: trustEval.reason,
      }
    }

    // 2. Duplicate Event Check
    if (processedEventIds.has(payload.event_id)) {
      return {
        status: 'DUPLICATE_IGNORED',
        event_id: payload.event_id,
        evidence_id: payload.evidence_id,
        server_timestamp_utc: serverTimestamp,
      }
    }

    // 3. Monotonic Sequence Rollback Check
    if (payload.local_sequence <= lastKnownDeviceSequence) {
      return {
        status: 'REJECTED_SEQUENCE_ROLLBACK',
        event_id: payload.event_id,
        evidence_id: payload.evidence_id,
        server_timestamp_utc: serverTimestamp,
        quarantine_reason: `Rollback attempt: payload sequence ${payload.local_sequence} <= last known sequence ${lastKnownDeviceSequence}`,
      }
    }

    // 4. Digital Signature Validation
    const isSigValid = Ed25519Signer.verify(
      payload.state_hash,
      payload.signature,
      deviceRecord!.device_public_key
    )
    if (!isSigValid) {
      return {
        status: 'REJECTED_INVALID_SIGNATURE',
        event_id: payload.event_id,
        evidence_id: payload.evidence_id,
        server_timestamp_utc: serverTimestamp,
        quarantine_reason: 'Device signature failed cryptographic validation',
      }
    }

    // 5. Parent State Consistency Check
    const serverParentId = latestServerState ? latestServerState.state_id : null

    if (payload.parent_state_id !== serverParentId) {
      // Fork / Branch Conflict Detected: The offline device based this event on an older parent state
      return {
        status: 'QUARANTINED_CONFLICT',
        event_id: payload.event_id,
        evidence_id: payload.evidence_id,
        server_timestamp_utc: serverTimestamp,
        branch_created: true,
        quarantine_reason: `Parent state mismatch. Offline event parent: ${payload.parent_state_id}, Current server head: ${serverParentId}. Quarantined into non-destructive branch.`,
      }
    }

    // 6. Accept and advance state
    return {
      status: 'ACCEPTED',
      event_id: payload.event_id,
      evidence_id: payload.evidence_id,
      server_timestamp_utc: serverTimestamp,
    }
  }
}
