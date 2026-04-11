import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../ui/sidebar.tsx'
import { ComparisonRow } from './ComparisonRow'
import { mockPredictionResult } from '../../data/mockData'
import { LABEL_CLASS } from './constants'

export function ProteinComparison({ selectedProteinIds }) {
  if (selectedProteinIds.length !== 2) return null

  // Usamos datos de mockPredictionResult para simular la comparativa
  // En un caso real, buscaríamos los datos de cada proteína por su ID
  const p1 = {
    id: selectedProteinIds[0],
    name: 'Prot A',
    plddt: mockPredictionResult.plddt.mean,
    weight: mockPredictionResult.biological.molecularWeight,
  }
  const p2 = {
    id: selectedProteinIds[1],
    name: 'Prot B',
    plddt: (mockPredictionResult.plddt.mean * 0.95).toFixed(1),
    weight: (mockPredictionResult.biological.molecularWeight * 1.1).toFixed(1),
  }

  return (
    <SidebarGroup className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SidebarGroupLabel className={LABEL_CLASS + ' text-blue-600 mb-2'}>
        Comparativa de Selección
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="bg-white rounded-2xl border border-blue-100 p-3 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-50 pb-2">
            <span className="w-1/3 truncate text-center uppercase">{p1.id}</span>
            <span className="w-1/3 text-center text-blue-300 font-black">VS</span>
            <span className="w-1/3 truncate text-center uppercase">{p2.id}</span>
          </div>

          <ComparisonRow
            label="pLDDT"
            val1={p1.plddt}
            val2={p2.plddt}
            isBetter={(v1, v2) => Number(v1) > Number(v2)}
          />
          <ComparisonRow label="Peso (Da)" val1={p1.weight} val2={p2.weight} />

          <div className="mt-1 pt-2 border-t border-slate-50 flex justify-center">
            <button className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
              Ver Reporte Dual
            </button>
          </div>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
