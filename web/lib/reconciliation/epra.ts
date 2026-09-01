/**
 * FORENZA — Evidence Provenance Reconciliation Algorithm (FZ-EPRA)
 * & First Divergence Detection Engine (FZ-DIV)
 *
 * Compares evidence state histories from multiple sources (e.g. offline device vs server),
 * detects conflicts, pinpoints the exact node of first divergence, and calculates impact.
 */

import { EvidenceStateNode } from '../state/evidence-state-engine'

export type ReconciliationVerdict =
  | 'CONSISTENT'
  | 'MINOR_CONFLICT'
  | 'SIGNIFICANT_CONFLICT'
  | 'CRITICAL_CONFLICT'
  | 'UNRESOLVED'

export type ConflictCategory =
  | 'HASH_CONFLICT'
  | 'TIMESTAMP_CONFLICT'
  | 'LOCATION_CONFLICT'
  | 'ACTOR_CONFLICT'
  | 'DEVICE_CONFLICT'
  | 'CUSTODY_CONFLICT'
  | 'METADATA_CONFLICT'
  | 'PARENT_STATE_CONFLICT'
  | 'SIGNATURE_CONFLICT'
  | 'POLICY_CONFLICT'
  | 'DUPLICATE_EVENT'
  | 'REPLAY_EVENT'
  | 'ROLLBACK_ATTEMPT'

export interface DivergenceDetails {
  firstDivergentIndex: number
  commonAncestorStateId: string | null
  stateA: EvidenceStateNode
  stateB: EvidenceStateNode
  conflictTypes: ConflictCategory[]
  changedFields: string[]
  downstreamCountA: number
  downstreamCountB: number
}

export interface EPRAReconciliationReport {
  verdict: ReconciliationVerdict
  isIdentical: boolean
  totalStatesSourceA: number
  totalStatesSourceB: number
  divergence: DivergenceDetails | null
  summary: string
}

export class ReconciliationEngine {
  /**
   * Compare two chronological state histories and identify first divergence point (FZ-DIV)
   */
  static findFirstDivergence(
    historyA: EvidenceStateNode[],
    historyB: EvidenceStateNode[]
  ): DivergenceDetails | null {
    const minLen = Math.min(historyA.length, historyB.length)
    let commonAncestorId: string | null = null

    for (let i = 0; i < minLen; i++) {
      const nodeA = historyA[i]
      const nodeB = historyB[i]

      // If state hashes match completely, continue forward
      if (nodeA.state_hash === nodeB.state_hash) {
        commonAncestorId = nodeA.state_id
        continue
      }

      // First divergence found at index i!
      const conflicts: ConflictCategory[] = []
      const changedFields: string[] = []

      if (nodeA.state_hash !== nodeB.state_hash) {
        conflicts.push('HASH_CONFLICT')
        changedFields.push('state_hash')
      }
      if (nodeA.parent_state_id !== nodeB.parent_state_id) {
        conflicts.push('PARENT_STATE_CONFLICT')
        changedFields.push('parent_state_id')
      }
      if (nodeA.actor_id !== nodeB.actor_id) {
        conflicts.push('ACTOR_CONFLICT')
        changedFields.push('actor_id')
      }
      if (nodeA.device_id !== nodeB.device_id) {
        conflicts.push('DEVICE_CONFLICT')
        changedFields.push('device_id')
      }
      if (nodeA.timestamp_utc !== nodeB.timestamp_utc) {
        conflicts.push('TIMESTAMP_CONFLICT')
        changedFields.push('timestamp_utc')
      }
      if (nodeA.latitude !== nodeB.latitude || nodeA.longitude !== nodeB.longitude) {
        conflicts.push('LOCATION_CONFLICT')
        changedFields.push('location')
      }
      if (JSON.stringify(nodeA.event_data) !== JSON.stringify(nodeB.event_data)) {
        conflicts.push('METADATA_CONFLICT')
        changedFields.push('event_data')
      }
      if (nodeA.signature !== nodeB.signature) {
        conflicts.push('SIGNATURE_CONFLICT')
        changedFields.push('signature')
      }

      return {
        firstDivergentIndex: i,
        commonAncestorStateId: commonAncestorId,
        stateA: nodeA,
        stateB: nodeB,
        conflictTypes: conflicts,
        changedFields,
        downstreamCountA: historyA.length - i,
        downstreamCountB: historyB.length - i,
      }
    }

    // If one history has extra states appended after common prefix
    if (historyA.length !== historyB.length) {
      const isALonger = historyA.length > historyB.length
      const divergedNode = isALonger ? historyA[minLen] : historyB[minLen]
      return {
        firstDivergentIndex: minLen,
        commonAncestorStateId: commonAncestorId,
        stateA: isALonger ? divergedNode : historyA[minLen - 1],
        stateB: isALonger ? historyB[minLen - 1] : divergedNode,
        conflictTypes: ['PARENT_STATE_CONFLICT'],
        changedFields: ['history_length'],
        downstreamCountA: isALonger ? historyA.length - minLen : 0,
        downstreamCountB: !isALonger ? historyB.length - minLen : 0,
      }
    }

    return null
  }

  /**
   * Run Evidence Provenance Reconciliation Algorithm (EPRA)
   */
  static reconcile(
    historyA: EvidenceStateNode[],
    historyB: EvidenceStateNode[]
  ): EPRAReconciliationReport {
    const divergence = this.findFirstDivergence(historyA, historyB)

    if (!divergence) {
      return {
        verdict: 'CONSISTENT',
        isIdentical: true,
        totalStatesSourceA: historyA.length,
        totalStatesSourceB: historyB.length,
        divergence: null,
        summary: 'Evidence state histories from both sources are cryptographically identical.',
      }
    }

    let verdict: ReconciliationVerdict = 'MINOR_CONFLICT'

    if (
      divergence.conflictTypes.includes('HASH_CONFLICT') ||
      divergence.conflictTypes.includes('SIGNATURE_CONFLICT') ||
      divergence.conflictTypes.includes('PARENT_STATE_CONFLICT')
    ) {
      verdict = 'CRITICAL_CONFLICT'
    } else if (
      divergence.conflictTypes.includes('ACTOR_CONFLICT') ||
      divergence.conflictTypes.includes('LOCATION_CONFLICT')
    ) {
      verdict = 'SIGNIFICANT_CONFLICT'
    }

    return {
      verdict,
      isIdentical: false,
      totalStatesSourceA: historyA.length,
      totalStatesSourceB: historyB.length,
      divergence,
      summary: `Divergence detected at state index ${divergence.firstDivergentIndex}. Conflicting fields: ${divergence.changedFields.join(', ')}.`,
    }
  }
}
