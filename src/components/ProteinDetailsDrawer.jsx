import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useProteinStore } from '../stores/useProteinStore'
import { DrawerBody, ComparisonBody } from './protein-details'

export function ProteinDetailsDrawer() {
  const selectedProteinIds = useProteinStore((state) => state.selectedProteinIds)
  const proteinsById = useProteinStore((state) => state.proteinsById)
  const clearSelection = useProteinStore((state) => state.clearSelection)

  // Resolvemos cada ID seleccionado contra el catálogo unificado. Si el
  // store aún no tiene la entrada (p.ej. job en curso) la descartamos.
  const proteins = selectedProteinIds
    .map((id) => proteinsById[id])
    .filter((protein) => protein && protein.name)
  
  const isOpen = proteins.length > 0
  const isComparison = proteins.length >= 2

  // Esc → deselecciona todas las proteínas y cierra el drawer.
  // Solo escuchamos cuando hay algo seleccionado para no interferir con
  // otros atajos de la app mientras el drawer está cerrado.
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        clearSelection()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, clearSelection])

  // Cuántas columnas caben en el drawer a la vez. Si el usuario selecciona
  // más, aparecen flechas de navegación dentro del ComparisonBody.
  const MAX_VISIBLE = 4
  const visibleCount = isComparison ? Math.min(proteins.length, MAX_VISIBLE) : 1

  // El drawer crece progresivamente: 22rem por columna para la vista de
  // comparación, con un tope de `calc(100vw - 4rem)` para no salirse de
  // pantalla en viewports estrechos.
  const widthStyle = isComparison
    ? { width: `min(${visibleCount * 22}rem, calc(100vw - 4rem))` }
    : { width: '26rem' }

  // Estado visual derivado de isOpen para la animación manual
  const state = isOpen ? 'open' : 'closed'

  return (
    <div
      data-state={state}
      style={widthStyle}
      className={`fixed right-6 top-6 bottom-6 z-50 flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 outline-none transition-all duration-200 ease-out data-[state=closed]:translate-x-12 data-[state=closed]:opacity-0 data-[state=open]:translate-x-0 data-[state=open]:opacity-100 ${!isOpen ? 'pointer-events-none' : ''}`}
    >
      {isComparison ? (
        <ComparisonBody proteins={proteins} visibleCount={visibleCount} />
      ) : proteins.length === 1 ? (
        <DrawerBody protein={proteins[0]} />
      ) : null}

      <button
        onClick={() => clearSelection()}
        aria-label="Cerrar ficha"
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700 cursor-pointer"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}
