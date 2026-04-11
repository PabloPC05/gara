/**
 * Forma unificada que consumen el visor 3D, el drawer de detalles, el
 * sidebar y la vista de comparación. Tanto los datos mock como los de la
 * API real se normalizan a esta estructura antes de entrar al store.
 *
 * @typedef {Object} BiologicalInfo
 * @property {number} solubility
 * @property {string} solubilityLabel
 * @property {number} instabilityIndex
 * @property {string} instabilityLabel
 * @property {boolean} toxicityAlert
 * @property {string} toxicityLabel
 * @property {number} molecularWeight  En Daltons.
 * @property {number} isoelectricPoint
 * @property {string} halfLife
 * @property {number} extinctionCoefficient
 *
 * @typedef {Object} UnifiedProtein
 * @property {string} id            Identificador estable en el store.
 * @property {string} name
 * @property {string|null} uniprotId
 * @property {string|null} pdbId
 * @property {number} length
 * @property {string} organism
 * @property {number|null} plddtMean
 * @property {number|null} meanPae
 * @property {BiologicalInfo|null} biological
 * @property {string|null} pdbData  PDB en texto, listo para `addModel`.
 * @property {'mock'|'api'} source
 * @property {Object}  _raw  Forma API-style para el drawer de detalles.
 */

const solubilityLabelFromPrediction = (prediction) => {
  switch (prediction) {
    case 'very_soluble':
      return 'Muy soluble'
    case 'soluble':
      return 'Soluble'
    case 'insoluble':
      return 'Insoluble'
    default:
      return 'Desconocida'
  }
}

const instabilityLabelFromIndex = (index) => (index < 40 ? 'Estable' : 'Inestable')

function buildRawFromMock(mock, pdbData) {
  const bio = mock.biological
  return {
    protein_metadata: {
      protein_name: mock.name,
      organism: mock.organism,
      uniprot_id: mock.uniprotId ?? null,
      pdb_id: mock.pdbId ?? null,
      data_source: 'Simulación sintética',
    },
    structural_data: {
      confidence: {
        plddt_mean: mock.plddtMean ?? null,
        mean_pae: mock.meanPae ?? null,
      },
      pdb_file: pdbData ?? '',
    },
    biological_data: bio
      ? {
          solubility_score: bio.solubility ?? 0,
          solubility_prediction: bio.solubilityLabel ?? 'Desconocida',
          instability_index: bio.instabilityIndex ?? 0,
          stability_status: bio.instabilityLabel ?? 'Desconocida',
          toxicity_alerts: bio.toxicityAlerts ?? (bio.toxicityAlert ? [bio.toxicityLabel] : []),
          allergenicity_alerts: bio.allergenicityAlerts ?? [],
        }
      : null,
    sequence_properties: {
      length: mock.length ?? 0,
      molecular_weight_kda: bio?.molecularWeightKda ?? (bio?.molecularWeight ? bio.molecularWeight / 1000 : 0),
      positive_charges: bio?.positiveCharges ?? 0,
      negative_charges: bio?.negativeCharges ?? 0,
      cysteine_residues: bio?.cysteineResidues ?? 0,
    },
    logs: '',
  }
}

function buildRawFromApi(validated) {
  const meta = validated.proteinMetadata
  const structural = validated.structuralData
  const biological = validated.biologicalData
  const seqProps = biological?.sequenceProperties

  return {
    protein_metadata: meta
      ? {
          protein_name: meta.proteinName,
          organism: meta.organism,
          uniprot_id: meta.uniprotId,
          pdb_id: meta.pdbId,
          data_source: meta.dataSource ?? 'AlphaFold DB',
        }
      : null,
    structural_data: structural
      ? {
          confidence: structural.confidence
            ? {
                plddt_mean: structural.confidence.plddtMean,
                mean_pae: structural.confidence.meanPae,
              }
            : null,
          pdb_file: structural.pdbFile ?? '',
        }
      : null,
    biological_data: biological
      ? {
          solubility_score: biological.solubilityScore ?? 0,
          solubility_prediction: biological.solubilityPrediction ?? 'unknown',
          instability_index: biological.instabilityIndex ?? 0,
          stability_status: biological.stabilityStatus ?? 'unknown',
          toxicity_alerts: biological.toxicityAlerts ?? [],
          allergenicity_alerts: biological.allergenicityAlerts ?? [],
        }
      : null,
    sequence_properties: seqProps
      ? {
          length: seqProps.length ?? 0,
          molecular_weight_kda: seqProps.molecularWeightKda ?? 0,
          positive_charges: seqProps.positiveCharges ?? 0,
          negative_charges: seqProps.negativeCharges ?? 0,
          cysteine_residues: seqProps.cysteineResidues ?? 0,
        }
      : null,
    logs: validated.logs ?? '',
  }
}

export function mockToUnified(id, mock, pdbData = null) {
  return {
    id,
    name: mock.name,
    uniprotId: mock.uniprotId ?? null,
    pdbId: mock.pdbId ?? null,
    length: mock.length ?? 0,
    organism: mock.organism ?? 'Unknown',
    plddtMean: mock.plddtMean ?? null,
    meanPae: mock.meanPae ?? null,
    biological: mock.biological ?? null,
    pdbData,
    source: 'mock',
    _raw: buildRawFromMock(mock, pdbData),
  }
}

export function apiToUnified(validated) {
  if (!validated || validated.status !== 'COMPLETED') return null
  const meta = validated.proteinMetadata
  const structural = validated.structuralData
  const biological = validated.biologicalData
  if (!meta || !structural) return null

  const seqProps = biological?.sequenceProperties
  const length = seqProps?.length ?? 0
  const molecularWeightKda = seqProps?.molecularWeightKda ?? 0
  const plddtMean = meta.plddtAverage ?? structural.confidence?.plddtMean ?? null
  const meanPae = structural.confidence?.meanPae ?? null
  const toxicityAlertsCount = biological?.toxicityAlerts?.length ?? 0

  return {
    id:
      validated.jobId ||
      meta.uniprotId ||
      meta.pdbId ||
      `job-${Date.now()}`,
    name: meta.proteinName ?? 'Unknown',
    uniprotId: meta.uniprotId ?? null,
    pdbId: meta.pdbId ?? null,
    length,
    organism: meta.organism ?? 'Unknown',
    plddtMean,
    meanPae,
    biological: biological
      ? {
          solubility: biological.solubilityScore ?? 0,
          solubilityLabel: solubilityLabelFromPrediction(biological.solubilityPrediction),
          instabilityIndex: biological.instabilityIndex ?? 0,
          instabilityLabel:
            biological.stabilityStatus && biological.stabilityStatus !== 'unknown'
              ? biological.stabilityStatus
              : instabilityLabelFromIndex(biological.instabilityIndex ?? 0),
          toxicityAlert: toxicityAlertsCount > 0,
          toxicityLabel: toxicityAlertsCount > 0 ? 'Alerta' : 'No tóxica',
          molecularWeight: molecularWeightKda * 1000,
          isoelectricPoint: 0,
          halfLife: '—',
          extinctionCoefficient: 0,
        }
      : null,
    pdbData: structural.pdbFile || null,
    cifData: structural.cifFile || null,
    source: 'api',
    _raw: buildRawFromApi(validated),
  }
}
