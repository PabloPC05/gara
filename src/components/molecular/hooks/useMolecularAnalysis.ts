import { useEffect, type MutableRefObject, type RefObject } from "react";
import { StructureElement } from "molstar/lib/mol-model/structure.js";
import type { PluginContext } from "molstar/lib/mol-plugin/context.js";
import useAnalysisStore from "@/stores/useAnalysisStore";
import type { AnalysisMode, StructureEntry } from "@/types/molecular";

export type { StructureEntry };

interface AnalysisState {
	mode: AnalysisMode | null;
	pendingLoci: StructureElement.Loci[];
	clearTrigger: number;
	addPendingLocus: (loci: StructureElement.Loci) => void;
	clearPendingLoci: () => void;
	clearAll: () => void;
}

type TypedAnalysisStore = {
	<T>(selector: (s: AnalysisState) => T): T;
	getState: () => AnalysisState;
};

const store = useAnalysisStore as unknown as TypedAnalysisStore;

function clearHbondReprs(
	plugin: PluginContext,
	hbondReprRefs: MutableRefObject<string[]>,
) {
	if (hbondReprRefs.current.length === 0) return;
	const builder = plugin.build();
	hbondReprRefs.current.forEach((ref) => {
		try {
			builder.delete(ref);
		} catch {
			/* orphaned */
		}
	});
	builder.commit().catch(console.error);
	hbondReprRefs.current = [];
}

interface UseMolecularAnalysisParams {
	pluginRef: MutableRefObject<PluginContext | null>;
	containerRef: RefObject<HTMLDivElement | null>;
	entriesRef: MutableRefObject<Map<string, StructureEntry>>;
	selectedIdsRef: MutableRefObject<string[]>;
	lastHoverLociRef: MutableRefObject<StructureElement.Loci | null>;
	hbondReprRefs: MutableRefObject<string[]>;
}

export function useMolecularAnalysis({
	pluginRef,
	containerRef,
	entriesRef,
	lastHoverLociRef,
	hbondReprRefs,
}: UseMolecularAnalysisParams) {
	const analysisMode = store((s) => s.mode);
	const pendingLoci = store((s) => s.pendingLoci);
	const clearTrigger = store((s) => s.clearTrigger);
	const clearAll = store((s) => s.clearAll);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleClick = () => {
			const {
				mode,
				pendingLoci: pending,
				addPendingLocus,
				clearPendingLoci,
			} = store.getState();

			if (mode !== "distance") return;

			const loci = lastHoverLociRef.current;
			if (!loci) return;

			const plugin = pluginRef.current;
			if (!plugin) return;

			if (pending.length === 0) {
				addPendingLocus(loci);
				plugin.managers.interactivity.lociSelects.selectOnly({ loci });
				return;
			}

			if (StructureElement.Loci.areEqual(pending[0], loci)) {
				plugin.managers.interactivity.lociSelects.deselectAll();
				clearPendingLoci();
				return;
			}

			try {
				plugin.managers.structure.measurement.addDistance(pending[0], loci);
			} catch (err) {
				console.warn("[Analysis] addDistance failed:", err);
			}
			plugin.managers.interactivity.lociSelects.deselectAll();
			clearPendingLoci();
		};

		container.addEventListener("click", handleClick);
		return () => container.removeEventListener("click", handleClick);
	}, [containerRef, pluginRef, lastHoverLociRef]);

	useEffect(() => {
		const plugin = pluginRef.current;
		if (!plugin || entriesRef.current.size === 0) return;

		if (analysisMode !== "hbonds") {
			clearHbondReprs(plugin, hbondReprRefs);
			return;
		}

		(async () => {
			const newRefs: string[] = [];
			for (const [, entry] of entriesRef.current) {
				try {
					const ref =
						await plugin.builders.structure.representation.addRepresentation(
							// @ts-expect-error Mol* StateObjectRef accepts {ref} at runtime but not in types
							entry.transformedRef,
							{ type: "interactions" } as unknown as { type: "cartoon" },
						);
					if (ref?.ref) newRefs.push(ref.ref);
				} catch (e) {
					console.warn(
						"[Analysis] No se pudo añadir repr de interacciones:",
						e,
					);
				}
			}
			hbondReprRefs.current = newRefs;
		})();
	}, [analysisMode, pluginRef, entriesRef, hbondReprRefs]);

	useEffect(() => {
		if (clearTrigger === 0) return;
		const plugin = pluginRef.current;
		if (!plugin) return;

		try {
			(
				plugin.managers.structure.measurement as unknown as { clear(): void }
			).clear();
		} catch (e) {
			console.warn("[Analysis] measurement.clear() failed:", e);
		}

		plugin.managers.interactivity.lociSelects.deselectAll();
		clearHbondReprs(plugin, hbondReprRefs);
	}, [clearTrigger, pluginRef, hbondReprRefs]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			const { mode } = store.getState();
			if (mode) {
				e.preventDefault();
				clearAll();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [clearAll]);

	return { analysisMode, pendingLoci, clearAll } as const;
}
