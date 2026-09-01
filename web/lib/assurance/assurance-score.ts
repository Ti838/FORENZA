/**
 * FORENZA — Provenance Assurance Score Engine (FZ-ASSURANCE)
 *
 * Computes a weighted Technical Assurance Indicator based on cryptographic,
 * temporal, spatial, hardware, and chain continuity metrics.
 *
 * NOTE: This is strictly a TECHNICAL ASSURANCE INDICATOR and must never
 * be represented as legal truth or definitive court admissibility.
 */

export interface AssuranceEvaluationInput {
  cryptographicIntegrityPassed: boolean
  signaturesValid: boolean
  deviceAttestationPassed: boolean
  temporalConsistencyPassed: boolean // no clock rollback or impossible drift
  locationConsistencyPassed: boolean // verified geofence / spatial continuity
  custodyContinuityPassed: boolean    // uninterrupted custody hash chain
  policyCompliancePassed: boolean     // approved overrides / valid legal holds
}

export interface AssuranceScoreResult {
  score: number                       // 0 - 100
  label: 'TECHNICAL ASSURANCE INDICATOR'
  grade: 'EXEMPLARY' | 'HIGH_ASSURANCE' | 'MODERATE_ASSURANCE' | 'DEGRADED_ASSURANCE' | 'FAILED_INTEGRITY'
  breakdown: {
    cryptographic: number
    signatures: number
    device: number
    temporal: number
    location: number
    custody: number
    policy: number
  }
  disclaimer: string
}

export class AssuranceScoreService {
  static readonly DISCLAIMER =
    'DISCLAIMER: The Provenance Assurance Score is an automated technical integrity metric measuring cryptographic continuity and system compliance. It does not constitute legal proof or judicial admissibility.'

  static calculateScore(input: AssuranceEvaluationInput): AssuranceScoreResult {
    const weights = {
      cryptographic: 25,
      signatures: 20,
      device: 15,
      temporal: 15,
      location: 10,
      custody: 10,
      policy: 5,
    }

    const breakdown = {
      cryptographic: input.cryptographicIntegrityPassed ? weights.cryptographic : 0,
      signatures: input.signaturesValid ? weights.signatures : 0,
      device: input.deviceAttestationPassed ? weights.device : 0,
      temporal: input.temporalConsistencyPassed ? weights.temporal : 0,
      location: input.locationConsistencyPassed ? weights.location : 0,
      custody: input.custodyContinuityPassed ? weights.custody : 0,
      policy: input.policyCompliancePassed ? weights.policy : 0,
    }

    const total = Object.values(breakdown).reduce((acc, v) => acc + v, 0)

    let grade: AssuranceScoreResult['grade'] = 'FAILED_INTEGRITY'
    if (total >= 95) grade = 'EXEMPLARY'
    else if (total >= 80) grade = 'HIGH_ASSURANCE'
    else if (total >= 60) grade = 'MODERATE_ASSURANCE'
    else if (total >= 40) grade = 'DEGRADED_ASSURANCE'

    return {
      score: total,
      label: 'TECHNICAL ASSURANCE INDICATOR',
      grade,
      breakdown,
      disclaimer: this.DISCLAIMER,
    }
  }
}
