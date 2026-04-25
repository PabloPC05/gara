import {
	useEffect,
	useRef,
	type MutableRefObject,
	type RefObject,
} from "react";
import { Mat4, Vec3 } from "molstar/lib/mol-math/linear-algebra.js";
import { StructureElement } from "molstar/lib/mol-model/structure.js";
import { applyRotation, applyTranslation } from "@/lib/math/matrixUtils";
import {
	commitTransform,
	DRAG_SCALE,
} from "@/components/molecular/utils/structurePipeline";
import { getPreferredSeqId } from "@/components/molecular/utils/molstarUtils";
import type { PluginContext } from "molstar/lib/mol-plugin/context.js";
import type { FocusedResidue, StructureEntry } from "@/types/molecular";

type DragState =
	| { mode: "rotate"; id: string; centroid: Vec3; lastX: number; lastY: number }
	| {
			mode: "translate";
			id: string;
			axes: CameraAxes;
			lastX: number;
			lastY: number;
	  };

interface CameraAxes {
	right: Vec3;
	up: Vec3;
}

interface PickResult {
	id: string;
	seqId: number | null;
	reprLoci: { loci: StructureElement.Loci };
}

interface UseMolstarMouseControlsParams {
	containerRef: RefObject<HTMLDivElement | null>;
	pluginRef: MutableRefObject<PluginContext | null>;
	entriesRef: MutableRefObject<Map<string, StructureEntry>>;
	selectedIdsRef: MutableRefObject<string[]>;
	setSelectedProteinIds: (ids: string | string[]) => void;
	setFocusedResidue: (
		proteinId: string,
		residue: FocusedResidue | null,
	) => void;
}

export function useMolstarMouseControls({
	containerRef,
	pluginRef,
	entriesRef,
	selectedIdsRef,
	setSelectedProteinIds,
	setFocusedResidue,
}: UseMolstarMouseControlsParams): void {
	const dragRef = useRef<DragState | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const pickAt = (clientX: number, clientY: number): PickResult | null => {
			const plugin = pluginRef.current;
			if (!plugin?.canvas3d) return null;
			const rect = container.getBoundingClientRect();
			const pick = plugin.canvas3d.identify({
				x: clientX - rect.left,
				y: clientY - rect.top,
			} as any);
			if (!pick) return null;

			const reprLoci = plugin.canvas3d.getLoci(pick.id);
			if (!reprLoci?.loci || reprLoci.loci.kind !== "element-loci") return null;

			let seqId: number | null = null;
			try {
				const loc = StructureElement.Loci.getFirstLocation(
					reprLoci.loci as StructureElement.Loci,
				);
				if (loc) {
					seqId = getPreferredSeqId(loc);
				}
			} catch {
				seqId = null;
			}

			const pickedModel = (reprLoci.loci as StructureElement.Loci).structure
				?.model;
			for (const [id, entry] of entriesRef.current) {
				const s = plugin.state.data.cells.get(entry.transformedRef.ref)?.obj
					?.data;
				if (
					s &&
					(s === (reprLoci.loci as StructureElement.Loci).structure ||
						s.model === pickedModel)
				) {
					return {
						id,
						seqId,
						reprLoci: reprLoci as { loci: StructureElement.Loci },
					};
				}
			}
			return null;
		};

		const getCameraAxes = (): CameraAxes | null => {
			const cam = pluginRef.current?.canvas3d?.camera;
			if (!cam) return null;
			const inv = Mat4.invert(Mat4(), cam.view);
			if (!inv) return null;
			const right = Vec3.normalize(Vec3(), Vec3.create(inv[0], inv[1], inv[2]));
			const up = Vec3.normalize(Vec3(), Vec3.create(inv[4], inv[5], inv[6]));
			return { right, up };
		};

		const handlePointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return;
			const hit = pickAt(event.clientX, event.clientY);

			if (!hit) return;
			const { id: hitId, seqId } = hit;

			event.stopImmediatePropagation();
			event.preventDefault();

			if (event.ctrlKey && selectedIdsRef.current.includes(hitId)) {
				const entry = entriesRef.current.get(hitId);
				dragRef.current = {
					mode: "rotate",
					id: hitId,
					centroid: entry?.centroid
						? Vec3.clone(entry.centroid as Vec3)
						: Vec3.create(0, 0, 0),
					lastX: event.clientX,
					lastY: event.clientY,
				};
				return;
			}

			setSelectedProteinIds([hitId]);
			if (seqId != null) {
				setFocusedResidue(hitId, { seqId });
			}

			const axes = getCameraAxes();
			if (axes) {
				dragRef.current = {
					mode: "translate",
					id: hitId,
					axes,
					lastX: event.clientX,
					lastY: event.clientY,
				};
			}
		};

		const handlePointerMove = async (event: PointerEvent) => {
			const drag = dragRef.current;
			if (!drag) return;
			const plugin = pluginRef.current;
			if (!plugin) return;

			event.stopImmediatePropagation();
			event.preventDefault();

			const dx = event.clientX - drag.lastX;
			const dy = event.clientY - drag.lastY;
			if (dx === 0 && dy === 0) return;

			const entry = entriesRef.current.get(drag.id);
			if (!entry) return;

			if (drag.mode === "rotate") {
				// @ts-expect-error Mol* Mat4 branded type — ArrayLike<number> works at runtime
				applyRotation(entry.mat, drag.centroid, dx * 0.01, dy * 0.01);
			} else {
				const axes = getCameraAxes() ?? drag.axes;
				const scale =
					DRAG_SCALE * (plugin.canvas3d?.camera?.state?.radius ?? 50);
				// @ts-expect-error Mol* Mat4 branded type — ArrayLike<number> works at runtime
				applyTranslation(entry.mat, axes.right, axes.up, dx, dy, scale);
			}

			// @ts-expect-error Mol* Mat4 branded type on entry.mat
			await commitTransform(plugin, entry);
			drag.lastX = event.clientX;
			drag.lastY = event.clientY;
		};

		const handlePointerUp = (event: PointerEvent) => {
			if (dragRef.current) {
				event.stopImmediatePropagation();
				event.preventDefault();
			}
			dragRef.current = null;
		};

		container.addEventListener("pointerdown", handlePointerDown, true);
		window.addEventListener("pointermove", handlePointerMove, true);
		window.addEventListener("pointerup", handlePointerUp, true);

		return () => {
			container.removeEventListener("pointerdown", handlePointerDown, true);
			window.removeEventListener("pointermove", handlePointerMove, true);
			window.removeEventListener("pointerup", handlePointerUp, true);
		};
	}, [
		containerRef,
		pluginRef,
		entriesRef,
		selectedIdsRef,
		setSelectedProteinIds,
		setFocusedResidue,
	]);
}
