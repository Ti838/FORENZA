/**
 * FORENZA — Non-Destructive Branching (FZ-BRANCH) & Human Adjudication (FZ-ADJ)
 *
 * Preserves conflicting evidence histories as parallel verifiable branches.
 * Enables authorized human reviewers to evaluate and adjudicate with signed rulings.
 */

import { Ed25519Signer } from '../crypto/signatures'
import { canonicalizeJson } from '../crypto/canonical'
import { sha256 } from '../crypto/evidence-hash'

export type AdjudicationDecision =
  | 'ACCEPT_BRANCH_A'
  | 'ACCEPT_BRANCH_B'
  | 'ACCEPT_BOTH'
  | 'REJECT_BRANCH_A'
  | 'REJECT_BRANCH_B'
  | 'UNRESOLVED'

export interface EvidenceBranch {
  branch_id: string
  evidence_id: string
  branch_name: string
  divergence_state_id: string
  head_state_id: string
  source_device_id?: string
  source_actor_id?: string
  is_active: boolean
  created_at: string
}

export interface AdjudicationRecord {
  id: string
  evidence_id: string
  conflict_id?: string
  reviewer_id: string
  reviewer_device_id: string
  decision: AdjudicationDecision
  reason: string
  supporting_state_ids: string[]
  signature: string
  signature_algorithm: 'Ed25519'
  version: number
  previous_adjudication_id?: string
  created_at: string
}

export class BranchAdjudicationService {
  /**
   * Create parallel non-destructive branches from a divergence point
   */
  static createBranches(
    evidenceId: string,
    divergenceStateId: string,
    headStateAId: string,
    headStateBId: string,
    sourceDeviceA?: string,
    sourceDeviceB?: string
  ): { branchA: EvidenceBranch; branchB: EvidenceBranch } {
    const branchA: EvidenceBranch = {
      branch_id: crypto.randomUUID(),
      evidence_id: evidenceId,
      branch_name: 'BRANCH_PRIMARY',
      divergence_state_id: divergenceStateId,
      head_state_id: headStateAId,
      source_device_id: sourceDeviceA,
      is_active: true,
      created_at: new Date().toISOString(),
    }

    const branchB: EvidenceBranch = {
      branch_id: crypto.randomUUID(),
      evidence_id: evidenceId,
      branch_name: 'BRANCH_SECONDARY_CONFLICT',
      divergence_state_id: divergenceStateId,
      head_state_id: headStateBId,
      source_device_id: sourceDeviceB,
      is_active: true,
      created_at: new Date().toISOString(),
    }

    return { branchA, branchB }
  }

  /**
   * Submit an authorized, digitally signed human adjudication decision (FZ-ADJ)
   */
  static async adjudicate(
    evidenceId: string,
    reviewerId: string,
    reviewerDeviceId: string,
    decision: AdjudicationDecision,
    reason: string,
    supportingStateIds: string[],
    reviewerPrivateKeyHex: string,
    version: number = 1,
    previousAdjudicationId?: string
  ): Promise<AdjudicationRecord> {
    const adjudicationManifest = {
      decision,
      evidence_id: evidenceId,
      previous_adjudication_id: previousAdjudicationId ?? null,
      reason,
      reviewer_device_id: reviewerDeviceId,
      reviewer_id: reviewerId,
      supporting_state_ids: supportingStateIds.sort(),
      version,
    }

    const canonical = canonicalizeJson(adjudicationManifest)
    const manifestHash = await sha256(canonical)
    const signature = Ed25519Signer.sign(manifestHash, reviewerPrivateKeyHex)

    return {
      id: crypto.randomUUID(),
      evidence_id: evidenceId,
      reviewer_id: reviewerId,
      reviewer_device_id: reviewerDeviceId,
      decision,
      reason,
      supporting_state_ids: supportingStateIds,
      signature,
      signature_algorithm: 'Ed25519',
      version,
      previous_adjudication_id: previousAdjudicationId,
      created_at: new Date().toISOString(),
    }
  }

  /**
   * Verify authenticity of a human adjudication record
   */
  static async verifyAdjudication(
    adjudication: AdjudicationRecord,
    reviewerPublicKeyHex: string
  ): Promise<boolean> {
    const adjudicationManifest = {
      decision: adjudication.decision,
      evidence_id: adjudication.evidence_id,
      previous_adjudication_id: adjudication.previous_adjudication_id ?? null,
      reason: adjudication.reason,
      reviewer_device_id: adjudication.reviewer_device_id,
      reviewer_id: adjudication.reviewer_id,
      supporting_state_ids: adjudication.supporting_state_ids.sort(),
      version: adjudication.version,
    }

    const canonical = canonicalizeJson(adjudicationManifest)
    const manifestHash = await sha256(canonical)

    return Ed25519Signer.verify(
      manifestHash,
      adjudication.signature,
      reviewerPublicKeyHex
    )
  }
}
