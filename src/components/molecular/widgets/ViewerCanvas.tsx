import type { RefObject, ReactNode } from "react";
import type { AnalysisMode, TooltipData } from "@/types/molecular";
import ViewerTooltip from "./ViewerTooltip";

const DOT_GRID_STYLE: React.CSSProperties = {
	backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
	backgroundSize: "80px 80px",
};

function getModeBanner(
	analysisMode: AnalysisMode | null,
	pendingCount: number,
): string | null {
	if (analysisMode === "distance") {
		return pendingCount === 0
			? "Modo Medición · Haz clic en el primer átomo"
			: "Modo Medición · Haz clic en el segundo átomo";
	}
	if (analysisMode === "hbonds") {
		return "Puentes de Hidrógeno · Mostrando interacciones no-covalentes";
	}
	return null;
}

interface ViewerCanvasProps {
	containerRef: RefObject<HTMLDivElement | null>;
	tooltip: TooltipData | null;
	hasSelection: boolean;
	analysisMode: AnalysisMode | null;
	pendingCount?: number;
	hasHoverTarget: boolean;
	onExitMode: (() => void) | null;
	children?: ReactNode;
}

export default function ViewerCanvas({
	containerRef,
	tooltip,
	hasSelection,
	analysisMode,
	pendingCount = 0,
	hasHoverTarget,
	onExitMode,
	children,
}: ViewerCanvasProps) {
	const modeBanner = getModeBanner(analysisMode, pendingCount);

	const isTargeting = analysisMode === "distance" && hasHoverTarget;
	const cursorClass = isTargeting
		? "[&_canvas]:!cursor-crosshair cursor-crosshair"
		: "";

	return (
		<div
			data-role="molecular-viewer"
			className={`relative isolate flex h-full min-h-[500px] w-full items-center justify-center bg-white ${cursorClass}`}
		>
			<div
				ref={containerRef}
				className="absolute inset-0 z-0 h-full w-full"
				style={{ minHeight: "500px" }}
			/>

			{!hasSelection && (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 z-[1] flex select-none items-center justify-center duration-700 animate-in fade-in"
				>
					<img
						src="/src/assets/logo.png"
						alt="Camelia Logo"
						className="h-64 w-64 object-contain opacity-[0.07] contrast-125 grayscale md:h-96 md:w-96"
					/>
				</div>
			)}

			<div
				className="pointer-events-none absolute inset-0 z-10 opacity-15"
				style={DOT_GRID_STYLE}
			/>

			<div
				className={`absolute left-1/2 top-3 z-50 -translate-x-1/2 transition-all duration-300 ease-in-out ${
					modeBanner
						? "pointer-events-auto translate-y-0 scale-100 opacity-100"
						: "pointer-events-none -translate-y-2 scale-95 opacity-0"
				}`}
			>
				{modeBanner && (
					<div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-sky-500/40 bg-slate-900/90 px-3.5 py-2 text-xs text-sky-100 shadow-xl backdrop-blur-sm">
						<span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-sky-400" />
						<span>{modeBanner}</span>
						{onExitMode && (
							<button
								onClick={onExitMode}
								className="ml-1.5 flex-shrink-0 leading-none text-sky-400 transition-colors hover:text-white"
								title="Salir del modo (Esc)"
							>
								✕
							</button>
						)}
					</div>
				)}
			</div>

			<div
				className={`pointer-events-none absolute bottom-6 right-6 z-50 transition-all duration-300 ease-in-out ${tooltip ? "translate-x-0 scale-100 opacity-100" : "translate-x-4 scale-95 opacity-0"}`}
			>
				{tooltip && <ViewerTooltip tooltip={tooltip} />}
			</div>

			<div className="relative z-20">{children}</div>
		</div>
	);
}
