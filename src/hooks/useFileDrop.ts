import { useCallback } from "react";

import { useProteinStore } from "@/stores/useProteinStore";
import { parseStructureFile, readTextFile } from "@/lib/importStructure";
import type { RawProtein } from "@/components/protein-details/utils/proteinTypes";

const FASTA_EXTENSIONS = [".fasta", ".fas", ".fa", ".seq", ".txt"];

function isFastaFile(name: string): boolean {
	const lower = name.toLowerCase();
	return FASTA_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function generateId(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function parseFastaText(text: string, fileName: string) {
	const trimmed = text.trim();
	if (!trimmed.startsWith(">")) return null;

	const lines = trimmed.split("\n");
	const header = lines[0].replace(/^>\s*/, "").trim();
	const sequence = lines.slice(1).join("").replace(/\s/g, "");
	const id = generateId("fasta");

	return {
		id,
		name: header || fileName,
		sequence,
		fasta: trimmed,
		source: "local" as const,
		organism: "Unknown",
		length: sequence.length,
		structureData: null,
		structureFormat: null,
		pdbData: null,
		cifData: null,
		uniprotId: null,
		pdbId: null,
		plddtMean: null,
		meanPae: null,
		paeMatrix: [] as number[][],
		biological: null,
		_raw: {
			protein_metadata: {
				protein_name: header || fileName,
				organism: "Unknown",
				data_source: "Archivo local",
			} as RawProtein["_raw"]["protein_metadata"],
			structural_data: {
				confidence: {},
				pdb_file: "",
			} as RawProtein["_raw"]["structural_data"],
			biological_data: null,
			sequence_properties: {
				length: sequence.length,
			} as RawProtein["_raw"]["sequence_properties"],
			logs: "",
		},
	};
}

interface SessionFile {
	type: string;
	proteins: unknown[];
}

function tryParseSession(text: string): SessionFile | null {
	try {
		const data = JSON.parse(text) as Record<string, unknown>;
		if (data.type === "camelia-session" && Array.isArray(data.proteins)) {
			return data as unknown as SessionFile;
		}
	} catch {
		/* invalid JSON */
	}
	return null;
}

export function useFileDrop() {
	const handleFilesDropped = useCallback(async (files: File[]) => {
		const { upsertProtein, setActiveProteinId, replaceCatalog } =
			useProteinStore.getState();

		for (const file of files) {
			try {
				const text = await readTextFile(file);

				if (isFastaFile(file.name)) {
					const protein = parseFastaText(text, file.name);
					if (!protein) continue;
					upsertProtein(protein);
					setActiveProteinId(protein.id);
					continue;
				}

				if (file.name.toLowerCase().endsWith(".session")) {
					const session = tryParseSession(text);
					if (session) replaceCatalog(session.proteins);
					continue;
				}

				// Structure file (PDB / CIF)
				const protein = parseStructureFile(text, file.name);
				upsertProtein(protein);
				setActiveProteinId(protein.id);
			} catch (err) {
				console.error(`Error importing ${file.name}:`, err);
			}
		}
	}, []);

	return handleFilesDropped;
}
