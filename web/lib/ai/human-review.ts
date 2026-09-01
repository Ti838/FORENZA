/**
 * FORENZA — AI Human Review & Modification Service
 * Manages human judicial and analyst review workflows without overwriting original AI outputs.
 */

export type ReviewAction =
  | 'ACCEPT_AS_ASSISTIVE_NOTE'
  | 'REJECT'
  | 'REQUEST_REANALYSIS'
  | 'MODIFY_AND_ACCEPT'

export interface AIReviewRecord {
  review_id: string
  finding_id: string
  run_id: string
  reviewer_id: string
  reviewer_role: string
  action: ReviewAction
  original_ai_output: unknown
  human_modified_version?: string
  review_notes?: string
  review_timestamp_utc: string
}

export class AIHumanReviewService {
  /**
   * Record human review decision while strictly preserving original AI output
   */
  static recordReview(
    findingId: string,
    runId: string,
    reviewerId: string,
    reviewerRole: string,
    action: ReviewAction,
    originalAiOutput: unknown,
    humanModifiedVersion?: string,
    reviewNotes?: string
  ): AIReviewRecord {
    return {
      review_id: crypto.randomUUID(),
      finding_id: findingId,
      run_id: runId,
      reviewer_id: reviewerId,
      reviewer_role: reviewerRole,
      action,
      original_ai_output: originalAiOutput,
      human_modified_version: humanModifiedVersion,
      review_notes: reviewNotes,
      review_timestamp_utc: new Date().toISOString(),
    }
  }
}
