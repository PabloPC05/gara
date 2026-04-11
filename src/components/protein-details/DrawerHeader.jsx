import { Dna } from 'lucide-react'
import { Badge } from './Badge'

export function DrawerHeader({ protein }) {
  return (
    <header className="border-b border-slate-100 px-7 pt-8 pb-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200/60">
          <Dna className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
          Ficha Proteína
        </span>
      </div>

      <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900">
        {protein.name}
      </h2>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {protein.organism} · {protein.length} aa
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="blue" label="UniProt" value={protein.uniprotId} />
        <Badge tone="emerald" label="pLDDT" value={protein.plddtMean.toFixed(1)} />
      </div>
    </header>
  )
}
