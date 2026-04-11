import { useEffect, useState } from 'react'
import { Dna, ChevronLeft, ChevronRight } from 'lucide-react'
import { ComparisonColumn } from './ComparisonColumn'

export function ComparisonBody({ proteins, visibleCount = 2 }) {
  const [startIndex, setStartIndex] = useState(0)

  // Si se deselecciona una proteína y el índice queda fuera de rango,
  // lo recortamos para no mostrar columnas vacías.
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

  const prev = () => setStartIndex(Math.max(0, safeStart - 1))
  const next = () => setStartIndex(Math.min(maxStart, safeStart + 1))

  const rangeFrom = safeStart + 1
  const rangeTo = Math.min(safeStart + visibleCount, proteins.length)

  const gridStyle = {
    gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-100 px-7 pt-8 pb-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200/60">
            <Dna className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
            Comparativa
          </span>
        </div>
        <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900">
          {proteins.length} proteínas seleccionadas
        </h2>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {needsNavigation
            ? `Mostrando ${rangeFrom}–${rangeTo} · usa las flechas para navegar`
            : 'Shift + click para añadir más'}
        </p>

        {needsNavigation && (
          <div className="mt-3 flex items-center gap-1.5">
            {proteins.map((_, i) => {
              const isVisible = i >= safeStart && i < safeStart + visibleCount
              return (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-200 ${
                    isVisible ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-200'
                  }`}
                />
              )
            })}
          </div>
        )}
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div
          className="grid h-full divide-x divide-slate-100 overflow-y-auto minimal-scrollbar"
          style={gridStyle}
        >
          {visible.map((protein) => (
            <ComparisonColumn key={protein.id} protein={protein} />
          ))}
        </div>

        {needsNavigation && (
          <>
            <NavButton
              side="left"
              disabled={!canPrev}
              onClick={prev}
              label="Proteína anterior"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </NavButton>
            <NavButton
              side="right"
              disabled={!canNext}
              onClick={next}
              label="Proteína siguiente"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </NavButton>
          </>
        )}
      </div>
    </div>
  )
}

function NavButton({ side, disabled, onClick, label, children }) {
  const position = side === 'left' ? 'left-3' : 'right-3'
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-1/2 ${position} z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-lg backdrop-blur transition hover:border-blue-200 hover:text-blue-600 hover:shadow-xl disabled:pointer-events-none disabled:opacity-0`}
    >
      {children}
    </button>
  )
}
