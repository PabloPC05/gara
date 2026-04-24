import { create } from "zustand";

export const JOB_PANEL_KEYS = {
	catalog: "catalog",
	filesFasta: "files-fasta",
	aminoBuilder: "amino-builder",
} as const;

export type JobPanelKey = (typeof JOB_PANEL_KEYS)[keyof typeof JOB_PANEL_KEYS];

export const ACTIVE_JOB_STATUSES = new Set(["PENDING", "RUNNING"]);
export const DISMISSIBLE_JOB_STATUSES = new Set(["FAILED", "CANCELLED"]);

export type JobStatus =
	| "PENDING"
	| "RUNNING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

interface JobPanel {
	status?: JobStatus;
	message?: string;
	progress?: number;
	jobId?: string;
	[key: string]: unknown;
}

interface JobStatusState {
	panelsByKey: Record<string, JobPanel>;

	upsertJobPanel: (key: JobPanelKey, patch: Partial<JobPanel>) => void;
	clearJobPanel: (key: JobPanelKey) => void;
}

export const useJobStatusStore = create<JobStatusState>()((set) => ({
	panelsByKey: {},

	upsertJobPanel: (key, patch) =>
		set((state) => {
			const prev = state.panelsByKey[key] ?? {};
			if (Object.keys(patch).every((k) => prev[k] === patch[k])) return state;
			return {
				panelsByKey: {
					...state.panelsByKey,
					[key]: { ...prev, ...patch },
				},
			};
		}),

	clearJobPanel: (key) =>
		set((state) => {
			if (!(key in state.panelsByKey)) return state;
			const nextPanels = { ...state.panelsByKey };
			delete nextPanels[key];
			return { panelsByKey: nextPanels };
		}),
}));

export function getJobPanel(key: JobPanelKey): JobPanel | null {
	return useJobStatusStore.getState().panelsByKey[key] ?? null;
}
