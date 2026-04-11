import { Dna, ExternalLink, FlaskConical } from 'lucide-react'
import { Badge } from './Badge'

export function DrawerHeader({ protein }) {
  const meta = protein._raw?.protein_metadata
  const name = meta?.protein_name || protein.name
  const organism = meta?.organism || protein.organism
  const uniprotId = meta?.uniprot_id || protein.uniprotId
  const pdbId = meta?.pdb_id || protein.pdbId
  const dataSource = meta?.data_source || (protein.source === 'mock' ? 'Simulación sintética' : 'AlphaFold DB')

  return (
    <header className="border-b border-slate-100 px-7 pt-8 pb-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-none bg-blue-600 text-white shadow-lg shadow-blue-200/60">
          <Dna className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
          Ficha Proteína
        </span>
      </div>

      <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900">
        {name}
      </h2>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <em>{organism}</em> · {protein.length ?? '—'} aa
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {uniprotId && (
          <Badge tone="blue" label="UniProt" value={uniprotId} />
        )}
        {pdbId && (
          <Badge tone="blue" label="PDB" value={pdbId} />
        )}
        <span
          className={`inline-flex items-center gap-1.5 rounded-none border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
            protein.source === 'mock'
              ? 'bg-violet-50 text-violet-700 border-violet-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}
        >
          {protein.source === 'mock' ? (
            <FlaskConical className="h-3 w-3" strokeWidth={2.5} />
          ) : (
            <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
          )}
          {dataSource}
        </span>
      </div>
    </header>
  )
}
