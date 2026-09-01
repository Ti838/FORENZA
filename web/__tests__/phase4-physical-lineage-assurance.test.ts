import { describe, it, expect } from 'vitest'
import { PhysicalEvidenceService } from '../lib/physical/physical-evidence'
import { SampleLineageService } from '../lib/lineage/sample-lineage'
import { AssuranceScoreService } from '../lib/assurance/assurance-score'

describe('Phase 4: Physical Evidence, Sample Lineage & Assurance Scoring', () => {
  describe('FZ-PHOTO & Physical Seals Engine', () => {
    it('should apply seals, record condition with photo hash, and enforce breakage logs', async () => {
      const seal = PhysicalEvidenceService.applySeal(
        'SEAL-BARCODE-9941',
        'OFFICER-01',
        'EV-01',
        'CONT-01'
      )
      expect(seal.status).toBe('INTACT')

      const brokenSeal = PhysicalEvidenceService.breakSeal(
        seal,
        'LAB-ANALYST-01',
        'Opening bag for toxicological analysis'
      )
      expect(brokenSeal.status).toBe('BROKEN')
      expect(brokenSeal.broken_reason).toContain('Opening bag')

      // Cannot break already broken seal
      expect(() =>
        PhysicalEvidenceService.breakSeal(brokenSeal, 'LAB-ANALYST-02', 'Re-breaking')
      ).toThrow(/already recorded as BROKEN/)

      const photoBytes = new TextEncoder().encode('EVIDENCE_CONDITION_PHOTO_DATA').buffer
      const conditionLog = await PhysicalEvidenceService.recordCondition(
        'EV-01',
        'OFFICER-01',
        'DEV-01',
        'INTACT',
        'Package intact upon arrival at vault',
        photoBytes
      )
      expect(conditionLog.condition).toBe('INTACT')
      expect(conditionLog.photo_hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('FZ-LINEAGE Recursive Sample Genealogy', () => {
    it('should manage primary sample, child aliquots, and enforce depletion constraints', () => {
      // 1. Primary sample: 100 mg
      const primary = SampleLineageService.createPrimarySample(
        'EV-01',
        'SMP-001',
        100,
        'mg',
        'LAB-CUSTODIAN-01',
        'Homogenized seized powder'
      )
      expect(primary.remaining_quantity).toBe(100)

      // 2. Split aliquot child: 30 mg
      const { updatedParent, childSample } = SampleLineageService.createChildAliquot(
        primary,
        'SMP-001-ALIQUOT-A',
        30,
        'LAB-ANALYST-01',
        'Reconstituted in methanol'
      )
      expect(updatedParent.remaining_quantity).toBe(70)
      expect(childSample.remaining_quantity).toBe(30)
      expect(childSample.parent_sample_id).toBe(primary.id)

      // 3. Over-allocation error
      expect(() =>
        SampleLineageService.createChildAliquot(
          updatedParent,
          'SMP-001-ALIQUOT-B',
          80, // only 70 left
          'LAB-ANALYST-01'
        )
      ).toThrow(/Cannot allocate 80 mg/)

      // 4. Consume 10 mg from child aliquot
      const consumedChild = SampleLineageService.consumeSample(
        childSample,
        10,
        'GC-MS destructive run'
      )
      expect(consumedChild.consumed_quantity).toBe(10)
      expect(consumedChild.remaining_quantity).toBe(20)

      // 5. Over-consumption error
      expect(() =>
        SampleLineageService.consumeSample(consumedChild, 25, 'Excess run')
      ).toThrow(/Over-consumption violation/)
    })
  })

  describe('FZ-ASSURANCE Provenance Assurance Score', () => {
    it('should calculate technical assurance score with mandatory disclaimer', () => {
      const fullAssurance = AssuranceScoreService.calculateScore({
        cryptographicIntegrityPassed: true,
        signaturesValid: true,
        deviceAttestationPassed: true,
        temporalConsistencyPassed: true,
        locationConsistencyPassed: true,
        custodyContinuityPassed: true,
        policyCompliancePassed: true,
      })

      expect(fullAssurance.score).toBe(100)
      expect(fullAssurance.grade).toBe('EXEMPLARY')
      expect(fullAssurance.label).toBe('TECHNICAL ASSURANCE INDICATOR')
      expect(fullAssurance.disclaimer).toContain('does not constitute legal proof')

      const degradedAssurance = AssuranceScoreService.calculateScore({
        cryptographicIntegrityPassed: true,
        signaturesValid: true,
        deviceAttestationPassed: false,
        temporalConsistencyPassed: false,
        locationConsistencyPassed: true,
        custodyContinuityPassed: false,
        policyCompliancePassed: true,
      })

      expect(degradedAssurance.score).toBe(60)
      expect(degradedAssurance.grade).toBe('MODERATE_ASSURANCE')
    })
  })
})
