import { useEffect, useRef, useState, type MutableRefObject } from "react";
import {
	StructureElement,
	StructureProperties,
	StructureSelection,
} from "molstar/lib/mol-model/structure.js";
import { Script } from "molstar/lib/mol-script/script.js";
import {
	selectResidueBySeqId,
	clearResidueSelection,
} from "@/components/molecular/utils/structurePipeline";
import {
	getPreferredSeqId,
	getRefKey,
} from "@/components/molecular/utils/molstarUtils";
import type { PluginContext } from "molstar/lib/mol-plugin/context.js";
import type {
	FocusedResidue,
	StructureEntry,
	TooltipData,
} from "@/types/molecular";
import type useAnalysisStore from "@/stores/useAnalysisStore";

type AnalysisStoreApi = typeof useAnalysisStore & {
	getState: () => { mode: string | null };
};

interface LociEvent {
	current: {
		loci: ({ kind: string } & Record<string, unknown>) | null;
	} | null;
}

interface UseMolstarTooltipParams {
	pluginRef: MutableRefObject<PluginContext | null>;
	entriesRef: MutableRefObject<Map<string, StructureEntry>>;
	proteinId: string | null;
	focusedResidue: FocusedResidue | null;
	focusedResidueRef: MutableRefObject<FocusedResidue | null>;
	selectedIdsRef: MutableRefObject<string[]>;
	setFocusedResidue: (
		proteinId: string,
		residue: FocusedResidue | null,
	) => void;
	analysisStore: AnalysisStoreApi;
}

interface UseMolstarTooltipReturn {
	tooltip: TooltipData | null;
	hasHoverTarget: boolean;
	lastHoverLociRef: MutableRefObject<StructureElement.Loci | null>;
	setHoverTooltip: React.Dispatch<React.SetStateAction<TooltipData | null>>;
	createHoverHandler: () => (evt: LociEvent) => void;
	createClickHandler: () => (evt: LociEvent) => void;
}

export type { LociEvent };

export function useMolstarTooltip({
	pluginRef,
	entriesRef,
	proteinId,
	focusedResidue,
	focusedResidueRef,
	selectedIdsRef,
	setFocusedResidue,
	analysisStore,
}: UseMolstarTooltipParams): UseMolstarTooltipReturn {
	const [hoverTooltip, setHoverTooltip] = useState<TooltipData | null>(null);
	const [selectedTooltip, setSelectedTooltip] = useState<TooltipData | null>(
		null,
	);
	const lastHoverLociRef = useRef<StructureElement.Loci | null>(null);

	const tooltip = hoverTooltip ?? selectedTooltip;

	const createHoverHandler = () => (evt: LociEvent) => {
		const { current } = evt;
		if (!current?.loci || current.loci.kind !== "element-loci") {
			setHoverTooltip(null);
			lastHoverLociRef.current = null;
			return;
		}
		try {
			const loci = current.loci as StructureElement.Loci;
			const loc = StructureElement.Loci.getFirstLocation(loci);
			if (!loc) {
				setHoverTooltip(null);
				lastHoverLociRef.current = null;
				return;
			}

			const seqId = getPreferredSeqId(loc);
			if (seqId == null) {
				setHoverTooltip(null);
				lastHoverLociRef.current = null;
				return;
			}

			lastHoverLociRef.current = loci;
			setHoverTooltip({
				code: StructureProperties.residue.auth_comp_id(loc),
				seqId,
				chainId: StructureProperties.chain.auth_asym_id(loc),
				plddt: StructureProperties.atom.B_iso_or_equiv(loc).toFixed(1),
			});
		} catch {
			setHoverTooltip(null);
			lastHoverLociRef.current = null;
		}
	};

	const createClickHandler = () => (evt: LociEvent) => {
		const { current } = evt;
		if (analysisStore.getState().mode === "distance") return;

		if (!current?.loci || current.loci.kind !== "element-loci") return;

		try {
			const loci = current.loci as StructureElement.Loci;
			const loc = StructureElement.Loci.getFirstLocation(loci);
			if (!loc) return;
			const seqId = getPreferredSeqId(loc);
			if (seqId == null) return;

			const plugin = pluginRef.current;
			if (!plugin) return;

			const structure = loci.structure;
			let clickedProteinId = selectedIdsRef.current[0];

			for (const [id, entry] of entriesRef.current.entries()) {
				const entryStructure = plugin.state.data.cells.get(
					getRefKey(entry.transformedRef),
				)?.obj?.data;
				if (entryStructure === structure) {
					clickedProteinId = id;
					break;
				}
			}

			if (!clickedProteinId) return;

			const currentFocused = focusedResidueRef.current;
			if (currentFocused && currentFocused.seqId === seqId) {
				setFocusedResidue(clickedProteinId, null);
			} else {
				setFocusedResidue(clickedProteinId, { seqId });
			}
		} catch (e) {
			console.error("[Mol*] Error en click:", e);
		}
	};

	useEffect(() => {
		const plugin = pluginRef.current;
		if (!plugin || entriesRef.current.size === 0) {
			setSelectedTooltip(null);
			return;
		}
		if (!focusedResidue) {
			clearResidueSelection(plugin);
			setSelectedTooltip(null);
			return;
		}
		if (!proteinId) {
			setSelectedTooltip(null);
			return;
		}
		const entry = entriesRef.current.get(proteinId);
		if (!entry) {
			setSelectedTooltip(null);
			return;
		}

		const loci = selectResidueBySeqId(plugin, entry, focusedResidue.seqId);
		const loc = loci ? StructureElement.Loci.getFirstLocation(loci) : null;
		if (!loc) {
			setSelectedTooltip(null);
			return;
		}

		const plddt = StructureProperties.atom.B_iso_or_equiv(loc);
		setSelectedTooltip({
			code: StructureProperties.residue.auth_comp_id(loc),
			seqId: StructureProperties.residue.auth_seq_id(loc),
			chainId: StructureProperties.chain.auth_asym_id(loc),
			plddt: Number.isFinite(plddt) ? plddt.toFixed(1) : "0.0",
		});
	}, [focusedResidue, pluginRef, proteinId, entriesRef]);

	return {
		tooltip,
		hasHoverTarget: !!hoverTooltip,
		lastHoverLociRef,
		setHoverTooltip,
		createHoverHandler,
		createClickHandler,
	};
}
