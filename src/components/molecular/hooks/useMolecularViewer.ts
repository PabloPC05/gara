import {
	useEffect,
	useRef,
	type MutableRefObject,
	type RefObject,
} from "react";
import { useMolstarViewer } from "@/components/molecular/hooks/useMolstarViewer";
import { registerAlphafoldPlddtTheme } from "@/components/molecular/utils/themes/plddtColorTheme";
import { registerAnimatedPlddtTheme } from "@/components/molecular/utils/themes/animatedPlddtColorTheme";
import { registerBiochemicalThemes } from "@/components/molecular/utils/themes/biochemicalColorThemes";
import { useFlexibilityAnimation } from "@/components/molecular/hooks/useFlexibilityAnimation";
import { useMolstarMouseControls } from "@/components/molecular/hooks/useMolstarMouseControls";
import { useProteinStore } from "@/stores/useProteinStore";
import { useViewerConfigStore } from "@/stores/useViewerConfigStore";
import { useMolstarStore } from "@/stores/useMolstarStore";
import {
	useMolecularAnalysis,
	type StructureEntry,
} from "@/components/molecular/hooks/useMolecularAnalysis";
import useAnalysisStore from "@/stores/useAnalysisStore";
import { Color } from "molstar/lib/mol-util/color/index.js";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra.js";
import {
	syncStructures,
	updateAllRepresentations,
	updateAllColorSchemes,
	LIGHTING_PRESETS,
} from "@/components/molecular/utils/structurePipeline";
import {
	useMolstarTooltip,
	type LociEvent,
} from "@/components/molecular/hooks/useMolstarTooltip";
import type {
	AnalysisMode,
	ColorSchemeType,
	FocusedResidue,
	LightingType,
	PendingCamera,
	RepresentationType,
	TooltipData,
} from "@/types/molecular";
import type { PluginContext } from "molstar/lib/mol-plugin/context.js";

interface ProteinState {
	proteinsById: Record<string, unknown>;
	setSelectedProteinIds: (ids: string | string[]) => void;
}

interface UIState {
	viewerRepresentation: RepresentationType;
	viewerLighting: LightingType;
	viewerColorScheme: ColorSchemeType;
	viewerBackground: string;
	focusedResidueByProtein: Record<string, FocusedResidue | null>;
	setFocusedResidue: (
		proteinId: string,
		residue: FocusedResidue | null,
	) => void;
	pendingCamera: PendingCamera | null;
	clearPendingCamera: () => void;
}

interface MolstarState {
	setPluginRef: (ref: unknown) => void;
}

interface AnalysisState {
	mode: AnalysisMode | null;
	pendingLoci: unknown[];
	clearTrigger: number;
	clearAll: () => void;
	clearPendingLoci: () => void;
}

type TypedStore<S> = {
	<T>(selector: (s: S) => T): T;
};

const usePStore = useProteinStore as unknown as TypedStore<ProteinState>;
const useUStore = useViewerConfigStore as unknown as TypedStore<UIState>;
const useMStore = useMolstarStore as unknown as TypedStore<MolstarState>;
const useAStore = useAnalysisStore as unknown as TypedStore<AnalysisState> & {
	getState: () => AnalysisState;
};

interface UseMolecularViewerReturn {
	containerRef: RefObject<HTMLDivElement | null>;
	tooltip: TooltipData | null;
	hasSelection: boolean;
	analysisMode: AnalysisMode | null;
	pendingCount: number;
	hasHoverTarget: boolean;
	onExitMode: () => void;
}

type ViewerReturn = {
	containerRef: RefObject<HTMLDivElement | null>;
	pluginRef: MutableRefObject<PluginContext | null>;
};

export function useMolecularViewer(
	proteinId: string | null,
): UseMolecularViewerReturn {
	const proteinsById = usePStore((s) => s.proteinsById);
	const setSelectedProteinIds = usePStore((s) => s.setSelectedProteinIds);

	const viewerRepresentation = useUStore((s) => s.viewerRepresentation);
	const viewerLighting = useUStore((s) => s.viewerLighting);
	const viewerColorScheme = useUStore((s) => s.viewerColorScheme);
	const sceneBackground = useUStore((s) => s.viewerBackground);
	const focusedResidueByProtein = useUStore((s) => s.focusedResidueByProtein);
	const focusedResidue = proteinId ? focusedResidueByProtein[proteinId] : null;
	const setFocusedResidue = useUStore((s) => s.setFocusedResidue);
	const pendingCamera = useUStore((s) => s.pendingCamera);
	const clearPendingCamera = useUStore((s) => s.clearPendingCamera);

	const setMolstarPluginRef = useMStore((s) => s.setPluginRef);

	const selectedIdsRef = useRef<string[]>(proteinId ? [proteinId] : []);
	const proteinsByIdRef = useRef(proteinsById);
	const reprTypeRef = useRef<RepresentationType>(viewerRepresentation);
	const colorSchemeRef = useRef<ColorSchemeType>(viewerColorScheme);
	const entriesRef = useRef<Map<string, StructureEntry>>(new Map());
	const focusedResidueRef = useRef<FocusedResidue | null>(focusedResidue);
	const hbondReprRefs = useRef<string[]>([]);

	const hoverHandlerRef = useRef<((evt: LociEvent) => void) | null>(null);
	const clickHandlerRef = useRef<((evt: LociEvent) => void) | null>(null);

	useEffect(() => {
		selectedIdsRef.current = proteinId ? [proteinId] : [];
		proteinsByIdRef.current = proteinsById;
		reprTypeRef.current = viewerRepresentation;
		colorSchemeRef.current = viewerColorScheme;
		focusedResidueRef.current = focusedResidue;
	}, [
		proteinId,
		proteinsById,
		viewerRepresentation,
		viewerColorScheme,
		focusedResidue,
	]);

	const { containerRef, pluginRef } = useMolstarViewer({
		setup: async (plugin: PluginContext) => {
			registerAlphafoldPlddtTheme(plugin);
			registerAnimatedPlddtTheme(plugin);
			registerBiochemicalThemes(plugin);

			plugin.canvas3d?.setProps({
				...LIGHTING_PRESETS.ao,
				renderer: {
					...LIGHTING_PRESETS.ao.renderer,
					backgroundColor: Color.fromHexStyle(sceneBackground),
				},
			} as Parameters<NonNullable<PluginContext["canvas3d"]>["setProps"]>[0]);

			const dirty = await syncStructures(
				plugin,
				entriesRef.current,
				proteinsByIdRef.current,
				selectedIdsRef.current,
				reprTypeRef.current,
				colorSchemeRef.current,
			);
			if (dirty && entriesRef.current.size > 0) plugin.managers.camera.reset();

			const hoverSub = plugin.behaviors.interaction.hover.subscribe(
				(evt: LociEvent) => {
					hoverHandlerRef.current?.(evt);
				},
			);

			const clickSub = plugin.behaviors.interaction.click.subscribe(
				(evt: LociEvent) => {
					clickHandlerRef.current?.(evt);
				},
			);

			return () => {
				hoverSub.unsubscribe();
				clickSub.unsubscribe();
			};
		},
		deps: [],
	}) as ViewerReturn;

	const {
		tooltip,
		hasHoverTarget,
		lastHoverLociRef,
		createHoverHandler,
		createClickHandler,
	} = useMolstarTooltip({
		pluginRef,
		entriesRef,
		proteinId,
		focusedResidue,
		focusedResidueRef,
		selectedIdsRef,
		setFocusedResidue,
		analysisStore: useAStore,
	});

	useEffect(() => {
		hoverHandlerRef.current = createHoverHandler();
		clickHandlerRef.current = createClickHandler();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		setMolstarPluginRef(pluginRef);
	}, [pluginRef, setMolstarPluginRef]);

	useMolstarMouseControls({
		containerRef,
		pluginRef,
		entriesRef,
		selectedIdsRef,
		setSelectedProteinIds,
		setFocusedResidue,
	});

	useFlexibilityAnimation(pluginRef, entriesRef);

	const { analysisMode, pendingLoci, clearAll } = useMolecularAnalysis({
		pluginRef,
		containerRef,
		entriesRef,
		selectedIdsRef,
		lastHoverLociRef,
		hbondReprRefs,
	});

	useEffect(() => {
		const plugin = pluginRef.current;
		if (!plugin) return;
		let cancelled = false;
		(async () => {
			const dirty = await syncStructures(
				plugin,
				entriesRef.current,
				proteinsById,
				proteinId ? [proteinId] : [],
				reprTypeRef.current,
				colorSchemeRef.current,
			);
			if (cancelled) return;
			if (dirty && entriesRef.current.size > 0) plugin.managers.camera.reset();
		})();
		return () => {
			cancelled = true;
		};
	}, [proteinsById, proteinId, pluginRef]);

	useEffect(() => {
		const plugin = pluginRef.current;
		if (!plugin || !pendingCamera || entriesRef.current.size === 0) return;
		const c = plugin.canvas3d;
		if (!c) return;
		c.camera.setState({
			position: Vec3.create(...pendingCamera.position),
			target: Vec3.create(...pendingCamera.target),
			up: Vec3.create(...pendingCamera.up),
		});
		clearPendingCamera();
	}, [pendingCamera, pluginRef, proteinId]);

	useEffect(() => {
		pluginRef.current?.canvas3d?.setProps({
			renderer: { backgroundColor: Color.fromHexStyle(sceneBackground) },
		});
	}, [sceneBackground, pluginRef]);

	useEffect(() => {
		const plugin = pluginRef.current;
		if (!plugin || entriesRef.current.size === 0) return;
		updateAllRepresentations(
			plugin,
			entriesRef.current,
			viewerRepresentation,
		).catch(console.error);
	}, [viewerRepresentation, pluginRef]);

	useEffect(() => {
		const plugin = pluginRef.current;
		if (!plugin || entriesRef.current.size === 0) return;
		updateAllColorSchemes(plugin, entriesRef.current, viewerColorScheme).catch(
			console.error,
		);
	}, [viewerColorScheme, pluginRef]);

	useEffect(() => {
		const plugin = pluginRef.current;
		if (!plugin) return;
		const preset = LIGHTING_PRESETS[viewerLighting] ?? LIGHTING_PRESETS.ao;
		plugin.canvas3d?.setProps(
			preset as Parameters<
				NonNullable<PluginContext["canvas3d"]>["setProps"]
			>[0],
		);
	}, [viewerLighting, pluginRef]);

	const prevProteinIdRef = useRef(proteinId);
	useEffect(() => {
		if (prevProteinIdRef.current === proteinId) return;
		prevProteinIdRef.current = proteinId;
		const plugin = pluginRef.current;
		if (!plugin) return;
		try {
			(
				plugin.managers.structure.measurement as unknown as { clear(): void }
			).clear();
		} catch {
			/* no-op */
		}
		plugin.managers.interactivity.lociSelects.deselectAll();
		useAStore.getState().clearPendingLoci();
	}, [proteinId, pluginRef]);

	return {
		containerRef,
		tooltip,
		hasSelection: !!proteinId,
		analysisMode,
		pendingCount: pendingLoci.length,
		hasHoverTarget,
		onExitMode: clearAll,
	};
}
