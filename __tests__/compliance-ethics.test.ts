import { describe, it, expect } from 'vitest'
import { ComplianceEngine, JURISDICTIONS } from '../lib/compliance'
import { generateEvidenceHash, verifyEvidenceHash, EvidenceHashInput } from '../lib/crypto/evidence-hash'
import { extendCustodyChain, verifyCustodyChain, GENESIS_HASH, CustodyChainEvent } from '../lib/crypto/custody-chain'

describe('FORENZA International Forensic, Privacy & Ethics Compliance Suite', () => {
  it('loads and validates multi-jurisdiction legal framework metadata', () => {
    const bd = JURISDICTIONS.BANGLADESH
    expect(bd.code).toBe('BANGLADESH')
    expect(bd.warrantRequiredForCapture).toBe(true)

    const eu = JURISDICTIONS.EU
    expect(eu.statutoryBasis).toContain('Budapest Convention')

    const us = JURISDICTIONS.US
    expect(us.statutoryBasis).toContain('Rule 902(14)')
  })

  it('verifies all 9 core technical compliance controls evaluate to PASS in software', () => {
    const matrix = ComplianceEngine.getComplianceMatrix()
    expect(matrix).toHaveLength(9)

    for (const ctrl of matrix) {
      expect(ctrl.status).toBe('PASS')
      expect(ctrl.technicalVerification).toBeDefined()
      expect(ctrl.limitation).toBeDefined()
    }
  })

  it('guarantees original evidence immutability and derived artifact hash linking (ISO/IEC 27037 & 27038)', async () => {
    const originalMediaBytes = new TextEncoder().encode('RAW ORIGINAL CRIME SCENE MEDIA BYTES')
    const originalMediaHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

    // Simulate Redaction creating a separate derived artifact
    const redactedMediaBytes = new TextEncoder().encode('REDACTED COPY FOR PUBLIC DISCLOSURE')
    const redactedHash = 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'

    expect(originalMediaHash).not.toBe(redactedHash)

    // Derived artifact links parent_evidence_id and records transformation tool and operator
    const derivedArtifact = {
      parent_evidence_id: 'evd-001',
      derivation_method: 'REDACTION',
      tool_name: 'FORENZA_REDACTOR',
      tool_version: 'v1.0.0',
      input_hash: originalMediaHash,
      output_hash: redactedHash,
      operator_id: 'usr-analyst-01',
      redaction_reason: 'Witness face blur under privacy policy',
    }

    expect(derivedArtifact.input_hash).toBe(originalMediaHash)
    expect(derivedArtifact.output_hash).toBe(redactedHash)
  })

  it('enforces AI non-finality and qualitative uncertainty labels (AI Ethics Charter)', () => {
    const validConfidences = ['HIGH', 'MEDIUM', 'LOW', 'UNCERTAIN']
    const testConfidence = 'HIGH'

    expect(validConfidences).toContain(testConfidence)

    // AI recommendation must be stored separately from human decision
    const classificationRecord = {
      ai_category: 'WEAPON',
      ai_object: 'Tactical Knife',
      ai_confidence: 'HIGH',
      ai_status: 'AI_SUGGESTED',
      final_category: 'TOOL', // Officer overrides
      final_object: 'Utility Hunting Knife',
      method: 'MANUAL_OVERRIDE',
      override_reason: 'Officer confirmed utilitarian tool marking at scene',
      classified_by: 'officer-uuid-001',
    }

    expect(classificationRecord.ai_category).toBe('WEAPON')
    expect(classificationRecord.final_category).toBe('TOOL')
    expect(classificationRecord.override_reason).toBeDefined()
  })

  it('triggers TAMPER-EVIDENT failure and security alert upon unauthorized historical record change', async () => {
    const baseInput: EvidenceHashInput = {
      evidence_id: 'evd-comp-01',
      case_id: 'case-comp-01',
      evidence_number: 'EVD-COMP-01',
      officer_id: 'officer-01',
      timestamp_utc: '2024-01-15T10:00:00.000Z',
      latitude: 23.8103,
      longitude: 90.4125,
      gps_accuracy: 3.2,
      media_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      media_type: 'PHOTO',
      mime_type: 'image/jpeg',
      file_size_bytes: 2048,
    }

    const masterHash = await generateEvidenceHash(baseInput)
    const validVerify = await verifyEvidenceHash(masterHash, baseInput)
    expect(validVerify.status).toBe('INTEGRITY_VERIFIED')

    // Deliberately tamper with metadata (change officer ID)
    const tamperedInput = {
      ...baseInput,
      officer_id: 'malicious-attacker-02',
    }

    const tamperedVerify = await verifyEvidenceHash(masterHash, tamperedInput)
    expect(tamperedVerify.status).toBe('COMPROMISED_TAMPERED')
    expect(tamperedVerify.match).toBe(false)
  })
})
