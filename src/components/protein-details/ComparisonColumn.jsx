import { Badge } from './Badge'
import { BiologicalStatusCard } from './BiologicalStatusCard'
import { PhysicalPropertiesCard } from './PhysicalPropertiesCard'

export function ComparisonColumn({ protein }) {
  return (
    <div className="flex flex-col gap-4 px-5 py-6">
      <div>
        <h3 className="text-sm font-black text-slate-900">{protein.name}</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <em>{protein.organism}</em> · {protein.length ?? '—'} aa
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="blue" label="UniProt" value={protein.uniprotId ?? '—'} />
          <Badge tone="emerald" label="pLDDT" value={protein.plddtMean?.toFixed(1) ?? '—'} />
        </div>
      </div>
      <BiologicalStatusCard protein={protein} />
      <PhysicalPropertiesCard protein={protein} />
    </div>
  )
}
