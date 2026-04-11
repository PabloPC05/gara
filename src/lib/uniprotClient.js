/**
 * Searches UniProt for a protein and returns its FASTA sequence.
 * Uses the free UniProt REST API — no authentication required.
 *
 * Strategy:
 *   1. Try Swiss-Prot (reviewed:true) — canonical, curated entries.
 *   2. Fall back to any entry if Swiss-Prot returns nothing.
 */
async function fetchUniprotFasta(query) {
  const url = `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(query)}&format=fasta&size=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error al consultar UniProt (${response.status}).`);
  const text = await response.text();
  const trimmed = text.trim();
  return trimmed.startsWith('>') ? trimmed : null;
}

export async function searchUniprotFasta(query) {
  // First: canonical Swiss-Prot entries (manually reviewed, most reliable)
  const canonical = await fetchUniprotFasta(`(${query}) AND (reviewed:true)`);
  if (canonical) return canonical;

  // Fallback: any UniProt entry
  const any = await fetchUniprotFasta(query);
  if (any) return any;

  throw new Error(`No se encontró ninguna proteína para "${query}" en UniProt.`);
}
