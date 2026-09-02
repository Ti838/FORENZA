import { describe, it, expect } from 'vitest'
import { EvidenceStateEngine, StateEventInput, EvidenceStateNode } from '../lib/state/evidence-state-engine'
import { CustodyEngine } from '../lib/custody/custody-engine'
import { Ed25519Signer } from '../lib/crypto/signatures'

describe('Phase 2: Immutable Evidence State Engine & Custody Hardening', () => {
  describe('FZ-TWIN Evidence State Engine (E0 -> E1 -> E2)', () => {
    it('should build and cryptographically verify sequential state history', async () => {
      const officerKeys = Ed25519Signer.generateKeyPair()
      const labKeys = Ed25519Signer.generateKeyPair()

      const publicKeysMap: Record<string, string> = {
        'KEY-OFFICER-01': officerKeys.publicKeyHex,
        'KEY-LAB-01': labKeys.publicKeyHex,
      }

      // 1. Initial State E0 (Sealed at crime scene)
      const state0Input: StateEventInput = {
        evidence_id: 'EV-2026-001',
        parent_state_id: null,
        event_type: 'EVIDENCE_SEALED',
        actor_id: 'USER-OFFICER-01',
        device_id: 'DEV-MOBILE-01',
        timestamp_utc: '2026-09-01T10:00:00.000Z',
        location: { latitude: 40.7128, longitude: -74.006 },
        event_data: {
          action: 'INITIAL_SEAL',
          notes: 'Evidence sealed in anti-static bag',
        },
      }

      const state0 = await EvidenceStateEngine.createState(
        state0Input,
        null,
        officerKeys.privateKeyHex,
        'KEY-OFFICER-01'
      )
      expect(state0.previous_state_hash).toBeNull()
      expect(state0.state_hash).toMatch(/^[a-f0-9]{64}$/)

      // 2. Transition to State E1 (Vault Received)
      const state1Input: StateEventInput = {
        evidence_id: 'EV-2026-001',
        parent_state_id: state0.state_id,
        event_type: 'VAULT_STORED',
        actor_id: 'USER-OFFICER-01',
        device_id: 'DEV-MOBILE-01',
        timestamp_utc: '2026-09-01T11:00:00.000Z',
        location: { latitude: 40.7138, longitude: -74.005 },
        event_data: {
          rack: 'RACK-B',
          bin: 'BIN-14',
          seal_intact: true,
        },
      }

      const state1 = await EvidenceStateEngine.createState(
        state1Input,
        state0.state_hash,
        officerKeys.privateKeyHex,
        'KEY-OFFICER-01'
      )
      expect(state1.previous_state_hash).toBe(state0.state_hash)

      // 3. Transition to State E2 (Lab Analysis Started)
      const state2Input: StateEventInput = {
        evidence_id: 'EV-2026-001',
        parent_state_id: state1.state_id,
        event_type: 'LAB_ANALYSIS_STARTED',
        actor_id: 'USER-LAB-01',
        device_id: 'DEV-LAB-WORKSTATION',
        timestamp_utc: '2026-09-01T14:00:00.000Z',
        location: null,
        event_data: {
          instrument: 'GC-MS Spectrometer #4',
          sample_quantity_mg: 15.5,
        },
      }

      const state2 = await EvidenceStateEngine.createState(
        state2Input,
        state1.state_hash,
        labKeys.privateKeyHex,
        'KEY-LAB-01'
      )

      const history: EvidenceStateNode[] = [state0, state1, state2]

      // Verify intact history
      const verification = await EvidenceStateEngine.verifyStateHistory(history, publicKeysMap)
      expect(verification.isValid).toBe(true)
      expect(verification.verifiedStates).toBe(3)

      // Detect tampering in E1 event data
      const tamperedHistory: EvidenceStateNode[] = [
        state0,
        {
          ...state1,
          event_data: { rack: 'RACK-ILLEGAL-MUTATION' },
        },
        state2,
      ]

      const tamperedVerification = await EvidenceStateEngine.verifyStateHistory(
        tamperedHistory,
        publicKeysMap
      )
      expect(tamperedVerification.isValid).toBe(false)
      expect(tamperedVerification.brokenIndex).toBe(1)
    })
  })

  describe('FZ-CHAIN Custody Engine & Nonce Replay Defense', () => {
    it('should complete secure custody handover with dual digital signatures', async () => {
      const senderKeys = Ed25519Signer.generateKeyPair()
      const receiverKeys = Ed25519Signer.generateKeyPair()

      // Sender creates handover token
      const { token } = await CustodyEngine.createHandoverToken(
        {
          evidence_id: 'EV-2026-001',
          sender_id: 'OFFICER-ALICE',
          sender_device_id: 'DEV-ALICE',
          target_receiver_id: 'CUSTODIAN-BOB',
        },
        senderKeys.privateKeyHex
      )

      // Receiver accepts handover
      const receipt = await CustodyEngine.acceptHandover(
        {
          token,
          receiver_id: 'CUSTODIAN-BOB',
          receiver_device_id: 'DEV-BOB',
          condition: 'INTACT',
          receiver_private_key_hex: receiverKeys.privateKeyHex,
        },
        senderKeys.publicKeyHex
      )

      expect(receipt.evidence_id).toBe('EV-2026-001')
      expect(receipt.sender_id).toBe('OFFICER-ALICE')
      expect(receipt.receiver_id).toBe('CUSTODIAN-BOB')
      expect(receipt.condition).toBe('INTACT')
      expect(receipt.receiver_signature).toBeDefined()

      // Replay attack with same token must fail
      await expect(
        CustodyEngine.acceptHandover(
          {
            token,
            receiver_id: 'CUSTODIAN-BOB',
            receiver_device_id: 'DEV-BOB',
            condition: 'INTACT',
            receiver_private_key_hex: receiverKeys.privateKeyHex,
          },
          senderKeys.publicKeyHex
        )
      ).rejects.toThrow(/Replay attack detected/)
    })
  })
})
