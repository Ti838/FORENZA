/**
 * FORENZA — AI Provenance & Claim Validation Engine (FZ-AI)
 *
 * Implements deterministic auditing for AI-assisted operations:
 * records input/prompt/output hashes, model provenance, and validates
 * that AI claims reference factual source evidence items.
 *
 * MANDATORY FORENSIC ETHICS NOTICE:
 * Every AI inference result must be clearly marked:
 * "AI GENERATED — HUMAN REVIEW REQUIRED"
 */

import { sha256 } from '../crypto/evidence-hash'
import { canonicalizeJson } from '../crypto/canonical'

export type AIReviewStatus = 'PENDING_HUMAN_REVIEW' | 'CONFIRMED' | 'REJECTED'
export type AIClaimStatus = 'SUPPORTED' | 'UNSUPPORTED' | 'REQUIRES_REVIEW'

export interface AIRunRecord {
  run_id: string
  case_id?: string
  evidence_id?: string
  provider: string
  model_name: string
  model_version?: string
  input_hash: string
  prompt_hash: string
  output_hash: string
  execution_duration_ms: number
  caller_id: string
  review_status: AIReviewStatus
  created_at: string
  disclaimer: string
}

export interface AIClaimItem {
  claim_id: string
  run_id: string
  claim_text: string
  source_evidence_ids: string[]
  status: AIClaimStatus
  reviewer_id?: string
  reviewer_notes?: string
  reviewed_at?: string
}

export class AIProvenanceService {
  static readonly MANDATORY_BADGE = 'AI GENERATED — HUMAN REVIEW REQUIRED'

  /**
   * Log an audited AI inference execution
   */
  static async recordAIRun(
    callerId: string,
    modelName: string,
    prompt: string,
    rawInput: unknown,
    rawOutput: unknown,
    durationMs: number,
    caseId?: string,
    evidenceId?: string
  ): Promise<AIRunRecord> {
    const promptHash = await sha256(prompt)
    const inputHash = await sha256(canonicalizeJson(rawInput))
    const outputHash = await sha256(canonicalizeJson(rawOutput))

    return {
      run_id: crypto.randomUUID(),
      case_id: caseId,
      evidence_id: evidenceId,
      provider: 'google_gemini_rest',
      model_name: modelName,
      model_version: '2026-v1',
      input_hash: inputHash,
      prompt_hash: promptHash,
      output_hash: outputHash,
      execution_duration_ms: durationMs,
      caller_id: callerId,
      review_status: 'PENDING_HUMAN_REVIEW',
      created_at: new Date().toISOString(),
      disclaimer: this.MANDATORY_BADGE,
    }
  }

  /**
   * Validate that an AI-generated claim is grounded in existing registered evidence
   */
  static validateClaimSources(
    claimText: string,
    referencedEvidenceIds: string[],
    existingEvidenceIdSet: Set<string>
  ): AIClaimItem {
    let status: AIClaimStatus = 'REQUIRES_REVIEW'

    if (referencedEvidenceIds.length === 0) {
      status = 'UNSUPPORTED'
    } else {
      const allExist = referencedEvidenceIds.every((id) => existingEvidenceIdSet.has(id))
      status = allExist ? 'SUPPORTED' : 'UNSUPPORTED'
    }

    return {
      claim_id: crypto.randomUUID(),
      run_id: crypto.randomUUID(),
      claim_text: claimText,
      source_evidence_ids: referencedEvidenceIds,
      status,
    }
  }
}
