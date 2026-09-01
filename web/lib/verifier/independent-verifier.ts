/**
 * FORENZA — Independent Cryptographic Verifier (FZ-VERIFY)
 *
 * Standalone offline verifier capable of validating Evidence Integrity Passports
 * completely independently of the FORENZA database or backend API.
 */

import { SealedEvidencePassport } from '../passport/evidence-passport'
import { EvidenceStateEngine } from '../state/evidence-state-engine'
import { Ed25519Signer } from '../crypto/signatures'
import { BranchAdjudicationService } from '../branching/branch-adjudication'
import { canonicalizeJson } from '../crypto/canonical'
import { sha256 } from '../crypto/evidence-hash'

export type VerificationVerdict =
  | 'PASS'
  | 'FAIL'
  | 'PARTIALLY_VERIFIABLE'
  | 'UNVERIFIABLE'

export interface VerificationCheckReport {
  passport_hash_valid: boolean
  sealing_signature_valid: boolean
  state_chain_valid: boolean
  adjudications_valid: boolean
  total_states_verified: number
  verdict: VerificationVerdict
  failure_reasons: string[]
  verified_at: string
}

export class IndependentVerifier {
  /**
   * Run comprehensive independent offline verification
   */
  static async verifyPassport(
    passport: SealedEvidencePassport,
    publicKeysMap: Record<string, string> // keyId -> publicKeyHex
  ): Promise<VerificationCheckReport> {
    const reasons: string[] = []

    // 1. Verify Passport Payload Hash
    const canonicalPayload = canonicalizeJson(passport.payload)
    const calculatedPassportHash = await sha256(canonicalPayload)
    const passportHashValid = calculatedPassportHash === passport.passport_hash

    if (!passportHashValid) {
      reasons.push('Passport packaging integrity failure: calculated hash does not match passport_hash')
    }

    // 2. Verify Initial Sealing Signature
    let sealingSigValid = false
    const sealingPubKey = publicKeysMap[passport.payload.sealing_key_id]
    if (sealingPubKey) {
      sealingSigValid = Ed25519Signer.verify(
        passport.payload.master_hash,
        passport.payload.sealing_signature,
        sealingPubKey
      )
      if (!sealingSigValid) {
        reasons.push('Evidence master sealing signature is invalid')
      }
    } else {
      reasons.push(`Missing public key for sealing key ID: ${passport.payload.sealing_key_id}`)
    }

    // 3. Verify Full State Merkle History
    const stateResult = await EvidenceStateEngine.verifyStateHistory(
      passport.payload.state_history,
      publicKeysMap
    )
    if (!stateResult.isValid) {
      reasons.push(`State history verification broken at state ${stateResult.brokenStateId}: ${stateResult.failureReason}`)
    }

    // 4. Verify Adjudications if present
    let adjudicationsValid = true
    if (passport.payload.adjudications && passport.payload.adjudications.length > 0) {
      for (const adj of passport.payload.adjudications) {
        const reviewerPubKey = publicKeysMap[adj.reviewer_id] || publicKeysMap[adj.reviewer_device_id]
        if (reviewerPubKey) {
          const isAdjValid = await BranchAdjudicationService.verifyAdjudication(adj, reviewerPubKey)
          if (!isAdjValid) {
            adjudicationsValid = false
            reasons.push(`Adjudication ${adj.id} signature is invalid`)
          }
        }
      }
    }

    // 5. Compute Final Verdict
    let verdict: VerificationVerdict = 'FAIL'
    if (passportHashValid && sealingSigValid && stateResult.isValid && adjudicationsValid) {
      verdict = 'PASS'
    } else if (passportHashValid && (sealingSigValid || stateResult.isValid)) {
      verdict = 'PARTIALLY_VERIFIABLE'
    }

    return {
      passport_hash_valid: passportHashValid,
      sealing_signature_valid: sealingSigValid,
      state_chain_valid: stateResult.isValid,
      adjudications_valid: adjudicationsValid,
      total_states_verified: stateResult.verifiedStates,
      verdict,
      failure_reasons: reasons,
      verified_at: new Date().toISOString(),
    }
  }
}
