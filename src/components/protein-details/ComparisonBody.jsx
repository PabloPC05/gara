import { useEffect, useState } from 'react'
import { Dna, ChevronLeft, ChevronRight } from 'lucide-react'
import { ComparisonColumn } from './ComparisonColumn'
import { Button } from '@/components/ui/button'

export function ComparisonBody({ proteins, visibleCount = 2 }) {
  const [startIndex, setStartIndex] = useState(0)

  useEffect(() => {
    const maxStart = Math.max(0, proteins.length - visibleCount)
    if (startIndex > maxStart) setStartIndex(maxStart)
  }, [proteins.length, visibleCount, startIndex])

  const maxStart = Math.max(0, proteins.length - visibleCount)
  const safeStart = Math.min(startIndex, maxStart)
  const visible = proteins.slice(safeStart, safeStart + visibleCount)
  const canPrev = safeStart > 0
  const canNext = safeStart < maxStart
  const needsNavigation = proteins.length > visibleCount
  const rangeFrom = safeStart + 1
  const rangeTo = Math.min(safeStart + visibleCount, proteins.length)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-100 px-7 pt-8 pb-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-blue-600 text-white shadow-lg shadow-blue-200/60">
            <Dna className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Comparativa</span>
        </div>
        <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900">
          {proteins.length} proteínas seleccionadas
        </h2>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {needsNavigation ? `Mostrando ${rangeFrom}–${rangeTo} · usa las flechas para navegar` : 'Shift + click para añadir más'}
        </p>
        {needsNavigation && (
          <div className="mt-3 flex items-center gap-1.5">
            {proteins.map((_, i) => (
              <span key={i} className={`h-1 transition-all duration-200 ${i >= safeStart && i < safeStart + visibleCount ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-200'}`} />
            ))}
          </div>
        )}
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex w-max divide-x divide-slate-100" style={{ gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))` }}>
          {visible.map((protein) => (
            <div key={protein.id} className="min-w-[200px] flex-1">
              <ComparisonColumn protein={protein} />
            </div>
          ))}
        </div>
        {needsNavigation && (
          <>
            <NavButton side="left" disabled={!canPrev} onClick={() => setStartIndex(Math.max(0, safeStart - 1))} label="Anterior">
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </NavButton>
            <NavButton side="right" disabled={!canNext} onClick={() => setStartIndex(Math.min(maxStart, safeStart + 1))} label="Siguiente">
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </NavButton>
          </>
        )}
      </div>
    </div>
  )
}

function NavButton({ side, disabled, onClick, label, children }) {
  return (
    <Button
      variant="outline" size="icon" aria-label={label} disabled={disabled} onClick={onClick}
      className={`absolute top-1/2 ${side === 'left' ? 'left-3' : 'right-3'} z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-slate-200 bg-white/90 text-slate-500 shadow-lg backdrop-blur hover:border-blue-200 hover:text-blue-600 hover:bg-white`}
    >
      {children}
    </Button>
  )
}
