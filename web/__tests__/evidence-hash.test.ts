import { describe, it, expect } from 'vitest'
import {
  buildCanonicalEvidenceData,
  generateEvidenceHash,
  verifyEvidenceHash,
  sha256,
  EvidenceHashInput,
} from '../lib/crypto/evidence-hash'

const SAMPLE_INPUT: EvidenceHashInput = {
  evidence_id: '550e8400-e29b-41d4-a716-446655440000',
  case_id: '550e8400-e29b-41d4-a716-446655440001',
  evidence_number: 'EVD-001',
  officer_id: '550e8400-e29b-41d4-a716-446655440002',
  timestamp_utc: '2024-01-15T10:30:00.000Z',
  latitude: 48.8566,
  longitude: 2.3522,
  gps_accuracy: 3.5,
  media_sha256: 'a'.repeat(64),
  media_type: 'PHOTO',
  mime_type: 'image/jpeg',
  file_size_bytes: 2048576,
}

describe('Evidence Hash — Canonical Serialization', () => {
  it('produces consistent JSON with sorted keys', () => {
    const canonical = buildCanonicalEvidenceData(SAMPLE_INPUT)
    const parsed = JSON.parse(canonical)
    const keys = Object.keys(parsed)
    const sortedKeys = [...keys].sort()
    expect(keys).toEqual(sortedKeys)
  })

  it('includes algorithm version', () => {
    const canonical = buildCanonicalEvidenceData(SAMPLE_INPUT)
    expect(canonical).toContain('FORENZA_EVIDENCE_HASH_v1')
  })

  it('includes all required fields', () => {
    const canonical = JSON.parse(buildCanonicalEvidenceData(SAMPLE_INPUT))
    expect(canonical.evidence_id).toBe(SAMPLE_INPUT.evidence_id)
    expect(canonical.case_id).toBe(SAMPLE_INPUT.case_id)
    expect(canonical.officer_id).toBe(SAMPLE_INPUT.officer_id)
    expect(canonical.media_sha256).toBe(SAMPLE_INPUT.media_sha256)
    expect(canonical.latitude).toBe(SAMPLE_INPUT.latitude)
    expect(canonical.longitude).toBe(SAMPLE_INPUT.longitude)
  })

  it('produces different canonical data for different evidence', () => {
    const input2 = { ...SAMPLE_INPUT, evidence_id: '550e8400-e29b-41d4-a716-446655440099' }
    const c1 = buildCanonicalEvidenceData(SAMPLE_INPUT)
    const c2 = buildCanonicalEvidenceData(input2)
    expect(c1).not.toBe(c2)
  })
})

describe('Evidence Hash — SHA-256 Generation', () => {
  it('generates a 64-character hex hash', async () => {
    const hash = await generateEvidenceHash(SAMPLE_INPUT)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic — same input produces same hash', async () => {
    const h1 = await generateEvidenceHash(SAMPLE_INPUT)
    const h2 = await generateEvidenceHash(SAMPLE_INPUT)
    expect(h1).toBe(h2)
  })

  it('produces different hash for different evidence', async () => {
    const input2 = { ...SAMPLE_INPUT, evidence_id: '550e8400-e29b-41d4-a716-999999990000' }
    const h1 = await generateEvidenceHash(SAMPLE_INPUT)
    const h2 = await generateEvidenceHash(input2)
    expect(h1).not.toBe(h2)
  })

  it('is sensitive to latitude change (tamper detection)', async () => {
    const tampered = { ...SAMPLE_INPUT, latitude: 48.8567 } // 1m offset
    const original = await generateEvidenceHash(SAMPLE_INPUT)
    const modified = await generateEvidenceHash(tampered)
    expect(original).not.toBe(modified)
  })

  it('is sensitive to media_sha256 change (tamper detection)', async () => {
    const tampered = { ...SAMPLE_INPUT, media_sha256: 'b'.repeat(64) }
    const original = await generateEvidenceHash(SAMPLE_INPUT)
    const modified = await generateEvidenceHash(tampered)
    expect(original).not.toBe(modified)
  })
})

describe('Evidence Hash — Verification', () => {
  it('returns INTEGRITY_VERIFIED when hash matches', async () => {
    const hash = await generateEvidenceHash(SAMPLE_INPUT)
    const result = await verifyEvidenceHash(hash, SAMPLE_INPUT)
    expect(result.status).toBe('INTEGRITY_VERIFIED')
    expect(result.match).toBe(true)
  })

  it('returns COMPROMISED_TAMPERED when hash does not match', async () => {
    const result = await verifyEvidenceHash('0'.repeat(64), SAMPLE_INPUT)
    expect(result.status).toBe('COMPROMISED_TAMPERED')
    expect(result.match).toBe(false)
  })

  it('detects single field tampering', async () => {
    const hash = await generateEvidenceHash(SAMPLE_INPUT)
    // Simulate DB tampering: change GPS coordinates
    const tampered = { ...SAMPLE_INPUT, latitude: 0.0 }
    const result = await verifyEvidenceHash(hash, tampered)
    expect(result.status).toBe('COMPROMISED_TAMPERED')
    expect(result.match).toBe(false)
  })

  it('returns stored and calculated hashes for forensic comparison', async () => {
    const stored = '0'.repeat(64)
    const result = await verifyEvidenceHash(stored, SAMPLE_INPUT)
    expect(result.stored_hash).toBe(stored)
    expect(result.calculated_hash).toHaveLength(64)
    expect(result.stored_hash).not.toBe(result.calculated_hash)
  })
})
