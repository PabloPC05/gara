import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../ui/sidebar.tsx'
import { ComparisonRow } from './ComparisonRow'
import { useProteinStore } from '../../stores/useProteinStore'
import { LABEL_CLASS } from './constants'

export function ProteinComparison({ selectedProteinIds }) {
  const proteinsById = useProteinStore((state) => state.proteinsById)

  if (selectedProteinIds.length !== 2) return null

  const [a, b] = selectedProteinIds.map((id) => proteinsById[id])
  if (!a || !b) return null

  const p1 = {
    id: a.id,
    name: a.name,
    plddt: a.plddtMean ?? 0,
    weight: a.biological?.molecularWeight ?? 0,
  }
  const p2 = {
    id: b.id,
    name: b.name,
    plddt: b.plddtMean ?? 0,
    weight: b.biological?.molecularWeight ?? 0,
  }

  return (
    <SidebarGroup className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SidebarGroupLabel className={LABEL_CLASS + ' text-blue-600 mb-2'}>
        Comparativa de Selección
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="bg-white rounded-none border border-blue-100 p-3 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-50 pb-2">
            <span className="w-1/3 truncate text-center uppercase">{p1.name}</span>
            <span className="w-1/3 text-center text-[#ea7660] font-black">VS</span>
            <span className="w-1/3 truncate text-center uppercase">{p2.name}</span>
          </div>

          <ComparisonRow
            label="pLDDT"
            val1={p1.plddt}
            val2={p2.plddt}
            isBetter={(v1, v2) => Number(v1) > Number(v2)}
          />
          <ComparisonRow label="Peso (Da)" val1={p1.weight} val2={p2.weight} />

          <div className="mt-1 pt-2 border-t border-slate-50 flex justify-center">
            <button className="text-[9px] font-black uppercase tracking-widest text-[#e31e24] hover:text-[#ea7660] transition-colors">
              Ver Reporte Dual
            </button>
          </div>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
