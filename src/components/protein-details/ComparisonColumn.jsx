import { Badge } from '@/components/ui/badge'
import { BiologicalStatusCard } from './BiologicalStatusCard'
import { PhysicalPropertiesCard } from './PhysicalPropertiesCard'
import PaeHeatmap from '@/components/PaeHeatmap'

export function ComparisonColumn({ protein }) {
  const paeMatrix = protein.paeMatrix || protein._raw?.structural_data?.confidence?.pae_matrix || []

  return (
    <div className="flex flex-col gap-4 px-5 py-6 overflow-hidden min-w-0">
      <div>
        <h3 className="text-sm font-black text-slate-900 truncate">{protein.name}</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <em>{protein.organism}</em> · {protein.length ?? '—'} aa
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-black uppercase tracking-widest rounded-none gap-1.5 opacity-100 font-sans">
            <span className="opacity-60">UniProt</span>
            <span>{protein.uniprotId ?? '—'}</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black uppercase tracking-widest rounded-none gap-1.5 opacity-100 font-sans">
            <span className="opacity-60">pLDDT</span>
            <span>{protein.plddtMean?.toFixed(1) ?? '—'}</span>
          </Badge>
        </div>
      </div>
      
      {paeMatrix.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Mapa PAE
          </span>
          <PaeHeatmap paeMatrix={paeMatrix} meanPae={protein.meanPae} compact />
        </div>
      )}

      <BiologicalStatusCard protein={protein} />
      <PhysicalPropertiesCard protein={protein} />
    </div>
  )
}
