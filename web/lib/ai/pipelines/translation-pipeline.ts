/**
 * FORENZA — Pipeline E: Multilingual Forensic Translation Pipeline
 * Pipeline: Original text -> Riva Translate 4B -> Versioned Translated Copy -> Human Review
 */

import { TaskRouter } from '../router'
import { AIProvenanceService } from '../ai-provenance'
import { sha256 } from '../../crypto/evidence-hash'
import { TranslationResult } from '../types'

export interface TranslationPipelineInput {
  originalText: string
  targetLanguage: string
  sourceLanguage?: string
  caseId: string
  callerId: string
  evidenceId?: string
}

export interface TranslationPipelineOutput {
  original_text_sha256: string
  translation: TranslationResult
  provenance_run_id: string
}

export class TranslationPipeline {
  static async execute(input: TranslationPipelineInput): Promise<TranslationPipelineOutput> {
    const start = Date.now()

    // 1. Hash Original Text for Invariant Audit Integrity
    const originalTextSha = await sha256(input.originalText)

    // 2. Resolve Translation Route (Riva Translate 4B)
    const route = await TaskRouter.resolveRoute('TRANSLATION')
    const translation = await route.provider.translate(
      input.originalText,
      input.targetLanguage,
      input.sourceLanguage
    )

    // 3. Record Immutable AI Provenance
    const runRecord = await AIProvenanceService.recordAIRun(
      input.callerId,
      translation.model,
      `Translation to ${input.targetLanguage}`,
      { original_text_sha256: originalTextSha, targetLanguage: input.targetLanguage },
      translation,
      Date.now() - start,
      input.caseId,
      input.evidenceId
    )

    return {
      original_text_sha256: originalTextSha,
      translation,
      provenance_run_id: runRecord.run_id,
    }
  }
}
