/**
 * FORENZA — Pipeline D: Lab Report OCR & Summary Pipeline
 * Pipeline: Report image/doc -> OCR -> Text extraction -> Hash -> Summary -> Human review
 */

import { TaskRouter } from '../router'
import { AIProvenanceService } from '../ai-provenance'
import { sha256 } from '../../crypto/evidence-hash'
import { StructuredForensicFinding } from '../types'

export interface LabReportPipelineInput {
  reportBytes: Uint8Array
  mimeType: string
  reportNumber: string
  evidenceId: string
  caseId: string
  callerId: string
}

export interface LabReportPipelineOutput {
  report_sha256: string
  extracted_text: string
  summary_finding: StructuredForensicFinding
  provenance_run_id: string
}

export class LabReportPipeline {
  static async execute(input: LabReportPipelineInput): Promise<LabReportPipelineOutput> {
    const start = Date.now()

    // 1. Deterministic Report Hash
    const reportSha = await sha256(input.reportBytes)

    // 2. OCR Text Extraction (Nemotron OCR)
    const ocrRoute = await TaskRouter.resolveRoute('OCR')
    const ocrResult = await ocrRoute.provider.extractText(input.reportBytes, reportSha, input.mimeType)

    // 3. Summarization & Forensic Extraction (DeepSeek)
    const reasoningRoute = await TaskRouter.resolveRoute('CASE_SUMMARY')
    const summaryFinding = await reasoningRoute.provider.performStructuredReasoning(
      'CASE_SUMMARY',
      `Extract structured forensic lab summary, chemical quantities, and conclusions for report ${input.reportNumber}`,
      {
        report_number: input.reportNumber,
        evidence_id: input.evidenceId,
        case_id: input.caseId,
        report_sha256: reportSha,
        extracted_text: ocrResult.extracted_text,
      }
    )

    // 4. Record Provenance
    const runRecord = await AIProvenanceService.recordAIRun(
      input.callerId,
      summaryFinding.model,
      `Lab Report Pipeline for ${input.reportNumber}`,
      { report_sha256: reportSha, text_sha256: ocrResult.text_sha256 },
      summaryFinding,
      Date.now() - start,
      input.caseId,
      input.evidenceId
    )

    return {
      report_sha256: reportSha,
      extracted_text: ocrResult.extracted_text,
      summary_finding: summaryFinding,
      provenance_run_id: runRecord.run_id,
    }
  }
}
