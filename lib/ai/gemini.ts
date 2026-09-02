/**
 * FORENZA — AI Service Facade (Backwards Compatible FZ-AI Bridge)
 * Bridges legacy calls to the new FZ-AI Orchestrator with specialized multi-model routing.
 */

import { FZAiOrchestrator } from './orchestrator'
import {
  AIClassificationResult,
  DiscrepancyResult,
  QualitativeConfidence,
} from './types'

export type EvidenceCategory =
  | 'WEAPON'
  | 'NARCOTIC'
  | 'DOCUMENT'
  | 'BIOLOGICAL'
  | 'ELECTRONIC'
  | 'CLOTHING'
  | 'TOOL'
  | 'OTHER'

export type { QualitativeConfidence, AIClassificationResult, DiscrepancyResult }

export class AIService {
  /**
   * 1. Classify physical evidence image using FZ-AI Orchestrator (Vision / Gemini)
   */
  static async classifyEvidence(
    imageBytes: Uint8Array,
    mimeType: string = 'image/jpeg'
  ): Promise<AIClassificationResult> {
    return FZAiOrchestrator.classifyEvidence(imageBytes, mimeType)
  }

  /**
   * 2. Analyze Document / PDF text
   */
  static async analyzeDocument(
    docBytes: Uint8Array,
    mimeType: string = 'application/pdf'
  ): Promise<{ summary: string; extracted_entities: string[]; flags: string[] }> {
    const ocrResult = await FZAiOrchestrator.extractText(docBytes, 'DOC_INLINE_MEDIA', mimeType)
    const reasoning = await FZAiOrchestrator.executeTask(
      'CASE_SUMMARY',
      `Extract structured forensic details from this document text:\n${ocrResult.extracted_text}`,
      { text_length: ocrResult.extracted_text.length }
    )

    return {
      summary: reasoning.finding,
      extracted_entities: reasoning.source_references,
      flags: reasoning.uncertainties,
    }
  }

  /**
   * 3. Compare Initial Officer Description vs. Lab Report (Discrepancy Detection)
   */
  static async compareOfficerAndLabReport(
    officerDescription: string,
    labReportText: string
  ): Promise<DiscrepancyResult> {
    return FZAiOrchestrator.detectDiscrepancy(officerDescription, labReportText)
  }

  /**
   * 4. Authorized Contextual Assistant Query
   */
  static async assistantQuery(
    userPrompt: string,
    authorizedContext: Record<string, unknown>
  ): Promise<string> {
    const finding = await FZAiOrchestrator.executeTask(
      'GENERAL_AI',
      userPrompt,
      authorizedContext
    )
    return finding.finding
  }
}
