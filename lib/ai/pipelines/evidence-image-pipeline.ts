/**
 * FORENZA — Pipeline A: Forensic Evidence Image Analysis Pipeline
 * Pipeline: Image -> SHA-256 -> OCR -> Vision analysis -> Reasoning -> Structured Finding
 */

import { TaskRouter } from '../router'
import { AIProvenanceService } from '../ai-provenance'
import { sha256 } from '../../crypto/evidence-hash'
import { StructuredForensicFinding } from '../types'

export interface ImagePipelineInput {
  imageBytes: Uint8Array
  mimeType: string
  evidenceId: string
  caseId: string
  callerId: string
  officerNotes?: string
}

export interface ImagePipelineOutput {
  media_sha256: string
  classification: {
    category?: string
    object?: string
    confidence?: string
    suggested_description?: string
  }
  ocr_extracted_text?: string
  finding: StructuredForensicFinding
  provenance_run_id: string
}

export class EvidenceImagePipeline {
  static async execute(input: ImagePipelineInput): Promise<ImagePipelineOutput> {
    const start = Date.now()

    // 1. Deterministic Media Hashing (Original byte integrity invariant)
    const mediaSha = await sha256(input.imageBytes)

    // 2. Resolve Providers
    const visionRoute = await TaskRouter.resolveRoute('IMAGE_ANALYSIS')
    const ocrRoute = await TaskRouter.resolveRoute('OCR')
    const reasoningRoute = await TaskRouter.resolveRoute('CASE_SUMMARY')

    // 3. Vision Analysis
    const classification = await visionRoute.provider.classifyEvidence(input.imageBytes, input.mimeType)

    // 4. Conditional OCR Extraction
    let ocrText: string | undefined
    if (classification.category === 'DOCUMENT' || input.mimeType === 'application/pdf') {
      const ocrResult = await ocrRoute.provider.extractText(input.imageBytes, mediaSha, input.mimeType)
      ocrText = ocrResult.extracted_text
    }

    // 5. DeepSeek Reasoning Synthesis
    const finding = await reasoningRoute.provider.performStructuredReasoning(
      'IMAGE_ANALYSIS',
      `Synthesize forensic visual findings for evidence ${input.evidenceId}`,
      {
        evidence_id: input.evidenceId,
        case_id: input.caseId,
        media_sha256: mediaSha,
        classification,
        ocr_text: ocrText,
        officer_notes: input.officerNotes,
      }
    )

    // 6. Record Immutable AI Provenance
    const runRecord = await AIProvenanceService.recordAIRun(
      input.callerId,
      finding.model,
      `Image Pipeline for ${input.evidenceId}`,
      { media_sha256: mediaSha, classification, ocr_text: ocrText },
      finding,
      Date.now() - start,
      input.caseId,
      input.evidenceId
    )

    return {
      media_sha256: mediaSha,
      classification: {
        category: classification.category,
        object: classification.object,
        confidence: classification.confidence,
        suggested_description: classification.suggested_description,
      },
      ocr_extracted_text: ocrText,
      finding,
      provenance_run_id: runRecord.run_id,
    }
  }
}
