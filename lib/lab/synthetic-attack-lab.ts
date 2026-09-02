/**
 * FORENZA — Synthetic Evidence Security Laboratory (FZ-LAB)
 *
 * Developer & research module for simulating cryptographic attacks, tampering,
 * rollback, and fork conflicts in a safe synthetic sandbox.
 *
 * NEVER RUN AGAINST LIVE PRODUCTION EVIDENCE.
 */

import { EvidenceStateNode } from '../state/evidence-state-engine'
import { ReconciliationEngine, EPRAReconciliationReport } from '../reconciliation/epra'
import { IntegrityImpactAnalyzer, IntegrityImpactReport } from '../impact/impact-analyzer'

export type SyntheticAttackType =
  | 'TAMPER_CONTENT'
  | 'TAMPER_METADATA'
  | 'TIMESTAMP_ROLLBACK'
  | 'FORGE_ACTOR'
  | 'BREAK_HASH_CHAIN'
  | 'FORGE_SIGNATURE'
  | 'OFFLINE_FORK_CONFLICT'

export interface SyntheticAttackSimulationResult {
  attackType: SyntheticAttackType
  attackDescription: string
  detectionSucceeded: boolean
  firstDivergentIndex: number | null
  reconciliationReport: EPRAReconciliationReport
  impactAnalysis: IntegrityImpactReport
  originalHistoryPreserved: boolean
}

export class SyntheticAttackLaboratory {
  /**
   * Run a synthetic attack simulation against an authentic state history
   */
  static simulateAttack(
    authenticHistory: EvidenceStateNode[],
    attackType: SyntheticAttackType,
    targetIndex: number = 1
  ): SyntheticAttackSimulationResult {
    if (authenticHistory.length === 0) {
      throw new Error('Simulation requires at least one authentic state in history.')
    }

    const idx = Math.min(targetIndex, authenticHistory.length - 1)
    const compromisedHistory = JSON.parse(JSON.stringify(authenticHistory)) as EvidenceStateNode[]

    let attackDescription = ''

    switch (attackType) {
      case 'TAMPER_CONTENT':
        attackDescription = `Attacker modified binary media hash in state E${idx}.`
        compromisedHistory[idx].event_data.media_sha256 = '0000000000000000000000000000000000000000000000000000000000000000'
        compromisedHistory[idx].state_hash = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
        break

      case 'TAMPER_METADATA':
        attackDescription = `Attacker altered custody rack location in state E${idx}.`
        compromisedHistory[idx].event_data.rack = 'RACK-TAMPERED-ZONE'
        compromisedHistory[idx].state_hash = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
        break

      case 'TIMESTAMP_ROLLBACK':
        attackDescription = `Attacker rewrote timestamp backwards in state E${idx}.`
        compromisedHistory[idx].timestamp_utc = '1970-01-01T00:00:00.000Z'
        compromisedHistory[idx].state_hash = 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
        break

      case 'FORGE_ACTOR':
        attackDescription = `Attacker replaced legitimate officer with unauthorized actor in state E${idx}.`
        compromisedHistory[idx].actor_id = 'USER-ROGUE-INSIDER'
        compromisedHistory[idx].state_hash = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'
        break

      case 'BREAK_HASH_CHAIN':
        attackDescription = `Attacker broke parent state hash pointer in state E${idx}.`
        compromisedHistory[idx].previous_state_hash = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        break

      case 'FORGE_SIGNATURE':
        attackDescription = `Attacker generated fraudulent digital signature in state E${idx}.`
        compromisedHistory[idx].signature = '3045022100deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
        break

      case 'OFFLINE_FORK_CONFLICT':
        attackDescription = `Offline device branched off state E${idx} with conflicting bench notes.`
        compromisedHistory[idx].event_data.offline_override = true
        compromisedHistory[idx].state_hash = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
        break
    }

    // 1. Run EPRA Reconciliation
    const reconciliation = ReconciliationEngine.reconcile(authenticHistory, compromisedHistory)

    // 2. Run Impact Analysis
    const targetStateId = authenticHistory[idx].state_id
    const impact = IntegrityImpactAnalyzer.analyzeImpact(targetStateId, authenticHistory)

    return {
      attackType,
      attackDescription,
      detectionSucceeded: !reconciliation.isIdentical,
      firstDivergentIndex: reconciliation.divergence?.firstDivergentIndex ?? null,
      reconciliationReport: reconciliation,
      impactAnalysis: impact,
      originalHistoryPreserved: true,
    }
  }
}
