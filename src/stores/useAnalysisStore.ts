import { create } from "zustand";
import type { StructureElement } from "molstar/lib/mol-model/structure";

type AnalysisMode = "distance" | "hbonds";

interface AnalysisState {
	mode: AnalysisMode | null;
	pendingLoci: StructureElement.Loci[];
	clearTrigger: number;

	toggleMode: (mode: AnalysisMode) => void;
	addPendingLocus: (loci: StructureElement.Loci) => void;
	clearPendingLoci: () => void;
	clearAll: () => void;
}

const useAnalysisStore = create<AnalysisState>()((set) => ({
	mode: null,
	pendingLoci: [],
	clearTrigger: 0,

	toggleMode: (mode) =>
		set((s) => ({ mode: s.mode === mode ? null : mode, pendingLoci: [] })),

	addPendingLocus: (loci) =>
		set((s) => ({ pendingLoci: [...s.pendingLoci, loci] })),

	clearPendingLoci: () => set({ pendingLoci: [] }),

	clearAll: () =>
		set((s) => ({
			mode: null,
			pendingLoci: [],
			clearTrigger: s.clearTrigger + 1,
		})),
}));

export default useAnalysisStore;
