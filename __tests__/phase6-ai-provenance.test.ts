import { describe, it, expect } from 'vitest'
import { AIProvenanceService } from '../lib/ai/ai-provenance'

describe('Phase 6: AI Provenance & Claim Validation (FZ-AI)', () => {
  it('should record AI inference run with deterministic hashes and mandatory badge', async () => {
    const prompt = 'Analyze tool mark patterns on seized firearm'
    const input = { image_name: 'gun.jpg', case_id: 'C-01' }
    const output = { category: 'WEAPON', confidence: 'HIGH' }

    const runRecord = await AIProvenanceService.recordAIRun(
      'OFFICER-01',
      'gemini-2.0-flash',
      prompt,
      input,
      output,
      420,
      'C-01',
      'EV-01'
    )

    expect(runRecord.disclaimer).toBe('AI GENERATED — HUMAN REVIEW REQUIRED')
    expect(runRecord.review_status).toBe('PENDING_HUMAN_REVIEW')
    expect(runRecord.prompt_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(runRecord.input_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(runRecord.output_hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('should validate AI claim evidence source references', () => {
    const existingIds = new Set(['EV-01', 'EV-02', 'EV-03'])

    // Supported claim referencing valid evidence
    const supportedClaim = AIProvenanceService.validateClaimSources(
      'Blood splatter pattern on EV-01 matches impact velocity of EV-02',
      ['EV-01', 'EV-02'],
      existingIds
    )
    expect(supportedClaim.status).toBe('SUPPORTED')

    // Unsupported claim referencing non-existent evidence
    const unsupportedClaim = AIProvenanceService.validateClaimSources(
      'Fingerprint matches suspect profile from EV-999',
      ['EV-999'],
      existingIds
    )
    expect(unsupportedClaim.status).toBe('UNSUPPORTED')

    // Claim with no references
    const noRefClaim = AIProvenanceService.validateClaimSources(
      'Generic observation without citations',
      [],
      existingIds
    )
    expect(noRefClaim.status).toBe('UNSUPPORTED')
  })
})
