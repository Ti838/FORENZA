/**
 * FORENZA — Evidence Integrity Passport (FZ-PASS)
 *
 * Generates portable, self-contained, cryptographically sealed
 * forensic evidence packages for judicial review and third-party verification.
 *
 * Does NOT include raw media bytes to maintain privacy and zero-trust distribution.
 */

import { canonicalizeJson } from '../crypto/canonical'
import { sha256 } from '../crypto/evidence-hash'
import { EvidenceStateNode } from '../state/evidence-state-engine'
import { ProvenanceGraph } from '../provenance/provenance-engine'
import { AdjudicationRecord } from '../branching/branch-adjudication'

export interface EvidencePassportPayload {
  manifest_version: 'FZ-PASS-v1'
  evidence_id: string
  case_id: string
  content_hash: string
  metadata_hash: string
  master_hash: string
  sealing_signature: string
  sealing_key_id: string
  state_history: EvidenceStateNode[]
  provenance_graph?: ProvenanceGraph
  adjudications?: AdjudicationRecord[]
  generated_at_utc: string
  issuer_identity: string
}

export interface SealedEvidencePassport {
  passport_id: string
  evidence_id: string
  passport_hash: string
  payload: EvidencePassportPayload
}

export class EvidencePassportService {
  /**
   * Package evidence history into a portable cryptographic passport
   */
  static async generatePassport(
    evidenceId: string,
    caseId: string,
    contentHash: string,
    metadataHash: string,
    masterHash: string,
    sealingSignature: string,
    sealingKeyId: string,
    stateHistory: EvidenceStateNode[],
    provenanceGraph?: ProvenanceGraph,
    adjudications?: AdjudicationRecord[],
    issuerIdentity: string = 'FORENZA_ROOT_AUTHORITY'
  ): Promise<SealedEvidencePassport> {
    const payload: EvidencePassportPayload = {
      manifest_version: 'FZ-PASS-v1',
      evidence_id: evidenceId,
      case_id: caseId,
      content_hash: contentHash,
      metadata_hash: metadataHash,
      master_hash: masterHash,
      sealing_signature: sealingSignature,
      sealing_key_id: sealingKeyId,
      state_history: stateHistory,
      provenance_graph: provenanceGraph,
      adjudications: adjudications,
      generated_at_utc: new Date().toISOString(),
      issuer_identity: issuerIdentity,
    }

    const canonical = canonicalizeJson(payload)
    const passportHash = await sha256(canonical)

    return {
      passport_id: crypto.randomUUID(),
      evidence_id: evidenceId,
      passport_hash: passportHash,
      payload,
    }
  }
}
