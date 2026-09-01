/**
 * FORENZA — Provenance Graph Engine (FZ-PROV)
 *
 * Models and manages the directed acyclic graph (DAG) of evidence artifacts:
 * Original Evidence -> Physical Samples -> Lab Analysis -> Derivative Exhibits.
 */

export type ProvenanceNodeType =
  | 'ORIGINAL_EVIDENCE'
  | 'PHOTOGRAPH'
  | 'VIDEO'
  | 'SAMPLE'
  | 'LAB_RESULT'
  | 'ANALYSIS_REPORT'
  | 'COURT_EXHIBIT'

export type ProvenanceRelationType =
  | 'DERIVED_FROM'
  | 'EXTRACTED_FROM'
  | 'ANALYZED_BY'
  | 'CONTAINED_IN'
  | 'EXHIBITED_AS'

export interface ProvenanceNode {
  node_id: string
  evidence_id: string
  node_type: ProvenanceNodeType
  title: string
  artifact_hash: string
  state_id?: string
  creator_id: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface ProvenanceEdge {
  edge_id: string
  source_node_id: string
  target_node_id: string
  relationship_type: ProvenanceRelationType
  created_by: string
  created_at: string
}

export interface ProvenanceGraph {
  nodes: ProvenanceNode[]
  edges: ProvenanceEdge[]
}

export class ProvenanceEngine {
  /**
   * Traverse graph to find all downstream artifacts derived from a specific node
   */
  static getDownstreamArtifacts(
    graph: ProvenanceGraph,
    sourceNodeId: string
  ): ProvenanceNode[] {
    const visited = new Set<string>()
    const result: ProvenanceNode[] = []
    const queue: string[] = [sourceNodeId]

    const nodeMap = new Map<string, ProvenanceNode>(
      graph.nodes.map((n) => [n.node_id, n])
    )

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (visited.has(currentId)) continue
      visited.add(currentId)

      // Find edges where current is the source (target is derived from source)
      const outgoing = graph.edges.filter((e) => e.source_node_id === currentId)
      for (const edge of outgoing) {
        const targetNode = nodeMap.get(edge.target_node_id)
        if (targetNode && !visited.has(targetNode.node_id)) {
          result.push(targetNode)
          queue.push(targetNode.node_id)
        }
      }
    }

    return result
  }

  /**
   * Traverse graph backwards to trace the complete lineage ancestry of an artifact
   */
  static getUpstreamAncestry(
    graph: ProvenanceGraph,
    targetNodeId: string
  ): ProvenanceNode[] {
    const visited = new Set<string>()
    const result: ProvenanceNode[] = []
    const queue: string[] = [targetNodeId]

    const nodeMap = new Map<string, ProvenanceNode>(
      graph.nodes.map((n) => [n.node_id, n])
    )

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (visited.has(currentId)) continue
      visited.add(currentId)

      // Find edges pointing into current target
      const incoming = graph.edges.filter((e) => e.target_node_id === currentId)
      for (const edge of incoming) {
        const sourceNode = nodeMap.get(edge.source_node_id)
        if (sourceNode && !visited.has(sourceNode.node_id)) {
          result.push(sourceNode)
          queue.push(sourceNode.node_id)
        }
      }
    }

    return result
  }
}
