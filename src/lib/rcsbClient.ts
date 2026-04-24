const RCSB_API = "https://data.rcsb.org/rest/v1/core";
const RCSB_DOWNLOAD = "https://files.rcsb.org/download";
const MAX_CACHE_SIZE = 50;

const cache = new Map<string, unknown>();

function cachedGet<T>(key: string): T | undefined {
	return cache.get(key) as T | undefined;
}

function cachedSet<T>(key: string, value: T): void {
	if (cache.size >= MAX_CACHE_SIZE) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
	cache.set(key, value);
}

export interface StructureResult {
	text: string;
	format: "pdb" | "mmcif";
}

export interface RcsbMetadata {
	title: string;
	organism: string | null;
	method: string | null;
	resolution: number | null;
	length: number | null;
}

export async function fetchStructureById(
	pdbId: string,
	format: "pdb" | "cif" = "pdb",
): Promise<StructureResult> {
	const id = pdbId.toUpperCase().trim();
	if (!/^\d[A-Z0-9]{3}$/.test(id))
		throw new Error(
			`PDB ID inválido: "${pdbId}". Debe tener 4 caracteres alfanuméricos.`,
		);

	const cacheKey = `struct_${id}_${format}`;
	const cached = cachedGet<StructureResult>(cacheKey);
	if (cached) return cached;

	const ext = format === "cif" ? "cif" : "pdb";
	const url = `${RCSB_DOWNLOAD}/${id}.${ext}`;

	const res = await fetch(url);
	if (!res.ok)
		throw new Error(
			`No se pudo descargar ${id}.${ext}: ${res.status} ${res.statusText}`,
		);

	const text = await res.text();
	const result: StructureResult = {
		text,
		format: format === "cif" ? "mmcif" : "pdb",
	};
	cachedSet(cacheKey, result);
	return result;
}

export async function fetchMetadataById(pdbId: string): Promise<RcsbMetadata> {
	const id = pdbId.toUpperCase().trim();
	if (!/^\d[A-Z0-9]{3}$/.test(id))
		throw new Error(`PDB ID inválido: "${pdbId}"`);

	const cacheKey = `meta_${id}`;
	const cached = cachedGet<RcsbMetadata>(cacheKey);
	if (cached) return cached;

	const [entryRes, polymerRes] = await Promise.all([
		fetch(`${RCSB_API}/entry/${id}`)
			.then((r) => r.json())
			.catch(() => null),
		fetch(`${RCSB_API}/polymer_entity/${id}/1`)
			.then((r) => r.json())
			.catch(() => null),
	]);

	const result: RcsbMetadata = {
		title:
			(entryRes as Record<string, unknown> | null)?.struct &&
			typeof (entryRes as Record<string, Record<string, string>>).struct
				?.title === "string"
				? (entryRes as Record<string, Record<string, string>>).struct.title
				: id,
		organism:
			(
				(polymerRes as Record<string, unknown> | null)
					?.rcsb_entity_source_organism as
					| Array<Record<string, string>>
					| undefined
			)?.[0]?.scientific_name ?? null,
		method:
			(
				(entryRes as Record<string, unknown> | null)?.exptl as
					| Array<Record<string, string>>
					| undefined
			)?.[0]?.method ?? null,
		resolution:
			(
				(entryRes as Record<string, Record<string, number[]>> | null)
					?.rcsb_entry_info?.resolution_combined as number[] | undefined
			)?.[0] ?? null,
		length:
			(
				(polymerRes as Record<string, Record<string, number>> | null)
					?.rcsb_polymer_entity as Record<string, number> | undefined
			)?.pdbx_number_of_monomers_in_structure ?? null,
	};

	cachedSet(cacheKey, result);
	return result;
}
