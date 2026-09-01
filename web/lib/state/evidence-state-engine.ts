/**
 * FORENZA — Immutable Evidence State Engine (FZ-TWIN)
 *
 * Implements the state machine and cryptographic Merkle-state history (E0 -> E1 -> E2 ...).
 * Historical states cannot be modified; all modifications append new cryptographically-signed states.
 */

import { canonicalizeJson } from '../crypto/canonical'
import { sha256 } from '../crypto/evidence-hash'
import { Ed25519Signer } from '../crypto/signatures'

export interface StateEventInput {
  evidence_id: string
  parent_state_id: string | null
  event_type: string
  actor_id: string
  device_id: string
  timestamp_utc: string
  location?: {
    latitude: number
    longitude: number
    gps_accuracy?: number | null
  } | null
  event_data: Record<string, unknown>
}

export interface EvidenceStateNode {
  state_id: string
  evidence_id: string
  parent_state_id: string | null
  event_type: string
  actor_id: string
  device_id: string
  timestamp_utc: string
  latitude: number | null
  longitude: number | null
  location_metadata?: Record<string, unknown>
  event_data: Record<string, unknown>
  previous_state_hash: string | null
  event_hash: string
  state_hash: string
  signature: string
  signature_algorithm: string
  key_id: string
  canonicalization_version: string
  created_at: string
}

export interface StateVerificationResult {
  isValid: boolean
  totalStates: number
  verifiedStates: number
  brokenStateId?: string
  brokenIndex?: number
  failureReason?: string
}

export class EvidenceStateEngine {
  /**
   * Compute deterministic event hash: SHA-256(canonical(event_data))
   */
  static async computeEventHash(eventData: Record<string, unknown>): Promise<string> {
    const canonical = canonicalizeJson(eventData)
    return sha256(canonical)
  }

  /**
   * Compute deterministic state hash:
   * SHA-256(canonical({ previous_state_hash, event_hash, event_type, actor_id, device_id, timestamp_utc, location }))
   */
  static async computeStateHash(
    previousStateHash: string | null,
    eventHash: string,
    event: StateEventInput
  ): Promise<string> {
    const stateManifest = {
      actor_id: event.actor_id,
      device_id: event.device_id,
      event_hash: eventHash,
      event_type: event.event_type,
      evidence_id: event.evidence_id,
      location: event.location
        ? {
            gps_accuracy: event.location.gps_accuracy ?? null,
            latitude: event.location.latitude,
            longitude: event.location.longitude,
          }
        : null,
      parent_state_id: event.parent_state_id ?? null,
      previous_state_hash: previousStateHash ?? null,
      timestamp_utc: event.timestamp_utc,
    }

    const canonical = canonicalizeJson(stateManifest)
    return sha256(canonical)
  }

  /**
   * Append a new state to the evidence state tree
   */
  static async createState(
    input: StateEventInput,
    previousStateHash: string | null,
    privateKeyHex: string,
    keyId: string,
    stateId?: string
  ): Promise<EvidenceStateNode> {
    const eventHash = await this.computeEventHash(input.event_data)
    const stateHash = await this.computeStateHash(previousStateHash, eventHash, input)
    const signature = Ed25519Signer.sign(stateHash, privateKeyHex)

    return {
      state_id: stateId ?? crypto.randomUUID(),
      evidence_id: input.evidence_id,
      parent_state_id: input.parent_state_id,
      event_type: input.event_type,
      actor_id: input.actor_id,
      device_id: input.device_id,
      timestamp_utc: input.timestamp_utc,
      latitude: input.location?.latitude ?? null,
      longitude: input.location?.longitude ?? null,
      location_metadata: input.location ? { accuracy: input.location.gps_accuracy } : {},
      event_data: input.event_data,
      previous_state_hash: previousStateHash,
      event_hash: eventHash,
      state_hash: stateHash,
      signature,
      signature_algorithm: 'Ed25519',
      key_id: keyId,
      canonicalization_version: 'RFC8785_v1',
      created_at: new Date().toISOString(),
    }
  }

  /**
   * Verify an ordered chronological chain of evidence states
   */
  static async verifyStateHistory(
    states: EvidenceStateNode[],
    publicKeysMap: Record<string, string> // keyId -> publicKeyHex
  ): Promise<StateVerificationResult> {
    if (states.length === 0) {
      return { isValid: true, totalStates: 0, verifiedStates: 0 }
    }

    let expectedPrevHash: string | null = null

    for (let i = 0; i < states.length; i++) {
      const state = states[i]

      // 1. Verify previous_state_hash link
      if (state.previous_state_hash !== expectedPrevHash) {
        return {
          isValid: false,
          totalStates: states.length,
          verifiedStates: i,
          brokenStateId: state.state_id,
          brokenIndex: i,
          failureReason: `State chain parent hash pointer mismatch at index ${i}. Expected: ${expectedPrevHash}, Found: ${state.previous_state_hash}`,
        }
      }

      // 2. Recompute event hash
      const calcEventHash = await this.computeEventHash(state.event_data)
      if (calcEventHash !== state.event_hash) {
        return {
          isValid: false,
          totalStates: states.length,
          verifiedStates: i,
          brokenStateId: state.state_id,
          brokenIndex: i,
          failureReason: `Event data modified in state ${state.state_id} at index ${i}`,
        }
      }

      // 3. Recompute state hash
      const eventInput: StateEventInput = {
        evidence_id: state.evidence_id,
        parent_state_id: state.parent_state_id,
        event_type: state.event_type,
        actor_id: state.actor_id,
        device_id: state.device_id,
        timestamp_utc: state.timestamp_utc,
        location:
          state.latitude !== null && state.longitude !== null
            ? { latitude: state.latitude, longitude: state.longitude }
            : null,
        event_data: state.event_data,
      }

      const calcStateHash = await this.computeStateHash(expectedPrevHash, calcEventHash, eventInput)
      if (calcStateHash !== state.state_hash) {
        return {
          isValid: false,
          totalStates: states.length,
          verifiedStates: i,
          brokenStateId: state.state_id,
          brokenIndex: i,
          failureReason: `State manifest hash mismatch in state ${state.state_id} at index ${i}`,
        }
      }

      // 4. Verify Ed25519 signature if public key is available
      const pubKey = publicKeysMap[state.key_id]
      if (pubKey) {
        const sigValid = Ed25519Signer.verify(state.state_hash, state.signature, pubKey)
        if (!sigValid) {
          return {
            isValid: false,
            totalStates: states.length,
            verifiedStates: i,
            brokenStateId: state.state_id,
            brokenIndex: i,
            failureReason: `Digital signature invalid in state ${state.state_id} at index ${i}`,
          }
        }
      }

      expectedPrevHash = state.state_hash
    }

    return {
      isValid: true,
      totalStates: states.length,
      verifiedStates: states.length,
    }
  }
}
