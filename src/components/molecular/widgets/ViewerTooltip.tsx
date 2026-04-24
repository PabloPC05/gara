import { getAminoAcidInfo } from "@/utils/aminoAcids";
import type { TooltipData } from "@/types/molecular";

function plddtColor(score: string): string {
	const b = parseFloat(score);
	if (b >= 90) return "#0053D6";
	if (b >= 70) return "#65CBF3";
	if (b >= 50) return "#eab308";
	return "#FF7D45";
}

interface ViewerTooltipProps {
	tooltip: TooltipData;
}

export default function ViewerTooltip({ tooltip }: ViewerTooltipProps) {
	const aminoInfo = getAminoAcidInfo(tooltip.code);

	return (
		<div className="pointer-events-none absolute bottom-6 right-6 z-50 translate-x-0 scale-100 opacity-100 transition-all duration-300 ease-in-out">
			<div className="flex min-w-[240px] flex-col gap-3 rounded-none border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md">
				<div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
					<div className="flex flex-col">
						<span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
							Residuo en foco
						</span>
						<span className="mt-0.5 text-[13px] font-bold leading-none text-slate-900">
							{aminoInfo.name}
						</span>
					</div>
					<div className="rounded-none bg-blue-600 px-2 py-1 font-mono text-xs font-bold text-white shadow-sm shadow-blue-200">
						{tooltip.code}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3 text-[11px]">
					<div className="flex flex-col">
						<span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">
							Posición
						</span>
						<span className="font-mono font-bold text-slate-700">
							#{tooltip.seqId}
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">
							Cadena
						</span>
						<span className="font-mono font-bold text-slate-700">
							{tooltip.chainId}
						</span>
					</div>
					<div className="col-span-2 flex flex-col pt-0.5">
						<span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">
							Propiedades
						</span>
						<div className="mt-0.5 flex items-center gap-1.5">
							<div
								className="h-2 w-2 rounded-none shadow-sm"
								style={{ backgroundColor: aminoInfo.color }}
							/>
							<span className="font-semibold text-slate-600">
								{aminoInfo.category}
							</span>
						</div>
					</div>
				</div>

				<div className="border-t border-slate-100 pt-2.5">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
							Confianza pLDDT
						</span>
						<span
							className="text-xs font-black"
							style={{ color: plddtColor(tooltip.plddt) }}
						>
							{tooltip.plddt}%
						</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-none bg-slate-100 shadow-inner">
						<div
							className="h-full shadow-sm transition-all duration-1000 ease-out"
							style={{
								width: `${tooltip.plddt}%`,
								backgroundColor: plddtColor(tooltip.plddt),
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
