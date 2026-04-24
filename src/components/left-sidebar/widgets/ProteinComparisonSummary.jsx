import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
} from "../../ui/sidebar.tsx";
import { ComparisonMetricRow } from "./ComparisonMetricRow";
import { useProteinStore } from "../../../stores/useProteinStore";
import { LABEL_CLASS } from "../utils/constants";

export function ProteinComparisonSummary({ selectedProteinIds }) {
	const proteinsById = useProteinStore((state) => state.proteinsById);

	if (selectedProteinIds.length !== 2) return null;

	const [a, b] = selectedProteinIds.map((id) => proteinsById[id]);
	if (!a || !b) return null;

	const p1 = {
		id: a.id,
		name: a.name,
		plddt: a.plddtMean ?? 0,
		weight: a.biological?.molecularWeight ?? 0,
	};
	const p2 = {
		id: b.id,
		name: b.name,
		plddt: b.plddtMean ?? 0,
		weight: b.biological?.molecularWeight ?? 0,
	};

	return (
		<SidebarGroup className="duration-300 animate-in fade-in slide-in-from-bottom-2">
			<SidebarGroupLabel className={LABEL_CLASS + " mb-2 text-blue-600"}>
				Comparativa de Selección
			</SidebarGroupLabel>
			<SidebarGroupContent>
				<div className="flex flex-col gap-3 rounded-none border border-blue-100 bg-white p-3 shadow-sm">
					<div className="flex items-center justify-between border-b border-slate-50 pb-2 text-[10px] font-bold text-slate-400">
						<span className="w-1/3 truncate text-center uppercase">
							{p1.name}
						</span>
						<span className="w-1/3 text-center font-black text-[#ea7660]">
							VS
						</span>
						<span className="w-1/3 truncate text-center uppercase">
							{p2.name}
						</span>
					</div>

					<ComparisonMetricRow
						label="pLDDT"
						val1={p1.plddt}
						val2={p2.plddt}
						isBetter={(v1, v2) => Number(v1) > Number(v2)}
					/>
					<ComparisonMetricRow
						label="Peso (Da)"
						val1={p1.weight}
						val2={p2.weight}
					/>

					<div className="mt-1 flex justify-center border-t border-slate-50 pt-2">
						<button
							type="button"
							className="text-[9px] font-black uppercase tracking-widest text-[#e31e24] transition-colors hover:text-[#ea7660]"
						>
							Ver Reporte Dual
						</button>
					</div>
				</div>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
