import { Badge } from '@/components/ui/badge'
import { BiologicalStatusCard } from './BiologicalStatusCard'
import { PhysicalPropertiesCard } from './PhysicalPropertiesCard'
import { normalizeProtein } from './normalizeProtein'
import PaeHeatmap from '@/components/PaeHeatmap'

export function ComparisonColumn({ protein }) {
  const v = normalizeProtein(protein)
  if (!v) return null

  return (
    <div className="flex flex-col gap-4 px-5 py-6 overflow-hidden">
      <div className="overflow-hidden">
        <h3 className="text-sm font-black text-slate-900 truncate">{v.name}</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <em>{v.organism}</em> · {v.length ?? '—'} aa
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-black uppercase tracking-widest rounded-none gap-1.5 font-sans">
            <span className="opacity-60">UniProt</span>
            <span>{v.uniprotId ?? '—'}</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black uppercase tracking-widest rounded-none gap-1.5 font-sans">
            <span className="opacity-60">pLDDT</span>
            <span>{v.plddtMean?.toFixed(1) ?? '—'}</span>
          </Badge>
        </div>
      </div>

      {v.paeMatrix.length > 0 && (
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Mapa PAE</span>
          <PaeHeatmap paeMatrix={v.paeMatrix} meanPae={v.meanPae} compact />
        </div>
      )}

      <BiologicalStatusCard protein={protein} />
      <PhysicalPropertiesCard protein={protein} />
    </div>
  )
}
