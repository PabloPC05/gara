import { Dna } from 'lucide-react'
import { ComparisonColumn } from './ComparisonColumn'

export function ComparisonBody({ proteins }) {
  const [a, b] = proteins.slice(-2)
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="border-b border-slate-100 px-7 pt-8 pb-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200/60">
            <Dna className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
            Comparativa
          </span>
        </div>
        <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900">
          {a.name} <span className="text-slate-300">vs</span> {b.name}
        </h2>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Shift + click para añadir · {proteins.length} seleccionadas
        </p>
      </header>

      <div className="grid flex-1 grid-cols-2 divide-x divide-slate-100">
        <ComparisonColumn protein={a} />
        <ComparisonColumn protein={b} />
      </div>
    </div>
  )
}
