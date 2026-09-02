/**
 * FORENZA — Pipeline B: Custody Discrepancy & EPRA Explanation Pipeline
 * Pipeline: Custody records -> Deterministic chain -> EPRA -> Divergence -> DeepSeek explanation
 */

import { TaskRouter } from '../router'
import { AIProvenanceService } from '../ai-provenance'
import { ReconciliationEngine } from '../../reconciliation/epra'
import { EvidenceStateEngine } from '../../state/evidence-state-engine'
import { StructuredForensicFinding } from '../types'

export interface DiscrepancyPipelineInput {
  evidenceId: string
  caseId: string
  callerId: string
  primaryStateHistory: any[]
  secondaryStateHistory: any[]
}

export interface DiscrepancyPipelineOutput {
  reconciliation_status: string
  divergence_detected: boolean
  first_divergent_state_id?: string
  deepseek_explanation: StructuredForensicFinding
  provenance_run_id: string
}

export class CustodyDiscrepancyPipeline {
  static async execute(input: DiscrepancyPipelineInput): Promise<DiscrepancyPipelineOutput> {
    const start = Date.now()

    // 1. Deterministic Cryptographic Validation (Deterministic Layer)
    const primaryValid = (await EvidenceStateEngine.verifyStateHistory(input.primaryStateHistory, {})).isValid
    const secondaryValid = (await EvidenceStateEngine.verifyStateHistory(input.secondaryStateHistory, {})).isValid

    // 2. Deterministic EPRA Reconciliation
    const epraResult = ReconciliationEngine.reconcile(input.primaryStateHistory, input.secondaryStateHistory)

    // 3. Resolve DeepSeek Reasoning Route
    const reasoningRoute = await TaskRouter.resolveRoute('DISCREPANCY_ANALYSIS')

    // 4. Generate Assistive Reasoning Explanation
    const finding = await reasoningRoute.provider.performStructuredReasoning(
      'DISCREPANCY_ANALYSIS',
      `Explain custody discrepancy and first divergence for evidence ${input.evidenceId}`,
      {
        evidence_id: input.evidenceId,
        case_id: input.caseId,
        primary_chain_valid: primaryValid,
        secondary_chain_valid: secondaryValid,
        reconciliation_verdict: epraResult.verdict,
        divergence: epraResult.divergence,
        summary: epraResult.summary,
      }
    )

    // 5. Record Provenance
    const runRecord = await AIProvenanceService.recordAIRun(
      input.callerId,
      finding.model,
      `Custody Discrepancy Pipeline for ${input.evidenceId}`,
      { epraResult },
      finding,
      Date.now() - start,
      input.caseId,
      input.evidenceId
    )

    return {
      reconciliation_status: epraResult.verdict,
      divergence_detected: !epraResult.isIdentical,
      first_divergent_state_id: epraResult.divergence?.stateA?.state_id,
      deepseek_explanation: finding,
      provenance_run_id: runRecord.run_id,
    }
  }
}
