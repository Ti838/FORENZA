import { describe, it, expect } from 'vitest'
import { SecurityEventService } from '../lib/security/security-center'
import { IntegrityImpactAnalyzer } from '../lib/impact/impact-analyzer'
import { SyntheticAttackLaboratory } from '../lib/lab/synthetic-attack-lab'
import { EvidenceStateNode } from '../lib/state/evidence-state-engine'
import { ProvenanceGraph } from '../lib/provenance/provenance-engine'

describe('Phase 7: Security Center, Synthetic Lab & Impact Analyzer', () => {
  const dummyStates: EvidenceStateNode[] = [
    {
      state_id: 'STATE-0',
      evidence_id: 'EV-01',
      parent_state_id: null,
      event_type: 'EVIDENCE_SEALED',
      actor_id: 'OFFICER-01',
      device_id: 'DEV-01',
      timestamp_utc: '2026-09-01T10:00:00Z',
      latitude: null,
      longitude: null,
      event_data: { serial: 'SN-100' },
      previous_state_hash: null,
      event_hash: 'evh0',
      state_hash: 'sth0',
      signature: 'sig0',
      signature_algorithm: 'Ed25519',
      key_id: 'k0',
      canonicalization_version: 'RFC8785_v1',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      state_id: 'STATE-1',
      evidence_id: 'EV-01',
      parent_state_id: 'STATE-0',
      event_type: 'VAULT_STORED',
      actor_id: 'CUSTODIAN-01',
      device_id: 'DEV-02',
      timestamp_utc: '2026-09-01T11:00:00Z',
      latitude: null,
      longitude: null,
      event_data: { rack: 'A-12' },
      previous_state_hash: 'sth0',
      event_hash: 'evh1',
      state_hash: 'sth1',
      signature: 'sig1',
      signature_algorithm: 'Ed25519',
      key_id: 'k1',
      canonicalization_version: 'RFC8785_v1',
      created_at: '2026-09-01T11:00:00Z',
    },
    {
      state_id: 'STATE-2',
      evidence_id: 'EV-01',
      parent_state_id: 'STATE-1',
      event_type: 'LAB_RECEIVED',
      actor_id: 'ANALYST-01',
      device_id: 'DEV-03',
      timestamp_utc: '2026-09-01T12:00:00Z',
      latitude: null,
      longitude: null,
      event_data: { aliquot_id: 'SMP-01' },
      previous_state_hash: 'sth1',
      event_hash: 'evh2',
      state_hash: 'sth2',
      signature: 'sig2',
      signature_algorithm: 'Ed25519',
      key_id: 'k2',
      canonicalization_version: 'RFC8785_v1',
      created_at: '2026-09-01T12:00:00Z',
    },
  ]

  describe('FZ-SECURITY Incident Logging', () => {
    it('should log security events and retrieve recent alerts', () => {
      SecurityEventService.clearEvents()
      const log = SecurityEventService.logEvent(
        'HASH_MISMATCH',
        'CRITICAL',
        'Sealed content hash mismatch detected during custody reception',
        { actor_id: 'OFFICER-01', evidence_id: 'EV-01' }
      )

      expect(log.event_type).toBe('HASH_MISMATCH')
      expect(log.severity).toBe('CRITICAL')

      const recent = SecurityEventService.getRecentEvents()
      expect(recent.length).toBe(1)
      expect(recent[0].id).toBe(log.id)
    })
  })

  describe('FZ-IMPACT Blast Radius Analyzer', () => {
    it('should compute downstream affected states and artifacts', () => {
      const graph: ProvenanceGraph = {
        nodes: [
          {
            node_id: 'N0',
            evidence_id: 'EV-01',
            node_type: 'ORIGINAL_EVIDENCE',
            title: 'Weapon',
            artifact_hash: 'h0',
            state_id: 'STATE-0',
            creator_id: 'OFFICER-01',
            metadata: {},
            created_at: '2026-09-01T10:00:00Z',
          },
          {
            node_id: 'N1',
            evidence_id: 'EV-01',
            node_type: 'LAB_RESULT',
            title: 'Ballistics Match',
            artifact_hash: 'h1',
            state_id: 'STATE-2',
            creator_id: 'ANALYST-01',
            metadata: {},
            created_at: '2026-09-01T12:00:00Z',
          },
        ],
        edges: [
          {
            edge_id: 'E1',
            source_node_id: 'N0',
            target_node_id: 'N1',
            relationship_type: 'ANALYZED_BY',
            created_by: 'ANALYST-01',
            created_at: '2026-09-01T12:00:00Z',
          },
        ],
      }

      const impact = IntegrityImpactAnalyzer.analyzeImpact('STATE-0', dummyStates, graph)
      expect(impact.totalAffectedStates).toBe(2)
      expect(impact.affectedStateIds).toEqual(['STATE-1', 'STATE-2'])
      expect(impact.affectedDerivedArtifacts.length).toBe(1)
      expect(impact.blastRadiusSeverity).toBe('MODERATE')
    })
  })

  describe('FZ-LAB Synthetic Attack Laboratory', () => {
    it('should simulate synthetic tamper scenarios and pinpoint detection', () => {
      const simTamper = SyntheticAttackLaboratory.simulateAttack(
        dummyStates,
        'TAMPER_METADATA',
        1
      )
      expect(simTamper.detectionSucceeded).toBe(true)
      expect(simTamper.firstDivergentIndex).toBe(1)
      expect(simTamper.originalHistoryPreserved).toBe(true)

      const simRollback = SyntheticAttackLaboratory.simulateAttack(
        dummyStates,
        'TIMESTAMP_ROLLBACK',
        1
      )
      expect(simRollback.detectionSucceeded).toBe(true)
      expect(simRollback.firstDivergentIndex).toBe(1)
    })
  })
})
