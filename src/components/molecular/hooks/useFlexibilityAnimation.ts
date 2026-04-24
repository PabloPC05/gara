import { useEffect, useRef, type MutableRefObject } from "react";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra.js";
import { useViewerConfigStore } from "@/stores/useViewerConfigStore";
import { updateAllColorSchemes } from "@/components/molecular/utils/structurePipeline";
import type { PluginContext } from "molstar/lib/mol-plugin/context.js";
import type { StructureEntry } from "@/components/molecular/hooks/useMolecularAnalysis";

const TICK_MS = 100;
const TIME_STEP = 0.15;
const SHAKE_MAGNITUDE = 0.08;

interface AnimationState {
	isUpdating: boolean;
	lastJitterPos: typeof Vec3 | null;
}

export function useFlexibilityAnimation(
	pluginRef: MutableRefObject<PluginContext | null>,
	entriesRef: MutableRefObject<Map<string, StructureEntry>>,
): void {
	const flexibilityAnimating = useViewerConfigStore(
		(s) => s.flexibilityAnimating,
	);
	const rafRef = useRef<number | null>(null);
	const timeRef = useRef(0);
	const stateRef = useRef<AnimationState>({
		isUpdating: false,
		lastJitterPos: null,
	});

	useEffect(() => {
		const plugin = pluginRef.current;
		if (!plugin) return;
		const entries = entriesRef.current;
		if (entries.size === 0) return;

		if (!flexibilityAnimating) {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			timeRef.current = 0;
			stateRef.current = { isUpdating: false, lastJitterPos: null };

			updateAllColorSchemes(plugin, entries, "alphafold-plddt").catch(() => {});
			return;
		}

		updateAllColorSchemes(plugin, entries, "alphafold-plddt-flex").catch(
			() => {},
		);

		let lastTick = performance.now();

		function tick() {
			const now = performance.now();
			const plugin = pluginRef.current;
			if (!plugin) return;

			if (now - lastTick >= TICK_MS) {
				lastTick = now;
				timeRef.current += TIME_STEP;

				if (!stateRef.current.isUpdating) {
					stateRef.current.isUpdating = true;
					updateAllColorSchemes(
						plugin,
						entriesRef.current,
						"alphafold-plddt-flex",
						{ time: timeRef.current },
					).finally(() => {
						stateRef.current.isUpdating = false;
					});
				}

				const camera = plugin.canvas3d!.camera;
				const snap = camera.getSnapshot();

				const dx = (Math.random() - 0.5) * 2 * SHAKE_MAGNITUDE;
				const dy = (Math.random() - 0.5) * 2 * SHAKE_MAGNITUDE;
				const dz = (Math.random() - 0.5) * 2 * SHAKE_MAGNITUDE;

				camera.setState({
					...snap,
					position: Vec3.create(
						snap.position[0] + dx,
						snap.position[1] + dy,
						snap.position[2] + dz,
					),
					transitionDurationMs: 0,
				} as any);
			}

			rafRef.current = requestAnimationFrame(tick);
		}

		rafRef.current = requestAnimationFrame(tick);

		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			updateAllColorSchemes(
				plugin,
				entriesRef.current,
				"alphafold-plddt",
			).catch(() => {});
		};
	}, [flexibilityAnimating, pluginRef, entriesRef]);
}
