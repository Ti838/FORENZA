/**
 * FORENZA — FZ-AI Orchestrator Type Definitions
 * Standards: ISO/IEC 27037 & NIST SP 800-86
 */

export type FZAiTaskType =
  | 'CASE_SUMMARY'
  | 'TIMELINE_ANALYSIS'
  | 'CUSTODY_ANALYSIS'
  | 'DISCREPANCY_ANALYSIS'
  | 'FIRST_DIVERGENCE_EXPLANATION'
  | 'IMAGE_ANALYSIS'
  | 'OCR'
  | 'SEMANTIC_SEARCH'
  | 'FAST_CLASSIFICATION'
  | 'TRANSLATION'
  | 'SAFETY_CHECK'
  | 'GENERAL_AI'

export type FZProviderName = 'nvidia' | 'gemini' | 'mock'

export type QualitativeConfidence = 'HIGH' | 'MEDIUM' | 'LOW'
export type AISeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface StructuredForensicFinding {
  task: FZAiTaskType
  finding: string
  severity: AISeverity
  confidence: QualitativeConfidence
  source_references: string[]
  uncertainties: string[]
  recommended_review: string[]
  requires_human_review: boolean
  disclaimer: string
  provider: FZProviderName
  model: string
  execution_duration_ms: number
  raw_response?: unknown
}

export interface AIClassificationResult {
  available: boolean
  category?: string
  object?: string
  subcategory?: string
  confidence?: QualitativeConfidence
  suggested_description?: string
  model: string
  model_version?: string
  message?: string
  processing_time_ms?: number
  provider?: FZProviderName
}

export interface OCRResult {
  extracted_text: string
  original_media_hash: string
  text_sha256: string
  detected_language?: string
  detected_entities?: string[]
  model: string
  provider: FZProviderName
  confidence: QualitativeConfidence
  processing_time_ms: number
}

export interface TranslationResult {
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  model: string
  provider: FZProviderName
  timestamp_utc: string
  is_assistive_copy: true
}

export interface DiscrepancyResult {
  verdict: 'MATCH' | 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED'
  reasons: string[]
  severity: AISeverity
  officer_summary: string
  lab_summary: string
  processing_time_ms?: number
  provider?: FZProviderName
  model?: string
}

export interface AIProviderConfig {
  apiKey?: string
  baseUrl?: string
  reasoningModel?: string
  visionModel?: string
  ocrModel?: string
  embeddingModel?: string
  fastModel?: string
  translationModel?: string
  safetyModel?: string
  timeoutMs?: number
}

export interface HealthCheckResult {
  provider: FZProviderName
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE'
  latency_ms: number
  models_available: string[]
  last_checked_utc: string
  error_message?: string
}
