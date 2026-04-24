function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function validateProteinMetadata(data) {
  if (!isObject(data)) return null;
  return {
    identifiedProtein: data.identified_protein ?? null,
    uniprotId: data.uniprot_id ?? null,
    pdbId: data.pdb_id ?? null,
    proteinName: data.protein_name ?? "Unknown",
    organism: data.organism ?? "Unknown",
    description: data.description ?? "",
    dataSource: data.data_source ?? null,
    plddtAverage: data.plddt_average ?? null,
    modelType: data.model_type ?? null,
  };
}

function validateConfidence(data) {
  if (!isObject(data)) return null;
  return {
    plddtPerResidue: Array.isArray(data.plddt_per_residue)
      ? data.plddt_per_residue.map(Number)
      : [],
    plddtHistogram: isObject(data.plddt_histogram)
      ? {
          veryHigh: data.plddt_histogram.very_high ?? 0,
          high: data.plddt_histogram.high ?? 0,
          medium: data.plddt_histogram.medium ?? 0,
          low: data.plddt_histogram.low ?? 0,
        }
      : null,
    paeMatrix: Array.isArray(data.pae_matrix)
      ? data.pae_matrix.map((row) =>
          Array.isArray(row) ? row.map(Number) : [],
        )
      : [],
    meanPae: data.mean_pae ?? null,
    plddtMean: data.plddt_mean ?? null,
  };
}

function validateStructuralData(data) {
  if (!isObject(data)) return null;
  return {
    pdbFile: typeof data.pdb_file === "string" ? data.pdb_file : "",
    cifFile: typeof data.cif_file === "string" ? data.cif_file : "",
    confidence: validateConfidence(data.confidence),
  };
}

function validateSecondaryStructure(data) {
  if (!isObject(data)) return null;
  return {
    helixPercent: data.helix_percent ?? 0,
    strandPercent: data.strand_percent ?? 0,
    coilPercent: data.coil_percent ?? 0,
  };
}

function validateSequenceProperties(data) {
  if (!isObject(data)) return null;
  return {
    length: data.length ?? 0,
    molecularWeightKda: data.molecular_weight_kda ?? 0,
    positiveCharges: data.positive_charges ?? 0,
    negativeCharges: data.negative_charges ?? 0,
    cysteineResidues: data.cysteine_residues ?? 0,
    aromaticResidues: data.aromatic_residues ?? 0,
  };
}

function validateBiologicalData(data) {
  if (!isObject(data)) return null;
  return {
    solubilityScore: data.solubility_score ?? 0,
    solubilityPrediction: data.solubility_prediction ?? "unknown",
    instabilityIndex: data.instability_index ?? 0,
    stabilityStatus: data.stability_status ?? "unknown",
    toxicityAlerts: Array.isArray(data.toxicity_alerts)
      ? data.toxicity_alerts
      : [],
    allergenicityAlerts: Array.isArray(data.allergenicity_alerts)
      ? data.allergenicity_alerts
      : [],
    secondaryStructure: validateSecondaryStructure(
      data.secondary_structure_prediction,
    ),
    sequenceProperties: validateSequenceProperties(data.sequence_properties),
    source: data.source ?? null,
  };
}

export function validateApiResponse(raw) {
  if (!isObject(raw)) {
    return { valid: false, error: "Response is not an object", data: null };
  }

  const status = raw.status ?? "UNKNOWN";
  if (status !== "COMPLETED") {
    return {
      valid: true,
      data: {
        jobId: raw.job_id ?? null,
        status,
        proteinMetadata: null,
        structuralData: null,
        biologicalData: null,
        logs: typeof raw.logs === "string" ? raw.logs : "",
      },
    };
  }

  const data = {
    jobId: raw.job_id ?? null,
    status,
    proteinMetadata: validateProteinMetadata(raw.protein_metadata),
    structuralData: validateStructuralData(raw.structural_data),
    biologicalData: validateBiologicalData(raw.biological_data),
    logs: typeof raw.logs === "string" ? raw.logs : "",
  };

  return { valid: true, error: null, data };
}
