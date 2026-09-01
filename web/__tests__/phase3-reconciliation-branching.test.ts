import { describe, it, expect } from 'vitest'
import { ProvenanceEngine, ProvenanceGraph, ProvenanceNode, ProvenanceEdge } from '../lib/provenance/provenance-engine'
import { ReconciliationEngine } from '../lib/reconciliation/epra'
import { BranchAdjudicationService } from '../lib/branching/branch-adjudication'
import { EvidenceStateEngine, StateEventInput } from '../lib/state/evidence-state-engine'
import { Ed25519Signer } from '../lib/crypto/signatures'

describe('Phase 3: Provenance, EPRA, Divergence & Adjudication', () => {
  describe('FZ-PROV Provenance Graph Engine', () => {
    it('should correctly traverse downstream derivatives and upstream ancestry', () => {
      const nodeOriginal: ProvenanceNode = {
        node_id: 'NODE-ORIGINAL',
        evidence_id: 'EV-01',
        node_type: 'ORIGINAL_EVIDENCE',
        title: 'Seized Knife',
        artifact_hash: 'hash_orig',
        creator_id: 'OFFICER-01',
        metadata: {},
        created_at: '2026-09-01T10:00:00Z',
      }

      const nodeSampleA: ProvenanceNode = {
        node_id: 'NODE-SAMPLE-A',
        evidence_id: 'EV-01',
        node_type: 'SAMPLE',
        title: 'Blade Swab Sample A',
        artifact_hash: 'hash_sample_a',
        creator_id: 'LAB-01',
        metadata: {},
        created_at: '2026-09-01T11:00:00Z',
      }

      const nodeLabReport: ProvenanceNode = {
        node_id: 'NODE-LAB-REPORT',
        evidence_id: 'EV-01',
        node_type: 'LAB_RESULT',
        title: 'DNA Match Report',
        artifact_hash: 'hash_report',
        creator_id: 'LAB-01',
        metadata: {},
        created_at: '2026-09-01T13:00:00Z',
      }

      const nodeExhibit: ProvenanceNode = {
        node_id: 'NODE-COURT-EXHIBIT',
        evidence_id: 'EV-01',
        node_type: 'COURT_EXHIBIT',
        title: 'Trial Exhibit #12',
        artifact_hash: 'hash_exhibit',
        creator_id: 'JUDGE-01',
        metadata: {},
        created_at: '2026-09-01T15:00:00Z',
      }

      const graph: ProvenanceGraph = {
        nodes: [nodeOriginal, nodeSampleA, nodeLabReport, nodeExhibit],
        edges: [
          {
            edge_id: 'E1',
            source_node_id: 'NODE-ORIGINAL',
            target_node_id: 'NODE-SAMPLE-A',
            relationship_type: 'EXTRACTED_FROM',
            created_by: 'LAB-01',
            created_at: '2026-09-01T11:00:00Z',
          },
          {
            edge_id: 'E2',
            source_node_id: 'NODE-SAMPLE-A',
            target_node_id: 'NODE-LAB-REPORT',
            relationship_type: 'ANALYZED_BY',
            created_by: 'LAB-01',
            created_at: '2026-09-01T13:00:00Z',
          },
          {
            edge_id: 'E3',
            source_node_id: 'NODE-LAB-REPORT',
            target_node_id: 'NODE-COURT-EXHIBIT',
            relationship_type: 'EXHIBITED_AS',
            created_by: 'JUDGE-01',
            created_at: '2026-09-01T15:00:00Z',
          },
        ],
      }

      const downstream = ProvenanceEngine.getDownstreamArtifacts(graph, 'NODE-ORIGINAL')
      expect(downstream.map((n) => n.node_id)).toEqual([
        'NODE-SAMPLE-A',
        'NODE-LAB-REPORT',
        'NODE-COURT-EXHIBIT',
      ])

      const upstream = ProvenanceEngine.getUpstreamAncestry(graph, 'NODE-COURT-EXHIBIT')
      expect(upstream.map((n) => n.node_id)).toEqual([
        'NODE-LAB-REPORT',
        'NODE-SAMPLE-A',
        'NODE-ORIGINAL',
      ])
    })
  })

  describe('FZ-EPRA & FZ-DIV First Divergence Detection', () => {
    it('should pinpoint exact node of first divergence across conflicting histories', async () => {
      const keysA = Ed25519Signer.generateKeyPair()
      const keysB = Ed25519Signer.generateKeyPair()

      // Common state E0
      const e0Input: StateEventInput = {
        evidence_id: 'EV-01',
        parent_state_id: null,
        event_type: 'EVIDENCE_SEALED',
        actor_id: 'OFFICER-01',
        device_id: 'DEV-01',
        timestamp_utc: '2026-09-01T08:00:00Z',
        event_data: { serial: 'SN-001' },
      }
      const e0 = await EvidenceStateEngine.createState(e0Input, null, keysA.privateKeyHex, 'KEY-A')

      // Common state E1
      const e1Input: StateEventInput = {
        evidence_id: 'EV-01',
        parent_state_id: e0.state_id,
        event_type: 'VAULT_STORED',
        actor_id: 'CUSTODIAN-01',
        device_id: 'DEV-01',
        timestamp_utc: '2026-09-01T09:00:00Z',
        event_data: { rack: 'A1' },
      }
      const e1 = await EvidenceStateEngine.createState(e1Input, e0.state_hash, keysA.privateKeyHex, 'KEY-A')

      // History A: E2-A
      const e2AInput: StateEventInput = {
        evidence_id: 'EV-01',
        parent_state_id: e1.state_id,
        event_type: 'LAB_RECEIVED',
        actor_id: 'LAB-ANALYST-ALICE',
        device_id: 'DEV-LAB-A',
        timestamp_utc: '2026-09-01T10:00:00Z',
        event_data: { bench: 'LAB-BENCH-1' },
      }
      const e2A = await EvidenceStateEngine.createState(e2AInput, e1.state_hash, keysA.privateKeyHex, 'KEY-A')

      // History B (Conflicting fork): E2-B
      const e2BInput: StateEventInput = {
        evidence_id: 'EV-01',
        parent_state_id: e1.state_id,
        event_type: 'LAB_RECEIVED',
        actor_id: 'LAB-ANALYST-BOB', // Conflict in actor!
        device_id: 'DEV-LAB-B',      // Conflict in device!
        timestamp_utc: '2026-09-01T10:05:00Z',
        event_data: { bench: 'LAB-BENCH-2' },
      }
      const e2B = await EvidenceStateEngine.createState(e2BInput, e1.state_hash, keysB.privateKeyHex, 'KEY-B')

      const historyA = [e0, e1, e2A]
      const historyB = [e0, e1, e2B]

      const report = ReconciliationEngine.reconcile(historyA, historyB)
      expect(report.isIdentical).toBe(false)
      expect(report.verdict).toBe('CRITICAL_CONFLICT')
      expect(report.divergence?.firstDivergentIndex).toBe(2)
      expect(report.divergence?.commonAncestorStateId).toBe(e1.state_id)
      expect(report.divergence?.changedFields).toContain('actor_id')
      expect(report.divergence?.changedFields).toContain('device_id')
    })
  })

  describe('FZ-BRANCH & FZ-ADJ Adjudication Engine', () => {
    it('should create parallel branches and sign/verify human judicial adjudication', async () => {
      const judgeKeys = Ed25519Signer.generateKeyPair()

      // Create branches from divergence point
      const { branchA, branchB } = BranchAdjudicationService.createBranches(
        'EV-01',
        'STATE-E1-COMMON',
        'STATE-E2-A',
        'STATE-E2-B',
        'DEV-A',
        'DEV-B'
      )

      expect(branchA.branch_name).toBe('BRANCH_PRIMARY')
      expect(branchB.branch_name).toBe('BRANCH_SECONDARY_CONFLICT')

      // Judge adjudicates
      const adjudication = await BranchAdjudicationService.adjudicate(
        'EV-01',
        'USER-JUDGE-CHAMBER',
        'DEV-JUDGE-SECURE',
        'ACCEPT_BRANCH_A',
        'Branch A matches physical transfer receipt #4092 and lab bench shift logs.',
        ['STATE-E2-A'],
        judgeKeys.privateKeyHex,
        1
      )

      expect(adjudication.decision).toBe('ACCEPT_BRANCH_A')
      expect(adjudication.signature).toBeDefined()

      // Verification of signed adjudication
      const isValid = await BranchAdjudicationService.verifyAdjudication(
        adjudication,
        judgeKeys.publicKeyHex
      )
      expect(isValid).toBe(true)

      // Verification fails if adjudication content is modified
      const tampered = { ...adjudication, decision: 'ACCEPT_BRANCH_B' as const }
      const isTamperedValid = await BranchAdjudicationService.verifyAdjudication(
        tampered,
        judgeKeys.publicKeyHex
      )
      expect(isTamperedValid).toBe(false)
    })
  })
})
