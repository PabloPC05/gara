import { create } from "zustand";

function load(key: string, fallback: string): string {
	const v = localStorage.getItem(key);
	return v !== null ? v : fallback;
}

const savedViewerBg = load("ui:viewerBg", "#ffffff");
const savedColorScheme = load("ui:viewerColorScheme", "alphafold-plddt");

interface FocusedResidue {
	seqId: number;
}

interface PendingCamera {
	position: [number, number, number];
	target: [number, number, number];
	up: [number, number, number];
}

interface ViewerConfigState {
	viewerBackground: string;
	viewerRepresentation: string;
	viewerLighting: string;
	viewerColorScheme: string;
	drugDiscoveryMode: boolean;
	drugDiscoveryLens: string;
	_preDiscoveryRepr: string | null;
	_preDiscoveryColor: string | null;
	focusedResidueByProtein: Record<string, FocusedResidue | null>;
	pendingCamera: PendingCamera | null;
	flexibilityAnimating: boolean;
	setViewerBackground: (bg: string) => void;
	setViewerRepresentation: (rep: string) => void;
	setViewerLighting: (lighting: string) => void;
	setViewerColorScheme: (scheme: string) => void;
	toggleDrugDiscovery: () => void;
	setDrugDiscoveryLens: (lens: string) => void;
	setFocusedResidue: (
		proteinId: string,
		residue: FocusedResidue | null,
	) => void;
	clearFocusedResidue: (proteinId: string) => void;
	toggleFlexibilityAnimation: () => void;
	setPendingCamera: (camera: PendingCamera | null) => void;
	clearPendingCamera: () => void;
}

export const useViewerConfigStore = create<ViewerConfigState>((set) => ({
	// ── Viewer appearance ─────────────────────────────────────────────────
	viewerBackground: savedViewerBg,
	viewerRepresentation: "cartoon",
	viewerLighting: "ao",
	viewerColorScheme: savedColorScheme,

	// ── Drug Discovery Mode ───────────────────────────────────────────────
	drugDiscoveryMode: false,
	drugDiscoveryLens: "electrostatic-charge",
	_preDiscoveryRepr: null as string | null,
	_preDiscoveryColor: null as string | null,

	// ── Focused residue per protein (FastaBar <-> 3D Viewer) ──────────────
	focusedResidueByProtein: {} as Record<string, FocusedResidue | null>,
	// ── Flexibility animation ─────────────────────────────────────────────
	flexibilityAnimating: false,

	// ── Pending camera (deep link restore) ────────────────────────────────
	pendingCamera: null as PendingCamera | null,

	// ── Viewer appearance actions ─────────────────────────────────────────
	setViewerBackground: (color: string) =>
		set(() => {
			localStorage.setItem("ui:viewerBg", color);
			return { viewerBackground: color };
		}),

	setViewerRepresentation: (repr: string) =>
		set((state: { drugDiscoveryMode: boolean }) => ({
			viewerRepresentation: repr,
			...(state.drugDiscoveryMode
				? {
						drugDiscoveryMode: false,
						_preDiscoveryRepr: null,
						_preDiscoveryColor: null,
					}
				: {}),
		})),

	setViewerLighting: (lighting: string) => set({ viewerLighting: lighting }),

	setViewerColorScheme: (scheme: string) =>
		set((state: { drugDiscoveryMode: boolean }) => {
			localStorage.setItem("ui:viewerColorScheme", scheme);
			return {
				viewerColorScheme: scheme,
				...(state.drugDiscoveryMode
					? {
							drugDiscoveryMode: false,
							_preDiscoveryRepr: null,
							_preDiscoveryColor: null,
						}
					: {}),
			};
		}),

	// ── Drug Discovery Mode actions ───────────────────────────────────────
	toggleDrugDiscovery: () =>
		set(
			(state: {
				drugDiscoveryMode: boolean;
				drugDiscoveryLens: string;
				viewerRepresentation: string;
				viewerColorScheme: string;
				_preDiscoveryRepr: string | null;
				_preDiscoveryColor: string | null;
			}) => {
				if (state.drugDiscoveryMode) {
					const restoredColor = state._preDiscoveryColor ?? "alphafold-plddt";
					localStorage.setItem("ui:viewerColorScheme", restoredColor);
					return {
						drugDiscoveryMode: false,
						viewerRepresentation: state._preDiscoveryRepr ?? "cartoon",
						viewerColorScheme: restoredColor,
						_preDiscoveryRepr: null,
						_preDiscoveryColor: null,
					};
				}
				localStorage.setItem("ui:viewerColorScheme", state.drugDiscoveryLens);
				return {
					drugDiscoveryMode: true,
					_preDiscoveryRepr: state.viewerRepresentation,
					_preDiscoveryColor: state.viewerColorScheme,
					viewerRepresentation: "gaussian-surface",
					viewerColorScheme: state.drugDiscoveryLens,
				};
			},
		),

	setDrugDiscoveryLens: (lens: string) =>
		set((state: { drugDiscoveryMode: boolean }) => {
			const update: Record<string, unknown> = { drugDiscoveryLens: lens };
			if (state.drugDiscoveryMode) {
				update.viewerColorScheme = lens;
				localStorage.setItem("ui:viewerColorScheme", lens);
			}
			return update;
		}),

	// ── Focused residue actions ───────────────────────────────────────────
	setFocusedResidue: (proteinId: string, residue: FocusedResidue | null) =>
		set(
			(state: {
				focusedResidueByProtein: Record<string, FocusedResidue | null>;
			}) => ({
				focusedResidueByProtein: {
					...state.focusedResidueByProtein,
					[proteinId]: residue,
				},
			}),
		),

	clearFocusedResidue: (proteinId: string) =>
		set(
			(state: {
				focusedResidueByProtein: Record<string, FocusedResidue | null>;
			}) => {
				const next = { ...state.focusedResidueByProtein };
				delete next[proteinId];
				return { focusedResidueByProtein: next };
			},
		),

	// ── Flexibility animation actions ─────────────────────────────────────
	toggleFlexibilityAnimation: () =>
		set((state: { flexibilityAnimating: boolean }) => ({
			flexibilityAnimating: !state.flexibilityAnimating,
		})),

	// ── Pending camera actions ────────────────────────────────────────────
	setPendingCamera: (cam: PendingCamera | null) => set({ pendingCamera: cam }),
	clearPendingCamera: () => set({ pendingCamera: null }),
}));
