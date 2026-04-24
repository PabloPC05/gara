import { looksLikeCif } from "@/components/molecular/utils/structurePipeline";
import { extractSequenceFromPdb } from "./sequenceUtils";

function extractTitleFromPdb(text) {
	for (const line of text.split("\n")) {
		if (line.startsWith("TITLE ")) {
			return line.substring(10).trim().replace(/;\s*$/, "");
		}
	}
	return null;
}

function extractOrganismFromPdb(text) {
	for (const line of text.split("\n")) {
		if (line.startsWith("SOURCE") && line.includes("ORGANISM_SCIENTIFIC")) {
			const match = line.match(/ORGANISM_SCIENTIFIC:\s*([^;]+)/);
			if (match) return match[1].trim();
		}
	}
	return null;
}

function extractTitleFromCif(text) {
	const match = text.match(/_struct\.title\s+(.+)/);
	return match ? match[1].trim().replace(/^['"]|['"]$/g, "") : null;
}

function extractOrganismFromCif(text) {
	const match = text.match(
		/_entity_src_gen\.pdbx_organism_scientific_name\s+(.+)/,
	);
	if (match) return match[1].trim().replace(/^['"]|['"]$/g, "");
	const match2 = text.match(
		/_entity_src_nat\.pdbx_organism_scientific_name\s+(.+)/,
	);
	return match2 ? match2[1].trim().replace(/^['"]|['"]$/g, "") : null;
}

function countResiduesFromPdb(text) {
	let count = 0;
	let lastResSeq = null;
	for (const line of text.split("\n")) {
		if (line.length < 27) continue;
		const rec = line.substring(0, 6);
		if (rec !== "ATOM  ") continue;
		const atomName = line.substring(12, 16).trim();
		if (atomName !== "CA") continue;
		const resSeq = line.substring(22, 26).trim();
		if (resSeq !== lastResSeq) {
			count++;
			lastResSeq = resSeq;
		}
	}
	return count;
}

/**
 * Parsea un archivo de estructura local (.pdb o .cif) y genera un objeto UnifiedProtein.
 * @param {string} text - Contenido del archivo.
 * @param {string} fileName - Nombre del archivo original.
 * @param {'pdb'|'cif'|'mmcif'|null} [formatHint] - Formato sugerido.
 * @returns {import('./proteinAdapter').UnifiedProtein}
 */
export function parseStructureFile(text, fileName, formatHint = null) {
	const isCif = looksLikeCif(text);
	const format = formatHint || (isCif ? "cif" : "pdb");

	const name = isCif
		? extractTitleFromCif(text) || fileName.replace(/\.(pdb|cif|mmcif)$/i, "")
		: extractTitleFromPdb(text) || fileName.replace(/\.(pdb|cif|mmcif)$/i, "");

	const organism = isCif
		? extractOrganismFromCif(text)
		: extractOrganismFromPdb(text);
	const sequence = extractSequenceFromPdb(text);
	const length = isCif ? (sequence?.length ?? 0) : countResiduesFromPdb(text);

	const id = `local-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

	const fasta = sequence
		? `>${name}\n${sequence.replace(/(.{60})/g, "$1\n")}\n`
		: null;

	return {
		id,
		name,
		uniprotId: null,
		pdbId: null,
		length,
		organism: organism || "Unknown",
		plddtMean: null,
		meanPae: null,
		paeMatrix: [],
		biological: null,
		structureData: text,
		structureFormat: isCif ? "cif" : "pdb",
		pdbData: isCif ? text : text,
		cifData: isCif ? text : null,
		source: "local",
		fasta,
		sequence: sequence || null,
		_raw: {
			protein_metadata: {
				protein_name: name,
				organism: organism || "Unknown",
				uniprot_id: null,
				pdb_id: null,
				data_source: "Archivo local",
			},
			structural_data: {
				confidence: { plddt_mean: null, mean_pae: null, pae_matrix: [] },
				pdb_file: text,
			},
			biological_data: null,
			sequence_properties: { length, molecular_weight_kda: 0 },
			logs: "",
		},
	};
}

/**
 * Lee un archivo local como texto.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readTextFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => resolve(e.target.result);
		reader.onerror = () => reject(new Error("Error leyendo archivo"));
		reader.readAsText(file);
	});
}
