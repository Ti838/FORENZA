/**
 * FORENZA — Google Gemini Provider Adapter (Fallback & Cross-Checker)
 * Retains existing Gemini functionality while conforming to AIProvider interface.
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

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini'

  private getApiKey(): string | null {
    return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_KEY ?? null
  }

  private getModel(): string {
    return process.env.GEMINI_MODEL ?? 'gemini-3.6-flash'
  }

  isConfigured(): boolean {
    return !!this.getApiKey()
  }

  private async callGemini(contents: any[], systemInstruction?: string): Promise<string> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on server')
    }

    const model = this.getModel()
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    }

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini API returned status ${res.status}: ${errText}`)
    }

    const json = await res.json()
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error('Gemini API returned empty response')
    }

    return text
  }

  async generateText(
    prompt: string,
    context?: Record<string, unknown>,
    systemPrompt?: string,
    modelOverride?: string
  ) {
    const start = Date.now()
    const model = modelOverride || this.getModel()
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: context
              ? `CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nPROMPT:\n${prompt}`
              : prompt,
          },
        ],
      },
    ]

    const text = await this.callGemini(contents, systemPrompt)
    return {
      text,
      model,
      duration_ms: Date.now() - start,
    }
  }

  async classifyEvidence(
    imageBytes: Uint8Array,
    mimeType: string = 'image/jpeg'
  ): Promise<AIClassificationResult> {
    const start = Date.now()
    const apiKey = this.getApiKey()

    if (!apiKey) {
      return {
        available: false,
        model: this.getModel(),
        provider: this.name,
        message: 'Gemini API key not configured. Officer manual classification required.',
      }
    }

    try {
      const base64Data = Buffer.from(imageBytes).toString('base64')
      const systemPrompt = `You are FORENZA Forensic AI Classifier. Analyze the evidence image and output ONLY valid JSON matching this schema:
{
  "category": "WEAPON" | "NARCOTIC" | "DOCUMENT" | "BIOLOGICAL" | "ELECTRONIC" | "CLOTHING" | "TOOL" | "OTHER",
  "object": "Specific concise item name",
  "subcategory": "Optional detailed type",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "suggested_description": "Objective, neutral forensic description."
}`

      const contents = [
        {
          role: 'user',
          parts: [
            { text: 'Perform forensic image classification:' },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ]

      const rawText = await this.callGemini(contents, systemPrompt)
      const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanJson)

      return {
        available: true,
        category: parsed.category || 'OTHER',
        object: parsed.object || 'Unidentified Evidence Item',
        subcategory: parsed.subcategory,
        confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'MEDIUM',
        suggested_description: parsed.suggested_description,
        model: this.getModel(),
        model_version: 'v1.0-gemini',
        provider: this.name,
        processing_time_ms: Date.now() - start,
      }
    } catch (err: any) {
      return {
        available: false,
        model: this.getModel(),
        provider: this.name,
        message: `Gemini classification unavailable: ${err.message}`,
        processing_time_ms: Date.now() - start,
      }
    }
  }

  async analyzeImage(
    imageBytes: Uint8Array,
    prompt: string,
    mimeType: string = 'image/jpeg'
  ) {
    const start = Date.now()
    const base64Data = Buffer.from(imageBytes).toString('base64')
    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ]

    const text = await this.callGemini(contents, 'You are FORENZA Vision assistant.')
    return {
      description: text,
      model: this.getModel(),
      duration_ms: Date.now() - start,
      observations: [text.slice(0, 200)],
    }
  }

  async extractText(
    imageBytes: Uint8Array,
    originalMediaHash: string,
    mimeType: string = 'image/jpeg'
  ): Promise<OCRResult> {
    const start = Date.now()
    const base64Data = Buffer.from(imageBytes).toString('base64')
    const contents = [
      {
        role: 'user',
        parts: [
          { text: 'Extract all visible text and markings verbatim from this image:' },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ]

    const extracted = await this.callGemini(contents)
    const textSha = await sha256(extracted)

    return {
      extracted_text: extracted,
      original_media_hash: originalMediaHash,
      text_sha256: textSha,
      model: this.getModel(),
      provider: this.name,
      confidence: extracted.length > 0 ? 'HIGH' : 'LOW',
      processing_time_ms: Date.now() - start,
    }
  }

  async generateEmbedding(text: string) {
    // Fallback pseudo-embedding when Google embeddings endpoint not explicitly linked
    const hash = await sha256(text)
    const embedding = Array.from({ length: 128 }, (_, i) => {
      const byte = parseInt(hash.slice((i * 2) % 64, ((i * 2) % 64) + 2), 16) || 0
      return Number((byte / 255).toFixed(4))
    })

    return {
      embedding,
      model: 'text-embedding-gemini-fallback',
      dimensions: 128,
    }
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto'
  ): Promise<TranslationResult> {
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Translate this text accurately into ${targetLanguage}:\n\n${text}`,
          },
        ],
      },
    ]

    const translated = await this.callGemini(contents, 'You are FORENZA Translation assistant.')

    return {
      original_text: text,
      translated_text: translated,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      model: this.getModel(),
      provider: this.name,
      timestamp_utc: new Date().toISOString(),
      is_assistive_copy: true,
    }
  }

  async detectDiscrepancy(
    officerDescription: string,
    labReportText: string
  ): Promise<DiscrepancyResult> {
    const start = Date.now()
    const systemPrompt = `You are a Forensic Cross-Verification Engine. Compare the officer description vs lab report.
Output JSON ONLY:
{
  "verdict": "MATCH" | "POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED",
  "reasons": ["List of reasons"],
  "severity": "NONE" | "LOW" | "MEDIUM" | "HIGH",
  "officer_summary": "Officer summary",
  "lab_summary": "Lab summary"
}`

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `OFFICER DESCRIPTION:\n${officerDescription}\n\nLAB REPORT:\n${labReportText}`,
          },
        ],
      },
    ]

    try {
      const rawText = await this.callGemini(contents, systemPrompt)
      const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanJson)

      return {
        verdict: parsed.verdict ?? 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED',
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : ['Discrepancy detected'],
        severity: parsed.severity ?? 'MEDIUM',
        officer_summary: parsed.officer_summary ?? officerDescription,
        lab_summary: parsed.lab_summary ?? labReportText.slice(0, 300),
        processing_time_ms: Date.now() - start,
        provider: this.name,
        model: this.getModel(),
      }
    } catch (err: any) {
      return {
        verdict: 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED',
        reasons: [`AI discrepancy analysis error: ${err.message}`],
        severity: 'LOW',
        officer_summary: officerDescription,
        lab_summary: labReportText.slice(0, 300),
        processing_time_ms: Date.now() - start,
        provider: this.name,
        model: this.getModel(),
      }
    }
  }

  async performStructuredReasoning(
    task: FZAiTaskType,
    prompt: string,
    authorizedContext: Record<string, unknown>
  ): Promise<StructuredForensicFinding> {
    const start = Date.now()
    const systemPrompt = `You are FORENZA Forensic AI Assistant.
Task: ${task}
Output strictly valid JSON with this schema:
{
  "finding": "Analytical explanation",
  "severity": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "source_references": ["Cited IDs or hashes"],
  "uncertainties": ["Caveats"],
  "recommended_review": ["Recommendations"]
}`

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `AUTHORIZED CONTEXT:\n${JSON.stringify(authorizedContext, null, 2)}\n\nPROMPT:\n${prompt}`,
          },
        ],
      },
    ]

    try {
      const raw = await this.callGemini(contents, systemPrompt)
      const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
      return {
        task,
        finding: parsed.finding || raw,
        severity: parsed.severity || 'LOW',
        confidence: parsed.confidence || 'MEDIUM',
        source_references: parsed.source_references || [],
        uncertainties: parsed.uncertainties || [],
        recommended_review: parsed.recommended_review || [],
        requires_human_review: true,
        disclaimer: 'AI GENERATED — HUMAN REVIEW REQUIRED',
        provider: this.name,
        model: this.getModel(),
        execution_duration_ms: Date.now() - start,
      }
    } catch {
      return {
        task,
        finding: `Assistive finding generated for ${task}`,
        severity: 'LOW',
        confidence: 'MEDIUM',
        source_references: [],
        uncertainties: ['Fallback template output'],
        recommended_review: ['Manual supervisor review'],
        requires_human_review: true,
        disclaimer: 'AI GENERATED — HUMAN REVIEW REQUIRED',
        provider: this.name,
        model: this.getModel(),
        execution_duration_ms: Date.now() - start,
      }
    }
  }

  async checkSafety(input: string) {
    return { is_safe: true, flags: [] }
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now()
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        status: 'OFFLINE',
        latency_ms: 0,
        models_available: [],
        last_checked_utc: new Date().toISOString(),
        error_message: 'GEMINI_API_KEY not configured',
      }
    }

    try {
      await this.generateText('Ping health')
      return {
        provider: this.name,
        status: 'HEALTHY',
        latency_ms: Date.now() - start,
        models_available: [this.getModel()],
        last_checked_utc: new Date().toISOString(),
      }
    } catch (err: any) {
      return {
        provider: this.name,
        status: 'DEGRADED',
        latency_ms: Date.now() - start,
        models_available: [],
        last_checked_utc: new Date().toISOString(),
        error_message: err.message,
      }
    }
  }
}
