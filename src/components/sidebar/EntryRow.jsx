const proteinLabel = (protein) =>
  protein?.name ||
  protein?.uniprotId ||
  protein?.pdbId ||
  protein?.id ||
  'Unknown protein'

const proteinMeta = (protein) => {
  const bits = []
  if (protein?.organism && protein.organism !== 'Unknown') bits.push(protein.organism)
  if (protein?.length) bits.push(`${protein.length} aa`)
  if (protein?.uniprotId) bits.push(`UniProt ${protein.uniprotId}`)
  else if (protein?.pdbId) bits.push(`PDB ${protein.pdbId}`)
  return bits.join(' · ')
}

export function EntryRow({ index, protein, isActive, onToggleSelection }) {
  const label = proteinLabel(protein)
  const meta  = proteinMeta(protein)

  return (
    <button
      type="button"
      className={`w-full rounded-2xl border px-3 py-2 text-left transition-colors ${
        isActive
          ? 'border-[#f2b8b9] bg-[#fde8e8]/70 shadow-[0_0_0_2px_rgba(227,30,36,0.12)]'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
      onClick={() => onToggleSelection?.(protein?.id)}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 shrink-0 w-4 text-right text-[9px] font-black tabular-nums select-none transition-colors ${
            isActive ? 'text-[#e31e24]' : 'text-slate-300'
          }`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
            {label}
          </p>
          {meta ? (
            <p className="mt-1 truncate text-[11px] text-slate-500">
              {meta}
            </p>
          ) : (
            <p className="mt-1 truncate text-[11px] text-slate-400">
              {protein?.id}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
