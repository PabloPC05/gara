const toDalton = (mw) => {
  if (mw == null) return null
  return mw < 1000 ? mw * 1000 : mw
}

export function normalizeProtein(protein) {
  if (!protein) return null

  const raw = protein._raw ?? {}
  const meta = raw.protein_metadata ?? {}
  const bioRaw = raw.biological_data ?? {}
  const seqProps = raw.sequence_properties ?? bioRaw.sequence_properties ?? {}
  const conf = raw.structural_data?.confidence ?? {}
  const bioUnified = protein.biological ?? null

  const pick = (...values) => {
    for (const v of values) if (v != null && v !== '') return v
    return null
  }

  const mwDa = toDalton(
    pick(
      protein.molecular_weight,
      bioUnified?.molecularWeight,
      seqProps.molecular_weight_kda != null ? seqProps.molecular_weight_kda * 1000 : null,
    ),
  )

  const toxicity =
    bioUnified?.toxicityAlerts ??
    bioRaw.toxicity_alerts ??
    (bioUnified?.toxicityAlert ? [bioUnified.toxicityLabel || 'Alerta'] : [])

  return {
    name: pick(protein.protein_name, protein.name, meta.protein_name),
    organism: pick(protein.organism, meta.organism),
    length: pick(protein.length, seqProps.length),
    description: pick(protein.description, meta.description),
    tags: Array.isArray(protein.tags) ? protein.tags : [],
    proteinId: pick(protein.protein_id, protein.id),
    uniprotId: pick(protein.uniprot_id, protein.uniprotId, meta.uniprot_id),
    pdbId: pick(protein.pdb_id, protein.pdbId, meta.pdb_id),
    category: pick(protein.category),
    modelType: pick(meta.model_type),
    jobId: pick(raw.job_id, protein.jobId),
    dataSource: pick(meta.data_source),
    function: pick(protein.function),
    cellularLocation: pick(protein.cellular_location),
    activity: pick(protein.activity),
    mwDa,
    isoelectricPoint: pick(protein.isoelectric_point, bioUnified?.isoelectricPoint),
    positiveCharges: pick(bioUnified?.positiveCharges, seqProps.positive_charges),
    negativeCharges: pick(bioUnified?.negativeCharges, seqProps.negative_charges),
    cysteines: pick(bioUnified?.cysteineResidues, seqProps.cysteine_residues),
    halfLife: pick(bioUnified?.halfLife),
    extinctionCoefficient: pick(bioUnified?.extinctionCoefficient),
    plddtMean: pick(protein.plddtMean, conf.plddt_mean),
    meanPae: pick(protein.meanPae, conf.mean_pae),
    paeMatrix: Array.isArray(conf.pae_matrix) ? conf.pae_matrix : [],
    solubilityScore: pick(bioUnified?.solubility, bioRaw.solubility_score),
    solubilityLabel: pick(bioUnified?.solubilityLabel, bioRaw.solubility_prediction),
    instabilityIndex: pick(bioUnified?.instabilityIndex, bioRaw.instability_index),
    instabilityLabel: pick(bioUnified?.instabilityLabel, bioRaw.stability_status),
    toxicityAlerts: Array.isArray(toxicity) ? toxicity : [],
    allergenicityAlerts: Array.isArray(bioRaw.allergenicity_alerts) ? bioRaw.allergenicity_alerts : [],
    knownStructures: Array.isArray(protein.known_structures) ? protein.known_structures : [],
    sequence: pick(protein.sequence),
    fastaReady: pick(protein.fasta_ready),
    pdbFile: raw.structural_data?.pdb_file ?? protein.pdbData ?? null,
    logs: raw.logs ?? protein.logs ?? '',
  }
}
