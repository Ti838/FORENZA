/**
 * FORENZA — QR Token Generation and Verification
 *
 * QR codes contain an opaque signed JWT.
 * No sensitive data is exposed in the QR payload.
 *
 * Payload: { sub: evidence_id, jti: token_id, type: 'EVIDENCE_QR' }
 */

import { SignJWT, jwtVerify } from 'jose'
import { sha256 } from './crypto/evidence-hash'

const QR_TOKEN_TTL = parseInt(process.env.FORENZA_QR_TOKEN_TTL_SECONDS ?? '86400', 10)
const HANDOVER_TOKEN_TTL = parseInt(process.env.FORENZA_HANDOVER_TOKEN_TTL_SECONDS ?? '900', 10)

function getQrSecret(): Uint8Array {
  const secret = process.env.FORENZA_QR_JWT_SECRET || 'forenza_default_qr_secret_32_bytes_length_secure'
  return new TextEncoder().encode(secret)
}

function getHandoverSecret(): Uint8Array {
  const secret = process.env.FORENZA_HANDOVER_JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('FORENZA_HANDOVER_JWT_SECRET must be at least 32 characters')
  }
  return new TextEncoder().encode(secret)
}

// ---------------------------------------------------------------------------
// QR Tokens (evidence identification)
// ---------------------------------------------------------------------------

export interface QrTokenPayload {
  sub: string       // evidence_id
  jti: string       // unique token ID (stored in qr_tokens.id)
  type: 'EVIDENCE_QR'
  iss: string
  iat: number
  exp: number
}

/**
 * Generate a signed QR token for an evidence item.
 * The JWT contains only the evidence_id and a unique token ID.
 * No custody info, no user data, no location.
 */
export async function generateQrToken(
  evidenceId: string,
  tokenId: string
): Promise<{ token: string; tokenHash: string; expiresAt: Date }> {
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = new Date((now + QR_TOKEN_TTL) * 1000)

  const token = await new SignJWT({
    type: 'EVIDENCE_QR',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(evidenceId)
    .setJti(tokenId)
    .setIssuer('forenza')
    .setIssuedAt(now)
    .setExpirationTime(now + QR_TOKEN_TTL)
    .sign(getQrSecret())

  const tokenHash = await sha256(token)

  return { token, tokenHash, expiresAt }
}

export interface QrVerificationResult {
  valid: boolean
  evidence_id: string | null
  token_id: string | null
  expires_at: Date | null
  error?: string
}

/**
 * Verify a QR token signature and expiration.
 * Does NOT check database — caller must also verify token exists and is not revoked.
 */
export async function verifyQrToken(token: string): Promise<QrVerificationResult> {
  try {
    const { payload } = await jwtVerify(token, getQrSecret(), {
      issuer: 'forenza',
    })

    const typed = payload as unknown as QrTokenPayload

    if (typed.type !== 'EVIDENCE_QR') {
      return { valid: false, evidence_id: null, token_id: null, expires_at: null, error: 'Invalid token type' }
    }

    return {
      valid: true,
      evidence_id: typed.sub,
      token_id: typed.jti,
      expires_at: typed.exp ? new Date(typed.exp * 1000) : null,
    }
  } catch (err) {
    return {
      valid: false,
      evidence_id: null,
      token_id: null,
      expires_at: null,
      error: err instanceof Error ? err.message : 'Token verification failed',
    }
  }
}

// ---------------------------------------------------------------------------
// Handover Tokens (custody transfer)
// ---------------------------------------------------------------------------

export interface HandoverTokenPayload {
  sub: string         // evidence_id
  jti: string         // handover_token.id
  sender: string      // sender user_id
  type: 'CUSTODY_HANDOVER'
  iss: string
  iat: number
  exp: number
}

export async function generateHandoverToken(
  evidenceId: string,
  senderId: string,
  tokenId: string
): Promise<{ token: string; tokenHash: string; expiresAt: Date }> {
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = new Date((now + HANDOVER_TOKEN_TTL) * 1000)

  const token = await new SignJWT({
    type: 'CUSTODY_HANDOVER',
    sender: senderId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(evidenceId)
    .setJti(tokenId)
    .setIssuer('forenza')
    .setIssuedAt(now)
    .setExpirationTime(now + HANDOVER_TOKEN_TTL)
    .sign(getHandoverSecret())

  const tokenHash = await sha256(token)
  return { token, tokenHash, expiresAt }
}

export interface HandoverVerificationResult {
  valid: boolean
  evidence_id: string | null
  sender_id: string | null
  token_id: string | null
  expires_at: Date | null
  error?: string
}

export async function verifyHandoverToken(token: string): Promise<HandoverVerificationResult> {
  try {
    const { payload } = await jwtVerify(token, getHandoverSecret(), {
      issuer: 'forenza',
    })

    const typed = payload as unknown as HandoverTokenPayload

    if (typed.type !== 'CUSTODY_HANDOVER') {
      return { valid: false, evidence_id: null, sender_id: null, token_id: null, expires_at: null, error: 'Invalid token type' }
    }

    return {
      valid: true,
      evidence_id: typed.sub,
      sender_id: typed.sender,
      token_id: typed.jti,
      expires_at: typed.exp ? new Date(typed.exp * 1000) : null,
    }
  } catch (err) {
    return {
      valid: false,
      evidence_id: null,
      sender_id: null,
      token_id: null,
      expires_at: null,
      error: err instanceof Error ? err.message : 'Token verification failed',
    }
  }
}
