const RCSB_BASE_URL = 'https://files.rcsb.org/download'

export async function fetchPdb(pdbId) {
  const response = await fetch(`${RCSB_BASE_URL}/${pdbId}.pdb`)
  if (!response.ok) throw new Error(`HTTP ${response.status} al cargar ${pdbId}`)
  return response.text()
}
