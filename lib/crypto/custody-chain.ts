/**
 * FORENZA — Custody Hash Chain
 *
 * Implements a blockchain-style hash chain for custody events.
 * Each event links to the previous, forming a tamper-evident chain.
 *
 * current_hash = SHA256(previous_hash + canonical_event_data)
 *
 * Genesis hash: "FORENZA_GENESIS_v1" (fixed, published, deterministic)
 */

import { sha256 } from './evidence-hash'
import { CustodyAction } from '@/types'

export const GENESIS_HASH = 'FORENZA_GENESIS_v1'

export interface CustodyEventInput {
  custody_id: string
  evidence_id: string
  action: CustodyAction
  sender_id: string | null
  receiver_id: string | null
  timestamp: string           // ISO 8601
  latitude: number | null
  longitude: number | null
}

/**
 * Build canonical serialization of a custody event.
 * Keys are alphabetically sorted to prevent ambiguity.
 */
export function buildCanonicalCustodyData(event: CustodyEventInput): string {
  const canonical = {
    action: event.action,
    algorithm: 'FORENZA_CUSTODY_CHAIN_v1',
    custody_id: event.custody_id,
    evidence_id: event.evidence_id,
    latitude: event.latitude ?? null,
    longitude: event.longitude ?? null,
    receiver_id: event.receiver_id ?? null,
    sender_id: event.sender_id ?? null,
    timestamp: event.timestamp,
  }
  return JSON.stringify(canonical, Object.keys(canonical).sort())
}

/**
 * Extend the custody chain with a new event.
 *
 * @param previousHash - The previous event's hash (or GENESIS_HASH for first event)
 * @param event - The new custody event data
 * @returns New hash for this event
 */
export async function extendCustodyChain(
  previousHash: string,
  event: CustodyEventInput
): Promise<string> {
  const canonicalData = buildCanonicalCustodyData(event)
  const chainInput = previousHash + canonicalData
  return sha256(chainInput)
}

// ---------------------------------------------------------------------------
// Chain Verification
// ---------------------------------------------------------------------------

export interface CustodyChainEvent {
  id: string
  evidence_id: string
  action: CustodyAction
  sender_id: string | null
  receiver_id: string | null
  previous_hash: string | null
  current_hash: string
  latitude: number | null
  longitude: number | null
  canonical_data: Record<string, unknown>
  created_at: string
}

export type ChainVerificationStatus = 'VERIFIED' | 'BROKEN'

export interface CustodyChainVerification {
  status: ChainVerificationStatus
  total_events: number
  verified_events: number
  broken_event_id: string | null
  broken_at_index: number | null
  expected_hash: string | null
  calculated_hash: string | null
  failure_reason: string | null
}

/**
 * Verify the complete custody hash chain for an evidence item.
 *
 * Iterates through all custody events in chronological order,
 * recomputes each hash, and checks against stored values.
 *
 * @param events - All custody events in ascending created_at order
 * @returns Verification result
 */
export async function verifyCustodyChain(
  events: CustodyChainEvent[]
): Promise<CustodyChainVerification> {
  if (events.length === 0) {
    return {
      status: 'VERIFIED',
      total_events: 0,
      verified_events: 0,
      broken_event_id: null,
      broken_at_index: null,
      expected_hash: null,
      calculated_hash: null,
      failure_reason: null,
    }
  }

  let previousHash = GENESIS_HASH
  let verifiedCount = 0

  for (let i = 0; i < events.length; i++) {
    const event = events[i]

    // Extract the event input from stored canonical_data
    // IMPORTANT: Use the canonical_data to reconstruct the exact event input
    // that was used to compute the hash — NOT the DB row's created_at
    const storedCanonical = event.canonical_data as Record<string, unknown> | undefined
    const eventTimestamp = (storedCanonical?.timestamp as string) ?? event.created_at

    const eventInput: CustodyEventInput = {
      custody_id: event.id,
      evidence_id: event.evidence_id,
      action: event.action,
      sender_id: event.sender_id,
      receiver_id: event.receiver_id,
      timestamp: eventTimestamp,
      latitude: event.latitude,
      longitude: event.longitude,
    }

    // Verify previous_hash pointer
    const expectedPreviousHash = i === 0 ? GENESIS_HASH : events[i - 1].current_hash
    if (event.previous_hash !== null && event.previous_hash !== expectedPreviousHash) {
      return {
        status: 'BROKEN',
        total_events: events.length,
        verified_events: verifiedCount,
        broken_event_id: event.id,
        broken_at_index: i,
        expected_hash: expectedPreviousHash,
        calculated_hash: event.previous_hash,
        failure_reason: 'Previous hash pointer mismatch — chain has been tampered with',
      }
    }

    // Recompute current hash
    const calculatedHash = await extendCustodyChain(previousHash, eventInput)

    if (calculatedHash !== event.current_hash) {
      return {
        status: 'BROKEN',
        total_events: events.length,
        verified_events: verifiedCount,
        broken_event_id: event.id,
        broken_at_index: i,
        expected_hash: calculatedHash,
        calculated_hash: event.current_hash,
        failure_reason: `Hash mismatch at event ${i + 1} (${event.action}) — event data has been modified`,
      }
    }

    previousHash = event.current_hash
    verifiedCount++
  }

  return {
    status: 'VERIFIED',
    total_events: events.length,
    verified_events: verifiedCount,
    broken_event_id: null,
    broken_at_index: null,
    expected_hash: null,
    calculated_hash: null,
    failure_reason: null,
  }
}
