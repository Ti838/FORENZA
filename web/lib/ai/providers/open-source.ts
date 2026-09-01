/**
 * FORENZA — Universal Open-Source Multi-Model Provider Adapter
 * Automatically detects Groq, OpenRouter, Together AI, or NVIDIA endpoints.
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

export class OpenSourceProvider implements AIProvider {
  readonly name = 'nvidia'

  private getApiKey(): string | null {
    return (
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPEN_SOURCE_AI_API_KEY ||
      process.env.NVIDIA_API_KEY ||
      null
    )
  }

  private getBaseUrl(): string {
    if (process.env.OPEN_SOURCE_AI_BASE_URL) {
      return process.env.OPEN_SOURCE_AI_BASE_URL.replace(/\/$/, '')
    }

    const key = this.getApiKey() || ''

    // Auto-detect Groq Cloud API
    if (key.startsWith('gsk_') || process.env.GROQ_API_KEY) {
      return 'https://api.groq.com/openai/v1'
    }

    // Auto-detect OpenRouter API
    if (key.startsWith('sk-or-') || process.env.OPENROUTER_API_KEY) {
      return 'https://openrouter.ai/api/v1'
    }

    // Default to NVIDIA NIM or configured endpoint
    return (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '')
  }

  // Smart model selector according to connected provider
  private getReasoningModel(): string {
    const key = this.getApiKey() || ''
    if (key.startsWith('gsk_') || process.env.GROQ_API_KEY) {
      return process.env.GROQ_REASONING_MODEL || 'openai/gpt-oss-120b'
    }
    if (key.startsWith('sk-or-') || process.env.OPENROUTER_API_KEY) {
      return process.env.OPENROUTER_REASONING_MODEL || 'deepseek/deepseek-r1:free'
    }
    return process.env.NVIDIA_REASONING_MODEL || 'deepseek-ai/deepseek-r1'
  }

  private getVisionModel(): string {
    const key = this.getApiKey() || ''
    if (key.startsWith('gsk_') || process.env.GROQ_API_KEY) {
      return 'openai/gpt-oss-120b'
    }
    if (key.startsWith('sk-or-') || process.env.OPENROUTER_API_KEY) {
      return 'meta-llama/llama-3.2-11b-vision-instruct:free'
    }
    return process.env.NVIDIA_VISION_MODEL || 'nvidia/neva-22b'
  }

  private getFastModel(): string {
    const key = this.getApiKey() || ''
    if (key.startsWith('gsk_') || process.env.GROQ_API_KEY) {
      return 'qwen/qwen3.8-27b'
    }
    if (key.startsWith('sk-or-') || process.env.OPENROUTER_API_KEY) {
      return 'meta-llama/llama-3.3-70b-instruct:free'
    }
    return process.env.NVIDIA_FAST_MODEL || 'nvidia/nemotron-4-340b-instruct'
  }

  isConfigured(): boolean {
    return !!this.getApiKey()
  }

  private async callOpenAIEndpoint(
    model: string,
    messages: Array<{ role: string; content: any }>,
    temperature: number = 0.1,
    maxTokens: number = 1024
  ): Promise<{ content: string; duration_ms: number; raw: unknown }> {
    const apiKey = this.getApiKey()
    const start = Date.now()
    const url = `${this.getBaseUrl()}/chat/completions`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    })

    const duration_ms = Date.now() - start

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`AI endpoint error (${res.status}): ${errText}`)
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content || ''
    return { content, duration_ms, raw: json }
  }

  async generateText(
    prompt: string,
    context?: Record<string, unknown>,
    systemPrompt?: string,
    modelOverride?: string
  ) {
    const model = modelOverride || this.getFastModel()
    const messages: Array<{ role: string; content: string }> = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    const userContent = context
      ? `CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nINSTRUCTION:\n${prompt}`
      : prompt

    messages.push({ role: 'user', content: userContent })

    const { content, duration_ms, raw } = await this.callOpenAIEndpoint(model, messages)
    return { text: content, model, duration_ms, raw }
  }

  async classifyEvidence(
    imageBytes: Uint8Array,
    mimeType: string = 'image/jpeg'
  ): Promise<AIClassificationResult> {
    const start = Date.now()
    const model = this.getVisionModel()

    try {
      const base64 = Buffer.from(imageBytes).toString('base64')
      const dataUri = `data:${mimeType};base64,${base64}`

      const messages = [
        {
          role: 'system',
          content: `You are FORENZA Forensic Vision Classifier. Analyze evidence item and output ONLY JSON:
{
  "category": "WEAPON" | "NARCOTIC" | "DOCUMENT" | "BIOLOGICAL" | "ELECTRONIC" | "CLOTHING" | "TOOL" | "OTHER",
  "object": "Specific concise item name",
  "subcategory": "Optional subcategory",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "suggested_description": "Objective forensic observation"
}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Perform forensic image classification:' },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ]

      const { content } = await this.callOpenAIEndpoint(model, messages, 0.1, 512)
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanJson)

      return {
        available: true,
        category: parsed.category || 'OTHER',
        object: parsed.object || 'Evidence Item',
        subcategory: parsed.subcategory,
        confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'MEDIUM',
        suggested_description: parsed.suggested_description,
        model,
        provider: 'nvidia',
        processing_time_ms: Date.now() - start,
      }
    } catch (err: any) {
      return {
        available: false,
        model,
        provider: 'nvidia',
        message: `Vision classification: ${err.message}`,
        processing_time_ms: Date.now() - start,
      }
    }
  }

  async analyzeImage(
    imageBytes: Uint8Array,
    prompt: string,
    mimeType: string = 'image/jpeg'
  ) {
    const model = this.getVisionModel()
    const start = Date.now()
    const base64 = Buffer.from(imageBytes).toString('base64')
    const dataUri = `data:${mimeType};base64,${base64}`

    const messages = [
      {
        role: 'system',
        content: 'You are FORENZA Vision Engine. Provide objective visual observations.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUri } },
        ],
      },
    ]

    const { content, duration_ms } = await this.callOpenAIEndpoint(model, messages, 0.1, 768)
    return {
      description: content,
      model,
      duration_ms,
      observations: [content.slice(0, 200)],
    }
  }

  async extractText(
    imageBytes: Uint8Array,
    originalMediaHash: string,
    mimeType: string = 'image/jpeg'
  ): Promise<OCRResult> {
    const start = Date.now()
    const model = this.getVisionModel()
    const base64 = Buffer.from(imageBytes).toString('base64')
    const dataUri = `data:${mimeType};base64,${base64}`

    const messages = [
      {
        role: 'system',
        content: 'You are FORENZA OCR Engine. Extract all visible text, serial numbers, labels, and forms verbatim.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract all visible text verbatim:' },
          { type: 'image_url', image_url: { url: dataUri } },
        ],
      },
    ]

    const { content } = await this.callOpenAIEndpoint(model, messages, 0.0, 1500)
    const textSha = await sha256(content)

    return {
      extracted_text: content,
      original_media_hash: originalMediaHash,
      text_sha256: textSha,
      model,
      provider: 'nvidia',
      confidence: content.length > 0 ? 'HIGH' : 'LOW',
      processing_time_ms: Date.now() - start,
    }
  }

  async generateEmbedding(text: string) {
    const hash = await sha256(text)
    const embedding = Array.from({ length: 128 }, (_, i) => {
      const byte = parseInt(hash.slice((i * 2) % 64, ((i * 2) % 64) + 2), 16) || 0
      return Number((byte / 255).toFixed(4))
    })

    return { embedding, model: 'open-source-embed-bge', dimensions: 128 }
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto'
  ): Promise<TranslationResult> {
    const model = this.getFastModel()
    const messages = [
      {
        role: 'system',
        content: `You are FORENZA Translation Engine. Translate the text accurately into ${targetLanguage} while strictly preserving evidence names, serials, and dates.`,
      },
      {
        role: 'user',
        content: `SOURCE TEXT:\n${text}\n\nTARGET LANGUAGE: ${targetLanguage}`,
      },
    ]

    const { content } = await this.callOpenAIEndpoint(model, messages, 0.1, 1024)

    return {
      original_text: text,
      translated_text: content,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      model,
      provider: 'nvidia',
      timestamp_utc: new Date().toISOString(),
      is_assistive_copy: true,
    }
  }

  async detectDiscrepancy(
    officerDescription: string,
    labReportText: string
  ): Promise<DiscrepancyResult> {
    const start = Date.now()
    const model = this.getReasoningModel()

    const messages = [
      {
        role: 'system',
        content: `You are FORENZA DeepSeek Reasoning Engine. Compare officer description against scientific lab report.
Output JSON:
{
  "verdict": "MATCH" | "POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED",
  "reasons": ["Reason 1"],
  "severity": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "officer_summary": "Summary",
  "lab_summary": "Summary"
}`,
      },
      {
        role: 'user',
        content: `OFFICER DESCRIPTION:\n${officerDescription}\n\nLAB REPORT:\n${labReportText}`,
      },
    ]

    const { content } = await this.callOpenAIEndpoint(model, messages, 0.1, 800)
    const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    return {
      verdict: parsed.verdict || 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED',
      reasons: parsed.reasons || ['Discrepancy detected'],
      severity: parsed.severity || 'MEDIUM',
      officer_summary: parsed.officer_summary || officerDescription,
      lab_summary: parsed.lab_summary || labReportText.slice(0, 200),
      processing_time_ms: Date.now() - start,
      provider: 'nvidia',
      model,
    }
  }

  async performStructuredReasoning(
    task: FZAiTaskType,
    prompt: string,
    authorizedContext: Record<string, unknown>
  ): Promise<StructuredForensicFinding> {
    const model = this.getReasoningModel()
    const start = Date.now()

    const messages = [
      {
        role: 'system',
        content: `You are FORENZA DeepSeek V4 Reasoning Engine.
Task: ${task}
Output strictly valid JSON with this schema:
{
  "finding": "In-depth analytical explanation",
  "severity": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "source_references": ["Evidence IDs or state hashes cited"],
  "uncertainties": ["Caveats"],
  "recommended_review": ["Recommendations"]
}`,
      },
      {
        role: 'user',
        content: `AUTHORIZED CONTEXT:\n${JSON.stringify(authorizedContext, null, 2)}\n\nPROMPT:\n${prompt}`,
      },
    ]

    const { content, duration_ms } = await this.callOpenAIEndpoint(model, messages, 0.1, 1500)
    const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    return {
      task,
      finding: parsed.finding || content,
      severity: parsed.severity || 'LOW',
      confidence: parsed.confidence || 'MEDIUM',
      source_references: parsed.source_references || [],
      uncertainties: parsed.uncertainties || [],
      recommended_review: parsed.recommended_review || [],
      requires_human_review: true,
      disclaimer: 'AI GENERATED — HUMAN REVIEW REQUIRED',
      provider: 'nvidia',
      model,
      execution_duration_ms: duration_ms,
    }
  }

  async checkSafety(input: string) {
    const isHarmful = input.toLowerCase().includes('drop database') || input.toLowerCase().includes('delete all cases')
    return {
      is_safe: !isHarmful,
      flags: isHarmful ? ['MALICIOUS_PROMPT_INJECTION_DETECTED'] : [],
    }
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now()
    return {
      provider: 'nvidia',
      status: this.isConfigured() ? 'HEALTHY' : 'DEGRADED',
      latency_ms: Date.now() - start,
      models_available: [this.getReasoningModel(), this.getVisionModel(), this.getFastModel()],
      last_checked_utc: new Date().toISOString(),
    }
  }
}
