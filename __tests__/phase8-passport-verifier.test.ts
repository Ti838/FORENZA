import { describe, it, expect } from 'vitest'
import { EvidencePassportService } from '../lib/passport/evidence-passport'
import { IndependentVerifier } from '../lib/verifier/independent-verifier'
import { EvidenceStateEngine, StateEventInput } from '../lib/state/evidence-state-engine'
import { Ed25519Signer } from '../lib/crypto/signatures'

describe('Phase 8: Evidence Passport & Independent Verifier (FZ-PASS & FZ-VERIFY)', () => {
  it('should package evidence into passport and independently verify all cryptographic proofs', async () => {
    const officerKeys = Ed25519Signer.generateKeyPair()
    const custodianKeys = Ed25519Signer.generateKeyPair()

    const publicKeysMap: Record<string, string> = {
      'KEY-OFFICER-01': officerKeys.publicKeyHex,
      'KEY-CUSTODIAN-01': custodianKeys.publicKeyHex,
    }

    // 1. Build initial state E0
    const state0Input: StateEventInput = {
      evidence_id: 'EV-PASS-01',
      parent_state_id: null,
      event_type: 'EVIDENCE_SEALED',
      actor_id: 'OFFICER-01',
      device_id: 'DEV-01',
      timestamp_utc: '2026-09-01T10:00:00Z',
      event_data: { note: 'Initial scene seizure' },
    }
    const state0 = await EvidenceStateEngine.createState(
      state0Input,
      null,
      officerKeys.privateKeyHex,
      'KEY-OFFICER-01'
    )

    // 2. Build state E1
    const state1Input: StateEventInput = {
      evidence_id: 'EV-PASS-01',
      parent_state_id: state0.state_id,
      event_type: 'VAULT_STORED',
      actor_id: 'CUSTODIAN-01',
      device_id: 'DEV-02',
      timestamp_utc: '2026-09-01T11:00:00Z',
      event_data: { rack: 'SECURE-VAULT-RACK-09' },
    }
    const state1 = await EvidenceStateEngine.createState(
      state1Input,
      state0.state_hash,
      custodianKeys.privateKeyHex,
      'KEY-CUSTODIAN-01'
    )

    const masterHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const sealingSig = Ed25519Signer.sign(masterHash, officerKeys.privateKeyHex)

    // 3. Generate Portable Evidence Integrity Passport
    const passport = await EvidencePassportService.generatePassport(
      'EV-PASS-01',
      'CASE-99',
      'content_hash_123',
      'metadata_hash_456',
      masterHash,
      sealingSig,
      'KEY-OFFICER-01',
      [state0, state1]
    )

    expect(passport.passport_hash).toMatch(/^[a-f0-9]{64}$/)

    // 4. Independent Verification
    const report = await IndependentVerifier.verifyPassport(passport, publicKeysMap)
    expect(report.verdict).toBe('PASS')
    expect(report.passport_hash_valid).toBe(true)
    expect(report.sealing_signature_valid).toBe(true)
    expect(report.state_chain_valid).toBe(true)
    expect(report.total_states_verified).toBe(2)

    // 5. Verification failure when state history is tampered
    const tamperedPassport = {
      ...passport,
      payload: {
        ...passport.payload,
        state_history: [
          state0,
          {
            ...state1,
            event_data: { rack: 'CORRUPTED-LOCATION' },
          },
        ],
      },
    }

    const tamperedReport = await IndependentVerifier.verifyPassport(
      tamperedPassport,
      publicKeysMap
    )
    expect(tamperedReport.verdict).toBe('FAIL')
    expect(tamperedReport.passport_hash_valid).toBe(false)
  })
})
