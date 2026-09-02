/**
 * FORENZA — Integrity Impact Analyzer (FZ-IMPACT)
 *
 * Calculates the downstream blast radius and affected dependencies
 * if an evidence state, media hash, or custody event is compromised or altered.
 */

import { EvidenceStateNode } from '../state/evidence-state-engine'
import { ProvenanceGraph, ProvenanceEngine } from '../provenance/provenance-engine'

export interface IntegrityImpactReport {
  compromisedStateId: string
  totalAffectedStates: number
  affectedStateIds: string[]
  affectedCustodyCount: number
  affectedDerivedArtifacts: Array<{
    node_id: string
    title: string
    node_type: string
  }>
  blastRadiusSeverity: 'ISOLATED' | 'MODERATE' | 'EXTENSIVE' | 'CATASTROPHIC'
  summary: string
}

export class IntegrityImpactAnalyzer {
  /**
   * Analyze downstream impact on state chain and provenance graph
   */
  static analyzeImpact(
    compromisedStateId: string,
    allStates: EvidenceStateNode[],
    provenanceGraph?: ProvenanceGraph
  ): IntegrityImpactReport {
    // 1. Find all states positioned after the compromised state in the tree
    const stateIndex = allStates.findIndex((s) => s.state_id === compromisedStateId)
    const affectedStates = stateIndex >= 0 ? allStates.slice(stateIndex + 1) : []
    const affectedStateIds = affectedStates.map((s) => s.state_id)

    // 2. Count affected custody operations
    const affectedCustodyCount = affectedStates.filter(
      (s) =>
        s.event_type.includes('CUSTODY') ||
        s.event_type.includes('TRANSFER') ||
        s.event_type.includes('VAULT')
    ).length

    // 3. Find affected derived artifacts in provenance graph
    let affectedDerivedArtifacts: IntegrityImpactReport['affectedDerivedArtifacts'] = []
    if (provenanceGraph) {
      const matchingNode = provenanceGraph.nodes.find(
        (n) => n.state_id === compromisedStateId
      )
      if (matchingNode) {
        const downstreamNodes = ProvenanceEngine.getDownstreamArtifacts(
          provenanceGraph,
          matchingNode.node_id
        )
        affectedDerivedArtifacts = downstreamNodes.map((n) => ({
          node_id: n.node_id,
          title: n.title,
          node_type: n.node_type,
        }))
      }
    }

    // 4. Calculate severity
    let blastRadiusSeverity: IntegrityImpactReport['blastRadiusSeverity'] = 'ISOLATED'
    if (affectedStates.length > 5 || affectedDerivedArtifacts.length > 3) {
      blastRadiusSeverity = 'CATASTROPHIC'
    } else if (affectedStates.length > 2 || affectedDerivedArtifacts.length > 1) {
      blastRadiusSeverity = 'EXTENSIVE'
    } else if (affectedStates.length > 0) {
      blastRadiusSeverity = 'MODERATE'
    }

    return {
      compromisedStateId,
      totalAffectedStates: affectedStates.length,
      affectedStateIds,
      affectedCustodyCount,
      affectedDerivedArtifacts,
      blastRadiusSeverity,
      summary: `Compromise of state ${compromisedStateId} invalidates ${affectedStates.length} downstream states and ${affectedDerivedArtifacts.length} derivative artifacts.`,
    }
  }
}
