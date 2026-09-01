/**
 * FORENZA — Mock AI Provider (Local Dev, Fast Unit Tests & Offline Fallback)
 * Output is always explicitly stamped with "MOCK_AI".
 */

import { AIProvider } from './base'
import {
  FZAiTaskType,
  StructuredForensicFinding,
  AIClassificationResult,
  OCRResult,
  TranslationResult,
  DiscrepancyResult,
  HealthCheckResult,
} from '../types'
import { sha256 } from '../../crypto/evidence-hash'

export class MockProvider implements AIProvider {
  readonly name = 'mock'

  isConfigured(): boolean {
    return true
  }

  async generateText(
    prompt: string,
    context?: Record<string, unknown>,
    systemPrompt?: string,
    modelOverride?: string
  ) {
    return {
      text: `[MOCK_AI Response] Analysis of prompt: "${prompt.slice(0, 50)}..."`,
      model: modelOverride || 'mock-model-v1',
      duration_ms: 10,
    }
  }

  async classifyEvidence(
    imageBytes: Uint8Array,
    mimeType: string = 'image/jpeg'
  ): Promise<AIClassificationResult> {
    return {
      available: true,
      category: 'WEAPON',
      object: 'Simulated Forensic Blade Item',
      subcategory: 'Fixed Blade (MOCK)',
      confidence: 'HIGH',
      suggested_description: '[MOCK_AI] Visual observation of metallic item.',
      model: 'mock-vision-model',
      provider: this.name,
      processing_time_ms: 15,
    }
  }

  async analyzeImage(
    imageBytes: Uint8Array,
    prompt: string,
    mimeType: string = 'image/jpeg'
  ) {
    return {
      description: `[MOCK_AI Vision] Visual evidence observation: ${prompt}`,
      model: 'mock-vision-glimmer',
      duration_ms: 12,
      observations: ['[MOCK_AI] Intact surface', '[MOCK_AI] Standard lighting'],
    }
  }

  async extractText(
    imageBytes: Uint8Array,
    originalMediaHash: string,
    mimeType: string = 'image/jpeg'
  ): Promise<OCRResult> {
    const text = 'SN: FZ-2026-994821 EXHIBIT-A SECTOR-4'
    const textSha = await sha256(text)
    return {
      extracted_text: text,
      original_media_hash: originalMediaHash,
      text_sha256: textSha,
      model: 'mock-nemotron-ocr',
      provider: this.name,
      confidence: 'HIGH',
      processing_time_ms: 20,
    }
  }

  async generateEmbedding(text: string) {
    const hash = await sha256(text)
    const embedding = Array.from({ length: 64 }, (_, i) => {
      const byte = parseInt(hash.slice((i * 2) % 64, ((i * 2) % 64) + 2), 16) || 0
      return Number((byte / 255).toFixed(4))
    })
    return {
      embedding,
      model: 'mock-nemotron-embed',
      dimensions: 64,
    }
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<TranslationResult> {
    return {
      original_text: text,
      translated_text: `[MOCK_AI TRANSLATION -> ${targetLanguage}]: ${text}`,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      model: 'mock-riva-translate',
      provider: this.name,
      timestamp_utc: new Date().toISOString(),
      is_assistive_copy: true,
    }
  }

  async detectDiscrepancy(
    officerDescription: string,
    labReportText: string
  ): Promise<DiscrepancyResult> {
    const hasDiscrepancy =
      officerDescription.toLowerCase().includes('knife') &&
      labReportText.toLowerCase().includes('firearm')

    return {
      verdict: hasDiscrepancy
        ? 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED'
        : 'MATCH',
      reasons: hasDiscrepancy
        ? ['[MOCK_AI] Material mismatch between officer weapon notes and lab firearm report.']
        : ['[MOCK_AI] Consistent forensic records.'],
      severity: hasDiscrepancy ? 'HIGH' : 'NONE',
      officer_summary: officerDescription,
      lab_summary: labReportText.slice(0, 150),
      processing_time_ms: 10,
      provider: this.name,
      model: 'mock-deepseek-reasoning',
    }
  }

  async performStructuredReasoning(
    task: FZAiTaskType,
    prompt: string,
    authorizedContext: Record<string, unknown>
  ): Promise<StructuredForensicFinding> {
    return {
      task,
      finding: `[MOCK_AI] Assistive forensic reasoning for ${task}: Evidence states appear consistent with authorized custody protocols.`,
      severity: 'LOW',
      confidence: 'HIGH',
      source_references: ['EV-MOCK-001', 'STATE-HASH-MOCK-E0'],
      uncertainties: ['Simulated testing environment'],
      recommended_review: ['Verify physical seal integrity'],
      requires_human_review: true,
      disclaimer: 'AI GENERATED — HUMAN REVIEW REQUIRED',
      provider: this.name,
      model: 'mock-deepseek-v4-flash',
      execution_duration_ms: 15,
    }
  }

  async checkSafety(input: string) {
    const isHarmful = input.toLowerCase().includes('drop database') || input.toLowerCase().includes('delete all cases')
    return {
      is_safe: !isHarmful,
      flags: isHarmful ? ['MALICIOUS_PROMPT_INJECTION_DETECTED'] : [],
      rationale: isHarmful ? '[MOCK_AI] Adversarial prompt injection detected.' : undefined,
    }
  }

  async checkHealth(): Promise<HealthCheckResult> {
    return {
      provider: this.name,
      status: 'HEALTHY',
      latency_ms: 5,
      models_available: ['mock-deepseek', 'mock-muse', 'mock-ocr', 'mock-embed', 'mock-riva'],
      last_checked_utc: new Date().toISOString(),
    }
  }
}
