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
 * @property {BiologicalInfo|null} biological
 * @property {string|null} pdbData  PDB en texto, listo para `addModel`.
 * @property {'mock'|'api'} source
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

/**
 * Convierte una entrada del catálogo mock al formato unificado.
 * @param {string} id
 * @param {Object} mock
 * @param {string|null} [pdbData]
 * @returns {UnifiedProtein}
 */
export function mockToUnified(id, mock, pdbData = null) {
  return {
    id,
    name: mock.name,
    uniprotId: mock.uniprotId ?? null,
    pdbId: mock.pdbId ?? null,
    length: mock.length ?? 0,
    organism: mock.organism ?? 'Unknown',
    plddtMean: mock.plddtMean ?? null,
    biological: mock.biological ?? null,
    pdbData,
    source: 'mock',
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
  const meta = validated.proteinMetadata
  const structural = validated.structuralData
  const biological = validated.biologicalData
  if (!meta || !structural) return null

  const seqProps = biological?.sequenceProperties
  const length = seqProps?.length ?? 0
  const molecularWeightKda = seqProps?.molecularWeightKda ?? 0
  const plddtMean = meta.plddtAverage ?? structural.confidence?.plddtMean ?? null

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
    source: 'api',
  }
}
