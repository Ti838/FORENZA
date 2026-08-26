/**
 * FORENZA — Centralized Google Gemini AI Service
 *
 * Provides structured forensic image classification, description generation,
 * document analysis, discrepancy detection between officer notes and lab reports,
 * and contextual AI assistant queries.
 *
 * Security:
 * - GEMINI_API_KEY is accessed ONLY on the server.
 * - Non-blocking fallback if key is missing or service unavailable.
 * - Honest qualitative confidence metrics ('HIGH' | 'MEDIUM' | 'LOW').
 * - Discrepancy detector output is advisory ('MATCH' | 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED').
 */

export type EvidenceCategory =
  | 'WEAPON'
  | 'NARCOTIC'
  | 'DOCUMENT'
  | 'BIOLOGICAL'
  | 'ELECTRONIC'
  | 'CLOTHING'
  | 'TOOL'
  | 'OTHER'

export type QualitativeConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface AIClassificationResult {
  available: boolean
  category?: EvidenceCategory
  object?: string
  subcategory?: string
  confidence?: QualitativeConfidence
  suggested_description?: string
  model: string
  model_version?: string
  message?: string
  processing_time_ms?: number
}

export interface DiscrepancyResult {
  verdict: 'MATCH' | 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED'
  reasons: string[]
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  officer_summary: string
  lab_summary: string
  processing_time_ms?: number
}

export class AIService {
  private static getApiKey(): string | null {
    return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_KEY ?? null
  }

  private static getModel(): string {
    return process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  }

  /**
   * Execute raw generateContent call to Gemini REST API
   */
  private static async callGemini(contents: any[], systemInstruction?: string): Promise<string> {
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

  /**
   * 1. Classify physical evidence image with honest qualitative confidence
   */
  static async classifyEvidence(
    imageBytes: Uint8Array,
    mimeType: string = 'image/jpeg'
  ): Promise<AIClassificationResult> {
    const start = Date.now()
    const apiKey = this.getApiKey()

    if (!apiKey) {
      return {
        available: false,
        model: this.getModel(),
        message: 'Gemini API key not configured. Officer manual classification required.',
      }
    }

    try {
      const base64Data = Buffer.from(imageBytes).toString('base64')
      const systemPrompt = `You are FORENZA Forensic AI Classifier. Analyze the evidence image and output ONLY valid JSON matching this schema:
{
  "category": "WEAPON" | "NARCOTIC" | "DOCUMENT" | "BIOLOGICAL" | "ELECTRONIC" | "CLOTHING" | "TOOL" | "OTHER",
  "object": "Specific concise item name (e.g. Tactical Fixed Blade Knife)",
  "subcategory": "Optional detailed type",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "suggested_description": "Objective, neutral forensic description of item condition, markings, and visible features."
}
Never invent fake decimal percentages. Use only HIGH, MEDIUM, or LOW.`

      const contents = [
        {
          role: 'user',
          parts: [
            { text: 'Perform forensic image classification for evidence registry:' },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ]

      const rawText = await this.callGemini(contents, systemPrompt)
      const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanJson)

      const category: EvidenceCategory = [
        'WEAPON',
        'NARCOTIC',
        'DOCUMENT',
        'BIOLOGICAL',
        'ELECTRONIC',
        'CLOTHING',
        'TOOL',
        'OTHER',
      ].includes(parsed.category)
        ? parsed.category
        : 'OTHER'

      const confidence: QualitativeConfidence = ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence)
        ? parsed.confidence
        : 'MEDIUM'

      return {
        available: true,
        category,
        object: parsed.object ?? 'Unidentified Evidence Item',
        subcategory: parsed.subcategory,
        confidence,
        suggested_description: parsed.suggested_description,
        model: this.getModel(),
        model_version: 'v1.0-gemini',
        processing_time_ms: Date.now() - start,
      }
    } catch (err: any) {
      console.warn('[FORENZA AI] Gemini classification warning:', err.message)
      return {
        available: false,
        model: this.getModel(),
        message: `AI classification unavailable (${err.message}). Manual officer classification required.`,
        processing_time_ms: Date.now() - start,
      }
    }
  }

  /**
   * 2. Analyze Document / PDF text
   */
  static async analyzeDocument(
    docBytes: Uint8Array,
    mimeType: string = 'application/pdf'
  ): Promise<{ summary: string; extracted_entities: string[]; flags: string[] }> {
    const base64Data = Buffer.from(docBytes).toString('base64')
    const systemPrompt = `Extract structured forensic details from this document. Output JSON:
{
  "summary": "Concise summary",
  "extracted_entities": ["names", "case numbers", "dates", "badge numbers"],
  "flags": ["any anomalies or missing stamps"]
}`

    const contents = [
      {
        role: 'user',
        parts: [
          { text: 'Analyze document for forensic cataloging:' },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ]

    const raw = await this.callGemini(contents, systemPrompt)
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(clean)
  }

  /**
   * 3. Compare Initial Officer Description vs. Lab Report (Discrepancy Detection)
   */
  static async compareOfficerAndLabReport(
    officerDescription: string,
    labReportText: string
  ): Promise<DiscrepancyResult> {
    const start = Date.now()
    const apiKey = this.getApiKey()

    if (!apiKey) {
      return {
        verdict: 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED',
        reasons: ['AI Service key not configured; automated cross-validation skipped.'],
        severity: 'LOW',
        officer_summary: officerDescription,
        lab_summary: labReportText.slice(0, 300),
      }
    }

    try {
      const systemPrompt = `You are a Forensic Cross-Verification Engine. Compare the original officer field description against the scientific laboratory report findings.
Output ONLY JSON matching:
{
  "verdict": "MATCH" | "POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED",
  "reasons": ["List of specific reasons or observations"],
  "severity": "NONE" | "LOW" | "MEDIUM" | "HIGH",
  "officer_summary": "Summary of officer claims",
  "lab_summary": "Summary of lab findings"
}
Rules:
- Never declare definitive tampering; use "POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED" if material differences exist (e.g. different caliber, substance chemical type, serial mismatch).
- If findings align, output "MATCH" with severity "NONE".`

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `ORIGINAL OFFICER FIELD DESCRIPTION:\n${officerDescription}\n\nSCIENTIFIC LAB REPORT TEXT:\n${labReportText}`,
            },
          ],
        },
      ]

      const raw = await this.callGemini(contents, systemPrompt)
      const clean = raw.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(clean)

      return {
        verdict: parsed.verdict ?? 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED',
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : ['Discrepancy detected'],
        severity: parsed.severity ?? 'MEDIUM',
        officer_summary: parsed.officer_summary ?? officerDescription,
        lab_summary: parsed.lab_summary ?? labReportText.slice(0, 300),
        processing_time_ms: Date.now() - start,
      }
    } catch (err: any) {
      return {
        verdict: 'POTENTIAL DISCREPANCY - HUMAN REVIEW REQUIRED',
        reasons: [`AI discrepancy analysis error: ${err.message}`],
        severity: 'LOW',
        officer_summary: officerDescription,
        lab_summary: labReportText.slice(0, 300),
        processing_time_ms: Date.now() - start,
      }
    }
  }

  /**
   * 4. Authorized Contextual Assistant Query
   * Queries permitted case data within RLS bounds.
   */
  static async assistantQuery(
    userPrompt: string,
    authorizedContext: Record<string, unknown>
  ): Promise<string> {
    const systemPrompt = `You are FORENZA Forensic AI Assistant.
You assist law enforcement, lab analysts, and judges by answering questions strictly based on the provided authorized case context.
Rules:
- Never reveal sensitive unredacted credentials or keys.
- Reference chain of custody and master hash status objectively.
- If information is not in the context, clearly state it is not available.
- Context provided is authorized by backend RLS.`

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `AUTHORIZED CASE CONTEXT:\n${JSON.stringify(authorizedContext, null, 2)}\n\nUSER QUESTION:\n${userPrompt}`,
          },
        ],
      },
    ]

    return this.callGemini(contents, systemPrompt)
  }
}
