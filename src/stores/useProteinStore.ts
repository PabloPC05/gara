import { create } from "zustand";
import type { RawProtein } from "@/components/protein-details/utils/proteinTypes";

interface ProteinState {
	proteinsById: Record<string, RawProtein>;
	selectedProteinIds: string[];
	activeProteinId: string | null;
	loadingById: Record<string, boolean>;
	errorById: Record<string, string>;

	upsertProtein: (protein: RawProtein) => void;
	replaceCatalog: (proteins: RawProtein[]) => void;
	removeProtein: (id: string) => void;
	setProteinLoading: (id: string) => void;
	setProteinError: (id: string, message: string) => void;
	setSelectedProteinIds: (ids: string[]) => void;
	toggleProteinSelection: (id: string) => void;
	setActiveProteinId: (id: string) => void;
	clearSelection: () => void;
}

export const useProteinStore = create<ProteinState>()((set, get) => ({
	proteinsById: {},
	selectedProteinIds: [],
	activeProteinId: null,
	loadingById: {},
	errorById: {},

	upsertProtein: (protein) => {
		if (!protein?.id) return;
		set((state) => ({
			proteinsById: { ...state.proteinsById, [protein.id as string]: protein },
			loadingById: omitKey(state.loadingById, protein.id as string),
			errorById: omitKey(state.errorById, protein.id as string),
		}));
	},

	replaceCatalog: (proteins) => {
		const next: Record<string, RawProtein> = {};
		for (const p of proteins) {
			if (p?.id) next[p.id as string] = p;
		}
		set((state) => {
			const nextSelection = state.selectedProteinIds.filter((id) => id in next);
			return {
				proteinsById: next,
				selectedProteinIds: nextSelection,
				activeProteinId:
					nextSelection.length > 0
						? nextSelection[nextSelection.length - 1]
						: null,
				loadingById: {},
				errorById: {},
			};
		});
	},

	removeProtein: (id) =>
		set((state) => {
			const nextCatalog = omitKey(state.proteinsById, id);
			const nextSelection = state.selectedProteinIds.filter(
				(pid) => pid !== id,
			);
			return {
				proteinsById: nextCatalog,
				selectedProteinIds: nextSelection,
				activeProteinId:
					nextSelection.length > 0
						? nextSelection[nextSelection.length - 1]
						: null,
				loadingById: omitKey(state.loadingById, id),
				errorById: omitKey(state.errorById, id),
			};
		}),

	setProteinLoading: (id) =>
		set((state) => ({
			loadingById: { ...state.loadingById, [id]: true },
			errorById: omitKey(state.errorById, id),
		})),

	setProteinError: (id, message) =>
		set((state) => ({
			loadingById: omitKey(state.loadingById, id),
			errorById: { ...state.errorById, [id]: message },
		})),

	setSelectedProteinIds: (ids) => {
		const newIds = normalizeSelection(ids);
		set({
			selectedProteinIds: newIds,
			activeProteinId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
		});
	},

	toggleProteinSelection: (id) => {
		if (typeof id !== "string" || id.length === 0) return;
		const { selectedProteinIds } = get();
		const isAlreadySelected = selectedProteinIds.includes(id);
		const nextIds = isAlreadySelected
			? selectedProteinIds.filter((pid) => pid !== id)
			: normalizeSelection([...selectedProteinIds, id]);
		set({
			selectedProteinIds: nextIds,
			activeProteinId: nextIds.length > 0 ? nextIds[nextIds.length - 1] : null,
		});
	},

	setActiveProteinId: (id) => {
		if (typeof id !== "string" || id.length === 0) {
			set({ selectedProteinIds: [], activeProteinId: null });
			return;
		}
		set({ selectedProteinIds: [id], activeProteinId: id });
	},

	clearSelection: () => set({ selectedProteinIds: [], activeProteinId: null }),
}));

function omitKey<T extends Record<string, unknown>>(obj: T, key: string): T {
	if (!(key in obj)) return obj;
	const next = { ...obj };
	delete next[key];
	return next;
}

function normalizeSelection(ids: string[]): string[] {
	const list = Array.isArray(ids) ? ids : [ids];
	const seen = new Set<string>();
	const result: string[] = [];
	for (const id of list) {
		if (typeof id === "string" && id.length > 0 && !seen.has(id)) {
			seen.add(id);
			result.push(id);
		}
	}
	return result.slice(0, 2);
}
