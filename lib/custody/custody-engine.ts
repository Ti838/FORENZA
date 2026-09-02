/**
 * FORENZA — Custody Transfer & Nonce Verification Engine (FZ-CHAIN)
 *
 * Implements hardened, single-use, nonce-protected custody handovers with
 * dual Ed25519 signatures, physical condition recording, and replay prevention.
 */

import { SignJWT, jwtVerify } from 'jose'
import { sha256 } from '../crypto/evidence-hash'
import { Ed25519Signer } from '../crypto/signatures'

export type PhysicalCondition =
  | 'INTACT'
  | 'DAMAGED'
  | 'OPENED'
  | 'BROKEN_SEAL'
  | 'CONTAMINATED'
  | 'UNKNOWN'

export interface CustodyHandoverInitiation {
  evidence_id: string
  sender_id: string
  sender_device_id: string
  target_receiver_id?: string
  ttl_seconds?: number
}

export interface CustodyReceiptInput {
  token: string
  receiver_id: string
  receiver_device_id: string
  condition: PhysicalCondition
  condition_notes?: string
  condition_photo_hash?: string
  receiver_private_key_hex: string
}

export interface VerifiedHandoverReceipt {
  transfer_id: string
  evidence_id: string
  sender_id: string
  receiver_id: string
  condition: PhysicalCondition
  nonce: string
  sender_signature?: string
  receiver_signature: string
  transferred_at_utc: string
}

export class CustodyEngine {
  private static usedNonces = new Set<string>()

  private static getHandoverSecret(): Uint8Array {
    const secret = process.env.FORENZA_HANDOVER_JWT_SECRET || 'forenza_default_handover_secret_32_bytes_len'
    return new TextEncoder().encode(secret)
  }

  /**
   * Sender generates a secure single-use handover token with cryptographically random nonce
   */
  static async createHandoverToken(
    input: CustodyHandoverInitiation,
    senderPrivateKeyHex: string
  ): Promise<{ token: string; nonce: string; expiresAt: Date }> {
    const ttl = input.ttl_seconds ?? 900 // 15 minutes default
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = new Date((now + ttl) * 1000)
    const nonce = crypto.randomUUID()

    // Sign payload with sender Ed25519 key for non-repudiation
    const payloadToSign = `${input.evidence_id}:${input.sender_id}:${nonce}:${now}`
    const senderSignature = Ed25519Signer.sign(payloadToSign, senderPrivateKeyHex)

    const token = await new SignJWT({
      type: 'CUSTODY_HANDOVER_SECURE',
      evidence_id: input.evidence_id,
      sender_id: input.sender_id,
      sender_device_id: input.sender_device_id,
      target_receiver_id: input.target_receiver_id ?? null,
      nonce,
      sender_signature: senderSignature,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(input.evidence_id)
      .setIssuedAt(now)
      .setExpirationTime(now + ttl)
      .sign(this.getHandoverSecret())

    return { token, nonce, expiresAt }
  }

  /**
   * Receiver accepts handover, validates nonce, validates token single-use,
   * inspects condition, and digitally signs receipt.
   */
  static async acceptHandover(
    input: CustodyReceiptInput,
    senderPublicKeyHex?: string
  ): Promise<VerifiedHandoverReceipt> {
    const { payload } = await jwtVerify(input.token, this.getHandoverSecret())
    const typedPayload = payload as {
      type: string
      evidence_id: string
      sender_id: string
      sender_device_id: string
      target_receiver_id: string | null
      nonce: string
      sender_signature?: string
      iat: number
    }

    if (typedPayload.type !== 'CUSTODY_HANDOVER_SECURE') {
      throw new Error('Invalid custody handover token type')
    }

    // Single-use Nonce Replay Check
    if (this.usedNonces.has(typedPayload.nonce)) {
      throw new Error('SECURITY ALERT: Handover token nonce has already been used (Replay attack detected)')
    }

    // Target Receiver check if bound to specific receiver
    if (typedPayload.target_receiver_id && typedPayload.target_receiver_id !== input.receiver_id) {
      throw new Error('Unauthorized receiver: Handover token is cryptographically bound to a different recipient')
    }

    // Sender signature verification if public key provided
    if (senderPublicKeyHex && typedPayload.sender_signature) {
      const payloadToVerify = `${typedPayload.evidence_id}:${typedPayload.sender_id}:${typedPayload.nonce}:${typedPayload.iat}`
      const isSenderValid = Ed25519Signer.verify(
        payloadToVerify,
        typedPayload.sender_signature,
        senderPublicKeyHex
      )
      if (!isSenderValid) {
        throw new Error('Invalid sender signature on custody handover token')
      }
    }

    // Mark nonce as spent immediately
    this.usedNonces.add(typedPayload.nonce)

    // Receiver signs receipt
    const nowUtc = new Date().toISOString()
    const receiptData = `${typedPayload.evidence_id}:${typedPayload.sender_id}:${input.receiver_id}:${input.condition}:${typedPayload.nonce}:${nowUtc}`
    const receiverSignature = Ed25519Signer.sign(receiptData, input.receiver_private_key_hex)

    return {
      transfer_id: crypto.randomUUID(),
      evidence_id: typedPayload.evidence_id,
      sender_id: typedPayload.sender_id,
      receiver_id: input.receiver_id,
      condition: input.condition,
      nonce: typedPayload.nonce,
      sender_signature: typedPayload.sender_signature,
      receiver_signature: receiverSignature,
      transferred_at_utc: nowUtc,
    }
  }
}
