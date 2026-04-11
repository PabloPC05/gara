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
 * @property {string|null} structureData  Estructura en texto (PDB o mmCIF).
 * @property {'pdb'|'cif'|null} structureFormat  Formato real de structureData.
 * @property {string|null} pdbData  Alias legacy de structureData (pdb plano).
 * @property {string|null} cifData  Alias legacy para mmCIF (API v1).
 * @property {'mock'|'api'} source
 * @property {Object} _raw  Forma API-style para el drawer de detalles.
 */

// ─── Detección de formato de estructura ──────────────────────────────────────

/**
 * La API puede devolver mmCIF tanto en `pdb_file` como en `cif_file`.
 * Por eso no nos fiamos del nombre del campo: inspeccionamos el contenido
 * real y elegimos el primer payload que podamos clasificar.
 */
function detectStructureFormat(data) {
  if (!data || typeof data !== 'string') return null

  // Señales fuertes de CIF/mmCIF
  if (
    /^\s*data_/m.test(data) ||
    /^\s*loop_\s*$/m.test(data) ||
    /^\s*_(entry|audit_conform|atom_site|struct)\./m.test(data)
  ) {
    return 'cif'
  }

  // Señales de PDB clásico
  if (
    /^(HEADER|TITLE |COMPND|SOURCE|EXPDTA|AUTHOR|REMARK|SEQRES|ATOM  |HETATM|MODEL |TER   |ENDMDL|END)/m.test(data)
  ) {
    return 'pdb'
  }

  return null
}

/**
 * Devuelve la estructura prioritaria junto con su formato real.
 * Orden de preferencia: pdb_file → cif_file.
 */
function pickStructurePayload(structural) {
  const candidates = [structural?.pdbFile, structural?.cifFile]
  for (const data of candidates) {
    const format = detectStructureFormat(data)
    if (format) return { data, format }
  }
  return null
}

// ─── Labels biológicos ───────────────────────────────────────────────────────

const solubilityLabelFromPrediction = (prediction) => {
  switch (prediction) {
    case 'very_soluble': return 'Muy soluble'
    case 'soluble':      return 'Soluble'
    case 'insoluble':    return 'Insoluble'
    default:             return 'Desconocida'
  }
}

const instabilityLabelFromIndex = (index) => (index < 40 ? 'Estable' : 'Inestable')

// ─── _raw builders ───────────────────────────────────────────────────────────

function buildRawFromMock(mock, pdbData) {
  const bio = mock.biological
  const n = mock.length || 40
  // Generar una matriz PAE de ejemplo para que el heatmap no salga vacío
  const dummyPae = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const dist = Math.abs(i - j)
      return Math.min(31.75, dist * 0.5 + Math.random() * 2)
    })
  )

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
        pae_matrix: dummyPae,
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
  const meta       = validated.proteinMetadata
  const structural = validated.structuralData
  const biological = validated.biologicalData
  const seqProps   = biological?.sequenceProperties

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
                pae_matrix: structural.confidence.paeMatrix ?? [],
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

// ─── Conversores públicos ─────────────────────────────────────────────────────

/**
 * Convierte una entrada del catálogo mock al formato unificado.
 * @param {string} id
 * @param {Object} mock
 * @param {string|null} [pdbData]
 * @returns {UnifiedProtein}
 */
export function mockToUnified(id, mock, pdbData = null) {
  const raw = buildRawFromMock(mock, pdbData)
  return {
    id,
    name: mock.name,
    uniprotId: mock.uniprotId ?? null,
    pdbId: mock.pdbId ?? null,
    length: mock.length ?? 0,
    organism: mock.organism ?? 'Unknown',
    plddtMean: mock.plddtMean ?? null,
    meanPae: mock.meanPae ?? null,
    paeMatrix: raw.structural_data.confidence.pae_matrix,
    biological: mock.biological ?? null,
    structureData: pdbData,
    structureFormat: pdbData ? 'pdb' : null,
    pdbData,
    cifData: null,
    source: 'mock',
    _raw: raw,
  }
}

/**
 * Convierte una respuesta validada de la API (`validateApiResponse`) al
 * formato unificado. Devuelve null si el job no está `COMPLETED` o si
 * faltan datos esenciales.
 *
 * @param {Object} validated
 * @returns {UnifiedProtein|null}
 */
export function apiToUnified(validated) {
  if (!validated || validated.status !== 'COMPLETED') return null

  const structural = validated.structuralData
  if (!structural) return null

  // La API mock puede devolver protein_metadata: null para secuencias fuera
  // del catálogo. Se usa un fallback para que lleguen al visor 3D igualmente.
  const meta = validated.proteinMetadata ?? {
    proteinName: 'Unknown Protein',
    uniprotId: null,
    pdbId: null,
    organism: 'Unknown',
    plddtAverage: null,
  }

  const biological = validated.biologicalData
  const seqProps   = biological?.sequenceProperties
  const length     = seqProps?.length ?? 0
  const molecularWeightKda = seqProps?.molecularWeightKda ?? 0
  const plddtMean  = meta.plddtAverage ?? structural.confidence?.plddtMean ?? null
  const meanPae    = structural.confidence?.meanPae ?? null
  const paeMatrix  = structural.confidence?.paeMatrix ?? []
  const toxicityAlertsCount = biological?.toxicityAlerts?.length ?? 0

  const structure = pickStructurePayload(structural)
  if (!structure) return null

  return {
    id: validated.jobId || meta.uniprotId || meta.pdbId || `job-${Date.now()}`,
    name: meta.proteinName ?? 'Unknown',
    uniprotId: meta.uniprotId ?? null,
    pdbId: meta.pdbId ?? null,
    length,
    organism: meta.organism ?? 'Unknown',
    plddtMean,
    meanPae,
    paeMatrix,
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
    structureData: structure.data,
    structureFormat: structure.format,
    pdbData: structure.data,
    // Guardamos en `cifData` únicamente el payload que ya fue validado
    // como CIF para evitar priorizar strings no parseables del campo legacy.
    cifData: structure.format === 'cif' ? structure.data : null,
    source: 'api',
    _raw: buildRawFromApi(validated),
  }
}
