/**
 * FORENZA — FZ-AI Central Orchestrator
 * Standards: ISO/IEC 27037, NIST SP 800-86
 * Coordinates routing, data minimization, safety checks, execution, and provenance.
 */

import { TaskRouter } from './router'
import { AIContextBuilder } from './context-builder'
import { AIProvenanceService } from './ai-provenance'
import {
  FZAiTaskType,
  StructuredForensicFinding,
  AIClassificationResult,
  OCRResult,
  TranslationResult,
  DiscrepancyResult,
} from './types'

export class FZAiOrchestrator {
  /**
   * Execute general assistive query or structured reasoning
   */
  static async executeTask(
    task: FZAiTaskType,
    prompt: string,
    rawContext: Record<string, unknown> = {},
    callerId: string = 'SYSTEM_ANALYST',
    caseId?: string,
    evidenceId?: string
  ): Promise<StructuredForensicFinding> {
    const start = Date.now()

    // 1. Data Minimization & Prompt Injection Sanitization
    const minimizedContext = AIContextBuilder.buildMinimalContext(rawContext, {
      caseId,
      evidenceId,
    })

    // 2. Resolve Optimal Route (NVIDIA NIM / DeepSeek / Nemotron / Gemini / Mock)
    const route = await TaskRouter.resolveRoute(task)

    // 3. Pre-execution Safety Check
    const safety = await route.provider.checkSafety(prompt)
    if (!safety.is_safe) {
      return {
        task,
        finding: '[SECURITY NOTICE] Query was blocked by forensic safety monitor.',
        severity: 'CRITICAL',
        confidence: 'HIGH',
        source_references: [],
        uncertainties: safety.flags,
        recommended_review: ['Consult system security logs'],
        requires_human_review: true,
        disclaimer: 'AI GENERATED — HUMAN REVIEW REQUIRED',
        provider: route.provider.name,
        model: 'safety-guard',
        execution_duration_ms: Date.now() - start,
      }
    }

    // 4. Perform Structured Reasoning
    const finding = await route.provider.performStructuredReasoning(
      task,
      prompt,
      minimizedContext
    )

    // 5. Record Immutable AI Run Provenance
    await AIProvenanceService.recordAIRun(
      callerId,
      finding.model,
      prompt,
      minimizedContext,
      finding,
      Date.now() - start,
      caseId,
      evidenceId
    )

    return finding
  }

  /**
   * Classify evidence image using Vision Engine (Muse Glimmer / Gemini)
   */
  static async classifyEvidence(
    imageBytes: Uint8Array,
    mimeType: string = 'image/jpeg',
    callerId: string = 'FIELD_OFFICER'
  ): Promise<AIClassificationResult> {
    const route = await TaskRouter.resolveRoute('IMAGE_ANALYSIS')
    const result = await route.provider.classifyEvidence(imageBytes, mimeType)
    return result
  }

  /**
   * Extract text via OCR (Nemotron OCR / Gemini)
   */
  static async extractText(
    imageBytes: Uint8Array,
    originalMediaHash: string,
    mimeType: string = 'image/jpeg'
  ): Promise<OCRResult> {
    const route = await TaskRouter.resolveRoute('OCR')
    return route.provider.extractText(imageBytes, originalMediaHash, mimeType)
  }

  /**
   * Compare officer field description vs. scientific lab report
   */
  static async detectDiscrepancy(
    officerDescription: string,
    labReportText: string
  ): Promise<DiscrepancyResult> {
    const route = await TaskRouter.resolveRoute('DISCREPANCY_ANALYSIS')
    return route.provider.detectDiscrepancy(officerDescription, labReportText)
  }

  /**
   * Translate forensic documentation (Riva Translate / Gemini)
   */
  static async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const route = await TaskRouter.resolveRoute('TRANSLATION')
    return route.provider.translate(text, targetLanguage, sourceLanguage)
  }
}
