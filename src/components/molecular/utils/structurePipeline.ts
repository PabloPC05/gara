import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms.js";
import { Mat4, Vec3 } from "molstar/lib/mol-math/linear-algebra.js";
import { Color } from "molstar/lib/mol-util/color/index.js";
import { Script } from "molstar/lib/mol-script/script.js";
import { StructureSelection } from "molstar/lib/mol-model/structure.js";

export const DRAG_SCALE = 0.004;

const CAMERA_VISIBILITY = {
	cameraFog: { name: "off", params: {} },
	cameraClipping: { far: false, minNear: 0.1 },
	sceneRadiusFactor: 3,
};

const RESIDUE_HOVER_COLOR = Color(0xef4444);
const RESIDUE_SELECT_COLOR = Color(0x22c55e);

const INTERACTION_RENDERER = {
	highlightColor: RESIDUE_HOVER_COLOR,
	selectColor: RESIDUE_SELECT_COLOR,
	highlightStrength: 0.45,
	selectStrength: 1.0,
	markerPriority: 2,
};

const INTERACTION_MARKING = {
	enabled: true,
	highlightEdgeColor: RESIDUE_HOVER_COLOR,
	selectEdgeColor: RESIDUE_SELECT_COLOR,
	highlightEdgeStrength: 1,
	selectEdgeStrength: 1,
};

export const LIGHTING_PRESETS = {
	ao: {
		postprocessing: {
			occlusion: {
				name: "on",
				params: {
					samples: 32,
					radius: 5,
					bias: 0.8,
					blurKernelSize: 15,
					blurDepthBias: 0.5,
					resolutionScale: 1,
					color: Color(0x000000),
					transparentThreshold: 0.4,
					multiScale: { name: "off", params: {} },
				},
			},
			shadow: { name: "off", params: {} },
		},
		renderer: {
			...INTERACTION_RENDERER,
			ambientIntensity: 0.9,
			lightIntensity: 0.4,
			metalness: 0,
			roughness: 1.0,
		},
		marking: { ...INTERACTION_MARKING },
		...CAMERA_VISIBILITY,
	},
	flat: {
		postprocessing: {
			occlusion: { name: "off", params: {} },
			shadow: { name: "off", params: {} },
		},
		renderer: {
			...INTERACTION_RENDERER,
			ambientIntensity: 1.0,
			lightIntensity: 0.0,
			metalness: 0,
			roughness: 1.0,
		},
		marking: { ...INTERACTION_MARKING },
		...CAMERA_VISIBILITY,
	},
	studio: {
		postprocessing: {
			occlusion: { name: "off", params: {} },
			shadow: { name: "off", params: {} },
		},
		renderer: {
			...INTERACTION_RENDERER,
			ambientIntensity: 0.6,
			lightIntensity: 0.8,
			metalness: 0,
			roughness: 0.8,
		},
		marking: { ...INTERACTION_MARKING },
		...CAMERA_VISIBILITY,
	},
};

export function looksLikeCif(text: string): boolean {
	if (!text) return false;
	return (
		/^\s*data_/m.test(text) ||
		/^\s*loop_\s*$/m.test(text) ||
		/^\s*_(entry|audit_conform|atom_site|struct)\./m.test(text)
	);
}

function resolveStructurePayload(protein: Record<string, unknown>) {
	const candidates = [
		{ text: protein?.structureData, hintedFormat: protein?.structureFormat },
		{ text: protein?.cifData, hintedFormat: "cif" },
		{ text: protein?.pdbData, hintedFormat: protein?.structureFormat },
	];

	const candidate = candidates.find(
		({ text }) => typeof text === "string" && text.trim().length > 0,
	);
	if (!candidate) return null;

	const isCif =
		candidate.hintedFormat === "cif" || looksLikeCif(candidate.text as string);
	return { text: candidate.text as string, format: isCif ? "mmcif" : "pdb" };
}

function injectPlddtBfactors(pdbText: string, plddt: number[]): string {
	if (!pdbText || !plddt?.length) return pdbText;
	return pdbText
		.split("\n")
		.map((line) => {
			const rec = line.substring(0, 6);
			if (rec !== "ATOM  " && rec !== "HETATM") return line;
			const seqNum = parseInt(line.substring(22, 26).trim(), 10);
			if (isNaN(seqNum)) return line;
			const idx = seqNum - 1;
			if (idx < 0 || idx >= plddt.length) return line;
			const bStr = plddt[idx].toFixed(2).padStart(6, " ");
			return line.substring(0, 60) + bStr + line.substring(66);
		})
		.join("\n");
}

function injectPlddtBfactorsCif(cifText: string, plddt: number[]): string {
	if (!cifText || !plddt?.length) return cifText;

	const lines = cifText.split("\n");
	const result: string[] = [];

	let headers: string[] = [];
	let bIdx = -1;
	let seqIdx = -1;

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed === "loop_") {
			headers = [];
			bIdx = -1;
			seqIdx = -1;
			result.push(line);
			continue;
		}

		if (trimmed.startsWith("_atom_site.")) {
			const col = trimmed.split(/\s+/)[0];
			if (col === "_atom_site.B_iso_or_equiv") bIdx = headers.length;
			if (col === "_atom_site.auth_seq_id") seqIdx = headers.length;
			else if (col === "_atom_site.label_seq_id" && seqIdx === -1)
				seqIdx = headers.length;
			headers.push(col);
			result.push(line);
			continue;
		}

		if (
			bIdx >= 0 &&
			seqIdx >= 0 &&
			(trimmed.startsWith("ATOM") || trimmed.startsWith("HETATM"))
		) {
			const tokens = trimmed.split(/\s+/);
			const seqNum = parseInt(tokens[seqIdx], 10);
			if (!isNaN(seqNum)) {
				const i = seqNum - 1;
				if (i >= 0 && i < plddt.length) {
					tokens[bIdx] = plddt[i].toFixed(2);
					result.push(tokens.join(" "));
					continue;
				}
			}
		}

		result.push(line);
	}

	return result.join("\n");
}

function getPreferredSeqId(
	Q: Parameters<typeof Script.getStructureSelection>[0],
) {
	return Q.struct.atomProperty.macromolecular.label_seq_id();
}

async function loadStructureEntry(
	plugin: import("molstar/lib/mol-plugin/context.js").PluginContext,
	id: string,
	protein: Record<string, unknown>,
	reprType: string,
	colorScheme: string,
) {
	const payload = resolveStructurePayload(protein);
	if (!payload)
		throw new Error(`No structural payload available for protein ${id}`);

	const { text: rawText, format } = payload;
	let text = rawText;
	const plddtPerResidue = protein.plddtPerResidue as number[] | undefined;
	if (plddtPerResidue?.length) {
		if (format === "pdb") text = injectPlddtBfactors(rawText, plddtPerResidue);
		else if (format === "mmcif")
			text = injectPlddtBfactorsCif(rawText, plddtPerResidue);
	}
	const dataRef = await plugin.builders.data.rawData({ data: text, label: id });
	const traj = await plugin.builders.structure.parseTrajectory(dataRef, format);
	const model = await plugin.builders.structure.createModel(traj);
	const baseRef = await plugin.builders.structure.createStructure(model);

	const transformedRef = await plugin
		.build()
		.to(baseRef)
		.apply(StateTransforms.Model.TransformStructureConformation, {
			transform: {
				name: "matrix",
				params: { data: Array.from(Mat4.identity()), transpose: false },
			},
		})
		.commit();

	const reprRef =
		await plugin.builders.structure.representation.addRepresentation(
			transformedRef,
			{
				type: reprType ?? "cartoon",
				typeParams: { alpha: 1, quality: "high" },
				color: colorScheme ?? "alphafold-plddt",
			},
		);

	const structObj = plugin.state.data.cells.get(transformedRef.ref)?.obj?.data;
	const center = structObj?.boundary?.sphere?.center;
	const centroid = center ? Vec3.clone(center) : Vec3.create(0, 0, 0);

	return {
		id,
		dataRef,
		baseRef,
		transformedRef,
		reprRef,
		mat: Mat4.identity(),
		centroid,
	};
}

export async function syncStructures(
	plugin: import("molstar/lib/mol-plugin/context.js").PluginContext,
	entriesMap: Map<string, any>,
	proteinsById: Record<string, unknown>,
	selectedIds: string[],
	reprType: string,
	colorScheme: string,
): Promise<boolean> {
	let dirty = false;

	for (const [id, entry] of entriesMap) {
		if (!proteinsById[id] || !selectedIds.includes(id)) {
			try {
				await plugin.build().delete(entry.dataRef.ref).commit();
			} catch (e) {
				console.warn(`[Mol*] Failed to delete entry ${id}:`, e);
			}
			entriesMap.delete(id);
			dirty = true;
		}
	}

	for (const id of selectedIds) {
		if (entriesMap.has(id)) continue;
		const protein = proteinsById[id];
		if (!protein) continue;

		try {
			const entry = await loadStructureEntry(
				plugin,
				id,
				protein,
				reprType,
				colorScheme,
			);
			entriesMap.set(id, entry);
			dirty = true;
		} catch (error) {
			console.error(`[Mol*] Could not load structure for ${id}`, error);
		}
	}

	return dirty;
}

export async function commitTransform(
	plugin: import("molstar/lib/mol-plugin/context.js").PluginContext,
	entry: {
		transformedRef: { ref: string };
		mat: import("molstar/lib/mol-math/linear-algebra.js").Mat4;
	},
): Promise<void> {
	await plugin
		.build()
		.to(entry.transformedRef.ref)
		.update(StateTransforms.Model.TransformStructureConformation, () => ({
			transform: {
				name: "matrix",
				params: { data: Array.from(entry.mat), transpose: false },
			},
		}))
		.commit();
}

export function selectResidueBySeqId(
	plugin: import("molstar/lib/mol-plugin/context.js").PluginContext,
	entry: { transformedRef: { ref: string } },
	seqId: number,
) {
	const structure = plugin.state.data.cells.get(entry.transformedRef.ref)?.obj
		?.data;
	if (!structure) return null;

	try {
		const sel = Script.getStructureSelection(
			(Q) =>
				Q.struct.generator.atomGroups({
					"residue-test": Q.core.rel.eq([getPreferredSeqId(Q), seqId]),
					"group-by": Q.struct.atomProperty.macromolecular.residueKey(),
				}),
			structure,
		);
		const loci = StructureSelection.toLociWithSourceUnits(sel);
		plugin.managers.interactivity.lociSelects.selectOnly({ loci });
		plugin.managers.structure.focus.setFromLoci(loci);
		plugin.managers.camera.focusLoci(loci, {
			minRadius: 8,
			extraRadius: 4,
			durationMs: 500,
		});
		return loci;
	} catch (e) {
		console.warn("[Mol*] selectResidueBySeqId failed:", e);
		return null;
	}
}

export function clearResidueSelection(
	plugin: import("molstar/lib/mol-plugin/context.js").PluginContext,
): void {
	plugin.managers.interactivity.lociSelects.deselectAll();
	plugin.managers.structure.focus.clear();
}

export async function updateAllRepresentations(
	plugin: import("molstar/lib/mol-plugin/context.js").PluginContext,
	entriesMap: Map<string, any>,
	reprType: string,
): Promise<void> {
	for (const [, entry] of entriesMap) {
		await plugin
			.build()
			.to(entry.reprRef.ref)
			.update(
				StateTransforms.Representation.StructureRepresentation3D,
				(old) => {
					const sameType = old.type?.name === reprType;
					return {
						...old,
						type: {
							name: reprType,
							params: sameType ? (old.type?.params ?? {}) : {},
						},
					};
				},
			)
			.commit();
	}
}

export async function updateAllColorSchemes(
	plugin: import("molstar/lib/mol-plugin/context.js").PluginContext,
	entriesMap: Map<string, any>,
	colorScheme: string,
	customParams: Record<string, unknown> | null = null,
): Promise<void> {
	for (const [, entry] of entriesMap) {
		await plugin
			.build()
			.to(entry.reprRef.ref)
			.update(
				StateTransforms.Representation.StructureRepresentation3D,
				(old) => {
					const baseParams = old.colorTheme?.params ?? {};
					const newParams = customParams
						? { ...baseParams, ...customParams }
						: baseParams;
					return {
						...old,
						colorTheme: { name: colorScheme, params: newParams },
					};
				},
			)
			.commit();
	}
}
