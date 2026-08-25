/**
 * FORENZA — Evidence Integrity Hash
 *
 * Generates a canonical SHA-256 hash of evidence identity + media.
 * Uses Web Crypto API (available in Node.js 18+ and all modern browsers).
 *
 * The hash is IMMUTABLE once set at seal time.
 */

export interface EvidenceHashInput {
  evidence_id: string
  case_id: string
  evidence_number: string
  officer_id: string
  timestamp_utc: string       // ISO 8601 captured_at
  latitude: number
  longitude: number
  gps_accuracy: number | null
  media_sha256: string        // SHA-256 of the original media file
  media_type: string          // 'PHOTO' | 'VIDEO'
  mime_type: string
  file_size_bytes: number
}

/**
 * Canonical JSON serialization — sorted keys, no ambiguous concatenation.
 * This format is fixed and published as part of the FORENZA specification.
 * Do not change without a migration.
 */
export function buildCanonicalEvidenceData(input: EvidenceHashInput): string {
  const canonical = {
    algorithm: 'FORENZA_EVIDENCE_HASH_v1',
    case_id: input.case_id,
    evidence_id: input.evidence_id,
    evidence_number: input.evidence_number,
    file_size_bytes: input.file_size_bytes,
    gps_accuracy: input.gps_accuracy ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    media_sha256: input.media_sha256,
    media_type: input.media_type,
    mime_type: input.mime_type,
    officer_id: input.officer_id,
    timestamp_utc: input.timestamp_utc,
  }
  // Alphabetically sorted keys = canonical form
  return JSON.stringify(canonical, Object.keys(canonical).sort())
}

/**
 * Compute SHA-256 of a string using Web Crypto API.
 * Returns lowercase hex string.
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * SHA-256 of raw bytes (for media files).
 */
export async function sha256Bytes(bytes: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate the evidence master hash.
 *
 * @param input - Evidence capture metadata + media hash
 * @returns SHA-256 hex string
 */
export async function generateEvidenceHash(input: EvidenceHashInput): Promise<string> {
  const canonical = buildCanonicalEvidenceData(input)
  return sha256(canonical)
}

// ---------------------------------------------------------------------------
// Integrity Verification
// ---------------------------------------------------------------------------

export type HashVerificationStatus = 'INTEGRITY_VERIFIED' | 'COMPROMISED_TAMPERED'

export interface EvidenceHashVerification {
  status: HashVerificationStatus
  stored_hash: string
  calculated_hash: string
  match: boolean
  canonical_data: string
  verified_at: string
}

/**
 * Verify evidence integrity by recomputing the hash and comparing.
 *
 * @param storedHash - The hash stored in the database at seal time
 * @param input - Current evidence metadata (must match original exactly)
 * @returns Verification result
 */
export async function verifyEvidenceHash(
  storedHash: string,
  input: EvidenceHashInput
): Promise<EvidenceHashVerification> {
  const canonical = buildCanonicalEvidenceData(input)
  const calculatedHash = await sha256(canonical)
  const match = calculatedHash === storedHash.toLowerCase()

  return {
    status: match ? 'INTEGRITY_VERIFIED' : 'COMPROMISED_TAMPERED',
    stored_hash: storedHash,
    calculated_hash: calculatedHash,
    match,
    canonical_data: canonical,
    verified_at: new Date().toISOString(),
  }
}
