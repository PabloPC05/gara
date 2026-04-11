import { Plus } from 'lucide-react'

export function AppendEntryButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-300 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-200 text-[11px] font-bold uppercase tracking-widest group disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-300 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
      title={disabled ? 'Introduce un PDB ID o secuencia válida antes de añadir' : 'Añadir entrada'}
    >
      <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
      Añadir
    </button>
  )
}
