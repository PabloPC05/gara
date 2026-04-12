const RCSB_API = 'https://data.rcsb.org/rest/v1/core'
const RCSB_DOWNLOAD = 'https://files.rcsb.org/download'
const cache = new Map()

/**
 * Descarga la estructura (PDB o mmCIF) desde RCSB PDB.
 * @param {string} pdbId - PDB ID de 4 caracteres (ej: "1CRN").
 * @param {'pdb'|'cif'} [format='pdb']
 * @returns {Promise<{text: string, format: 'pdb'|'mmcif'}>}
 */
export async function fetchStructureById(pdbId, format = 'pdb') {
  const id = pdbId.toUpperCase().trim()
  if (!/^\d[A-Z0-9]{3}$/.test(id)) throw new Error(`PDB ID inválido: "${pdbId}". Debe tener 4 caracteres alfanuméricos.`)

  const cacheKey = `struct_${id}_${format}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  const ext = format === 'cif' ? 'cif' : 'pdb'
  const url = `${RCSB_DOWNLOAD}/${id}.${ext}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo descargar ${id}.${ext}: ${res.status} ${res.statusText}`)

  const text = await res.text()
  const result = { text, format: format === 'cif' ? 'mmcif' : 'pdb' }
  cache.set(cacheKey, result)
  return result
}

/**
 * Obtiene metadatos de una estructura desde la API REST de RCSB.
 * @param {string} pdbId
 * @returns {Promise<{title: string, organism: string|null, method: string|null, resolution: number|null, length: number|null}>}
 */
export async function fetchMetadataById(pdbId) {
  const id = pdbId.toUpperCase().trim()
  if (!/^\d[A-Z0-9]{3}$/.test(id)) throw new Error(`PDB ID inválido: "${pdbId}"`)

  const cacheKey = `meta_${id}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  const [entryRes, polymerRes] = await Promise.all([
    fetch(`${RCSB_API}/entry/${id}`).then((r) => r.json()).catch(() => null),
    fetch(`${RCSB_API}/polymer_entity/${id}/1`).then((r) => r.json()).catch(() => null),
  ])

  const result = {
    title: entryRes?.struct?.title ?? id,
    organism: polymerRes?.rcsb_entity_source_organism?.[0]?.scientific_name ?? null,
    method: entryRes?.exptl?.[0]?.method ?? null,
    resolution: entryRes?.rcsb_entry_info?.resolution_combined?.[0] ?? null,
    length: polymerRes?.rcsb_polymer_entity?.pdbx_number_of_monomers_in_structure ?? null,
  }

  cache.set(cacheKey, result)
  return result
}

/**
 * Busca estructuras en RCSB PDB por texto.
 * @param {string} query
 * @param {number} [limit=10]
 * @returns {Promise<Array<{id: string, title: string, method: string|null, resolution: number|null}>>}
 */
export async function searchRcsb(query, limit = 10) {
  if (!query || query.trim().length < 2) return []

  const body = {
    query: {
      type: 'terminal',
      service: 'full_text',
      parameters: { value: query.trim() },
    },
    return_type: 'entry',
    request_options: {
      pager: { start: 0, rows: limit },
      return_all_hits: false,
    },
  }

  const res = await fetch('https://search.rcsb.org/rcsbsearch/v2/query?json=' + encodeURIComponent(JSON.stringify(body)))
  if (!res.ok) return []

  const data = await res.json()
  return (data?.result_set ?? []).map((r) => ({
    id: r.identifier,
    title: r.title ?? r.identifier,
    method: null,
    resolution: null,
  }))
}
