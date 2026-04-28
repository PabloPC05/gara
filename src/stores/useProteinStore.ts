import { create } from "zustand";
import type { RawProtein } from "@/components/protein-details/utils/proteinTypes";

interface ProteinState {
	proteinsById: Record<string, RawProtein>;
	selectedProteinIds: string[];
	activeProteinId: string | null;
	loadingById: Record<string, boolean>;
	errorById: Record<string, string>;
	proteinIdByJobId: Record<string, string>;

	upsertProtein: (protein: RawProtein) => void;
	replaceCatalog: (proteins: RawProtein[]) => void;
	removeProtein: (id: string) => void;
	setProteinLoading: (jobId: string, proteinId?: string | null) => void;
	setProteinError: (
		jobId: string,
		message: string,
		proteinId?: string | null,
	) => void;
	clearProteinLoadingByJobId: (jobId: string) => void;
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
	proteinIdByJobId: {},

	upsertProtein: (protein) => {
		if (!protein?.id) return;
		set((state) => ({
			proteinsById: { ...state.proteinsById, [protein.id as string]: protein },
			loadingById: omitKey(state.loadingById, protein.id as string),
			errorById: omitKey(state.errorById, protein.id as string),
			proteinIdByJobId: omitJobsByProteinId(
				state.proteinIdByJobId,
				protein.id as string,
			),
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
				proteinIdByJobId: {},
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
				proteinIdByJobId: omitJobsByProteinId(state.proteinIdByJobId, id),
			};
		}),

	setProteinLoading: (jobId, proteinId) =>
		set((state) => {
			const key = resolveProteinStateKey(state.proteinIdByJobId, jobId, proteinId);
			return {
				loadingById: { ...state.loadingById, [key]: true },
				errorById: omitKey(state.errorById, key),
				proteinIdByJobId:
					typeof proteinId === "string" && proteinId.length > 0
						? { ...state.proteinIdByJobId, [jobId]: proteinId }
						: state.proteinIdByJobId,
			};
		}),

	setProteinError: (jobId, message, proteinId) =>
		set((state) => {
			const key = resolveProteinStateKey(state.proteinIdByJobId, jobId, proteinId);
			return {
				loadingById: omitKey(state.loadingById, key),
				errorById: { ...state.errorById, [key]: message },
				proteinIdByJobId:
					typeof proteinId === "string" && proteinId.length > 0
						? { ...state.proteinIdByJobId, [jobId]: proteinId }
						: state.proteinIdByJobId,
			};
		}),

	clearProteinLoadingByJobId: (jobId) =>
		set((state) => {
			const proteinId = state.proteinIdByJobId[jobId];
			if (!proteinId) return state;
			return {
				loadingById: omitKey(state.loadingById, proteinId),
				errorById: omitKey(state.errorById, proteinId),
				proteinIdByJobId: omitKey(state.proteinIdByJobId, jobId),
			};
		}),

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

function resolveProteinStateKey(
	proteinIdByJobId: Record<string, string>,
	jobId: string,
	proteinId?: string | null,
): string {
	if (typeof proteinId === "string" && proteinId.length > 0) return proteinId;
	const mappedProteinId = proteinIdByJobId[jobId];
	if (typeof mappedProteinId === "string" && mappedProteinId.length > 0) {
		return mappedProteinId;
	}
	return jobId;
}

function omitJobsByProteinId(
	proteinIdByJobId: Record<string, string>,
	proteinId: string,
): Record<string, string> {
	let next = proteinIdByJobId;
	for (const [jobId, mappedProteinId] of Object.entries(proteinIdByJobId)) {
		if (mappedProteinId !== proteinId) continue;
		next = omitKey(next, jobId);
	}
	return next;
}
