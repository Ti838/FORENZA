/**
 * FORENZA — Laboratory Sample Lineage & Depletion Control (FZ-LINEAGE)
 *
 * Tracks recursive scientific sample genealogy, aliquot splitting, and
 * non-revertible chemical/physical consumption constraints.
 */

export interface SampleNode {
  id: string
  evidence_id: string
  parent_sample_id: string | null
  sample_code: string
  unit_of_measure: string
  original_quantity: number
  allocated_quantity: number
  consumed_quantity: number
  remaining_quantity: number
  preparation_method?: string
  custodian_id: string
  created_at: string
}

export class SampleLineageService {
  /**
   * Register an initial primary scientific sample from evidence
   */
  static createPrimarySample(
    evidenceId: string,
    sampleCode: string,
    quantity: number,
    unit: string,
    custodianId: string,
    preparationMethod?: string
  ): SampleNode {
    if (quantity <= 0) {
      throw new Error('Initial sample quantity must be strictly greater than 0.')
    }

    return {
      id: crypto.randomUUID(),
      evidence_id: evidenceId,
      parent_sample_id: null,
      sample_code: sampleCode,
      unit_of_measure: unit,
      original_quantity: quantity,
      allocated_quantity: 0,
      consumed_quantity: 0,
      remaining_quantity: quantity,
      preparation_method: preparationMethod,
      custodian_id: custodianId,
      created_at: new Date().toISOString(),
    }
  }

  /**
   * Subdivide parent sample into a child aliquot
   */
  static createChildAliquot(
    parentSample: SampleNode,
    childSampleCode: string,
    aliquotQuantity: number,
    custodianId: string,
    preparationMethod?: string
  ): { updatedParent: SampleNode; childSample: SampleNode } {
    if (aliquotQuantity <= 0) {
      throw new Error('Aliquot quantity must be greater than 0.')
    }

    if (aliquotQuantity > parentSample.remaining_quantity) {
      throw new Error(
        `Cannot allocate ${aliquotQuantity} ${parentSample.unit_of_measure}. Only ${parentSample.remaining_quantity} remaining in parent sample.`
      )
    }

    const updatedParent: SampleNode = {
      ...parentSample,
      allocated_quantity: parentSample.allocated_quantity + aliquotQuantity,
      consumed_quantity: parentSample.consumed_quantity + aliquotQuantity,
      remaining_quantity: parentSample.remaining_quantity - aliquotQuantity,
    }

    const childSample: SampleNode = {
      id: crypto.randomUUID(),
      evidence_id: parentSample.evidence_id,
      parent_sample_id: parentSample.id,
      sample_code: childSampleCode,
      unit_of_measure: parentSample.unit_of_measure,
      original_quantity: aliquotQuantity,
      allocated_quantity: 0,
      consumed_quantity: 0,
      remaining_quantity: aliquotQuantity,
      preparation_method: preparationMethod,
      custodian_id: custodianId,
      created_at: new Date().toISOString(),
    }

    return { updatedParent, childSample }
  }

  /**
   * Consume portion of sample for destructive chemical analysis (e.g. Mass Spectrometry)
   */
  static consumeSample(
    sample: SampleNode,
    amountToConsume: number,
    reason: string
  ): SampleNode {
    if (amountToConsume <= 0) {
      throw new Error('Consumption amount must be greater than 0.')
    }

    if (amountToConsume > sample.remaining_quantity) {
      throw new Error(
        `Over-consumption violation: requested ${amountToConsume} ${sample.unit_of_measure}, but only ${sample.remaining_quantity} is available.`
      )
    }

    return {
      ...sample,
      consumed_quantity: sample.consumed_quantity + amountToConsume,
      remaining_quantity: sample.remaining_quantity - amountToConsume,
    }
  }
}
