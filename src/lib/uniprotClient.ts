const UNIPROT_SEARCH_URL = "https://rest.uniprot.org/uniprotkb/search";

async function fetchUniprotFasta(query: string): Promise<string | null> {
	const url = `${UNIPROT_SEARCH_URL}?query=${encodeURIComponent(query)}&format=fasta&size=1`;
	const response = await fetch(url);
	if (!response.ok)
		throw new Error(`Error al consultar UniProt (${response.status}).`);
	const text = await response.text();
	const trimmed = text.trim();
	return trimmed.startsWith(">") ? trimmed : null;
}

export async function searchUniprotFasta(query: string): Promise<string> {
	const canonical = await fetchUniprotFasta(`(${query}) AND (reviewed:true)`);
	if (canonical) return canonical;

	const any = await fetchUniprotFasta(query);
	if (any) return any;

	throw new Error(
		`No se encontró ninguna proteína para "${query}" en UniProt.`,
	);
}
