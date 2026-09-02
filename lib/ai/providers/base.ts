/**
 * FORENZA — Generic AI Provider Interface
 * Decouples forensic application logic from third-party vendor SDKs.
 */

import {
  FZAiTaskType,
  FZProviderName,
  StructuredForensicFinding,
  AIClassificationResult,
  OCRResult,
  TranslationResult,
  DiscrepancyResult,
  HealthCheckResult,
} from '../types'

export interface AIProvider {
  readonly name: FZProviderName

  isConfigured(): boolean

  generateText(
    prompt: string,
    context?: Record<string, unknown>,
    systemPrompt?: string,
    modelOverride?: string
  ): Promise<{ text: string; model: string; duration_ms: number; raw?: unknown }>

  classifyEvidence(
    imageBytes: Uint8Array,
    mimeType?: string
  ): Promise<AIClassificationResult>

  analyzeImage(
    imageBytes: Uint8Array,
    prompt: string,
    mimeType?: string
  ): Promise<{ description: string; model: string; duration_ms: number; observations: string[] }>

  extractText(
    imageBytes: Uint8Array,
    originalMediaHash: string,
    mimeType?: string
  ): Promise<OCRResult>

  generateEmbedding(
    text: string
  ): Promise<{ embedding: number[]; model: string; dimensions: number }>

  translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult>

  detectDiscrepancy(
    officerDescription: string,
    labReportText: string
  ): Promise<DiscrepancyResult>

  performStructuredReasoning(
    task: FZAiTaskType,
    prompt: string,
    authorizedContext: Record<string, unknown>
  ): Promise<StructuredForensicFinding>

  checkSafety(
    input: string
  ): Promise<{ is_safe: boolean; flags: string[]; rationale?: string }>

  checkHealth(): Promise<HealthCheckResult>
}
