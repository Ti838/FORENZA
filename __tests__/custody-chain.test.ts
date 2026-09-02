import { describe, it, expect } from 'vitest'
import {
  extendCustodyChain,
  verifyCustodyChain,
  GENESIS_HASH,
  buildCanonicalCustodyData,
  CustodyChainEvent,
  CustodyEventInput,
} from '../lib/crypto/custody-chain'

const makeEvent = (overrides: Partial<CustodyEventInput> = {}): CustodyEventInput => ({
  custody_id: crypto.randomUUID(),
  evidence_id: '550e8400-e29b-41d4-a716-446655440000',
  action: 'CAPTURED',
  sender_id: null,
  receiver_id: '550e8400-e29b-41d4-a716-446655440001',
  timestamp: '2024-01-15T10:30:00.000Z',
  latitude: 48.8566,
  longitude: 2.3522,
  ...overrides,
})

describe('Custody Chain — Canonical Data', () => {
  it('produces sorted keys', () => {
    const event = makeEvent()
    const canonical = buildCanonicalCustodyData(event)
    const parsed = JSON.parse(canonical)
    const keys = Object.keys(parsed)
    expect(keys).toEqual([...keys].sort())
  })

  it('includes algorithm version', () => {
    const canonical = buildCanonicalCustodyData(makeEvent())
    expect(canonical).toContain('FORENZA_CUSTODY_CHAIN_v1')
  })
})

describe('Custody Chain — Hash Extension', () => {
  it('genesis hash is the fixed value', () => {
    expect(GENESIS_HASH).toBe('FORENZA_GENESIS_v1')
  })

  it('generates a 64-char hex hash', async () => {
    const event = makeEvent()
    const hash = await extendCustodyChain(GENESIS_HASH, event)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic', async () => {
    const event = makeEvent({ custody_id: '550e8400-e29b-41d4-a716-446655440099' })
    const h1 = await extendCustodyChain(GENESIS_HASH, event)
    const h2 = await extendCustodyChain(GENESIS_HASH, event)
    expect(h1).toBe(h2)
  })

  it('changes when previous hash changes', async () => {
    const event = makeEvent({ custody_id: '550e8400-e29b-41d4-a716-446655440099' })
    const h1 = await extendCustodyChain(GENESIS_HASH, event)
    const h2 = await extendCustodyChain('different_previous', event)
    expect(h1).not.toBe(h2)
  })
})

describe('Custody Chain — Full Verification', () => {
  async function buildChain(length: number): Promise<CustodyChainEvent[]> {
    const events: CustodyChainEvent[] = []
    let previousHash = GENESIS_HASH

    for (let i = 0; i < length; i++) {
      const id = `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`
      // Use a fixed timestamp per event — this is what gets hashed
      const eventTimestamp = new Date(2024_000_000_000 + i * 1000).toISOString()
      const eventInput = makeEvent({ custody_id: id, action: i === 0 ? 'CAPTURED' : 'RECEIVED', timestamp: eventTimestamp })
      const currentHash = await extendCustodyChain(previousHash, eventInput)

      events.push({
        id,
        evidence_id: eventInput.evidence_id,
        action: eventInput.action,
        sender_id: eventInput.sender_id,
        receiver_id: eventInput.receiver_id,
        previous_hash: i === 0 ? GENESIS_HASH : events[i - 1].current_hash,
        current_hash: currentHash,
        latitude: eventInput.latitude,
        longitude: eventInput.longitude,
        // Store timestamp in canonical_data so verifier can reconstruct
        canonical_data: { timestamp: eventTimestamp },
        created_at: eventTimestamp,
      })

      previousHash = currentHash
    }

    return events
  }

  it('verifies empty chain', async () => {
    const result = await verifyCustodyChain([])
    expect(result.status).toBe('VERIFIED')
    expect(result.total_events).toBe(0)
  })


  it('verifies a valid single-event chain', async () => {
    const chain = await buildChain(1)
    const result = await verifyCustodyChain(chain)
    expect(result.status).toBe('VERIFIED')
    expect(result.total_events).toBe(1)
    expect(result.verified_events).toBe(1)
  })

  it('verifies a valid 5-event chain', async () => {
    const chain = await buildChain(5)
    const result = await verifyCustodyChain(chain)
    expect(result.status).toBe('VERIFIED')
    expect(result.total_events).toBe(5)
    expect(result.verified_events).toBe(5)
  })

  it('detects tampering in first event', async () => {
    const chain = await buildChain(3)
    // Tamper: modify the first event's current_hash
    chain[0].current_hash = '0'.repeat(64)

    const result = await verifyCustodyChain(chain)
    expect(result.status).toBe('BROKEN')
    expect(result.broken_event_id).toBe(chain[0].id)
    expect(result.broken_at_index).toBe(0)
  })

  it('detects tampering in middle event', async () => {
    const chain = await buildChain(5)
    // Tamper: modify event at index 2
    chain[2].current_hash = 'deadbeef'.repeat(8)

    const result = await verifyCustodyChain(chain)
    expect(result.status).toBe('BROKEN')
    expect(result.broken_at_index).toBe(2)
  })

  it('detects previous_hash pointer tampering', async () => {
    const chain = await buildChain(3)
    // Tamper: change the previous_hash pointer on event 1
    chain[1].previous_hash = '0'.repeat(64)

    const result = await verifyCustodyChain(chain)
    expect(result.status).toBe('BROKEN')
    expect(result.broken_at_index).toBe(1)
  })

  it('provides failure reason on broken chain', async () => {
    const chain = await buildChain(2)
    chain[0].current_hash = '0'.repeat(64)

    const result = await verifyCustodyChain(chain)
    expect(result.failure_reason).toBeTruthy()
    expect(typeof result.failure_reason).toBe('string')
  })
})
