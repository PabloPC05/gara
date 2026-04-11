import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useProteinStore } from '../stores/useProteinStore'
import { useUIStore } from '../stores/useUIStore'
import { DrawerBody, ComparisonBody } from './protein-details'

export function ProteinDetailsDrawer() {
  const selectedProteinIds = useProteinStore((state) => state.selectedProteinIds)
  const proteinsById       = useProteinStore((state) => state.proteinsById)
  const clearSelection     = useProteinStore((state) => state.clearSelection)

  const detailsPanelOpen   = useUIStore((s) => s.detailsPanelOpen)
  const setDetailsPanelOpen = useUIStore((s) => s.setDetailsPanelOpen)

  const proteins = selectedProteinIds
    .map((id) => proteinsById[id])
    .filter((protein) => protein && protein.name)

  const hasProteins  = proteins.length > 0
  const isComparison = proteins.length >= 2

  // Auto-abrir el panel cuando se selecciona una proteína
  useEffect(() => {
    if (hasProteins) setDetailsPanelOpen(true)
  }, [hasProteins, setDetailsPanelOpen])

  // Cerrar panel (sin deseleccionar) con Escape
  useEffect(() => {
    if (!detailsPanelOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDetailsPanelOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [detailsPanelOpen, setDetailsPanelOpen])

  const MAX_VISIBLE  = 4
  const visibleCount = isComparison ? Math.min(proteins.length, MAX_VISIBLE) : 1

  const widthStyle = isComparison
    ? { width: `min(${visibleCount * 22}rem, calc(100vw - 4rem))` }
    : { width: '26rem' }

  // Datos del primer proteína para la tira colapsada
  const firstProtein = proteins[0] ?? null
  const pdbFile      = firstProtein?._raw?.structural_data?.pdb_file ?? firstProtein?.pdbData
  const hasPdb       = !!pdbFile

  const handleDownloadPdb = () => {
    if (!pdbFile || !firstProtein) return
    const name = firstProtein._raw?.protein_metadata?.protein_name || firstProtein.name || 'protein'
    const safeName = name.replace(/\s+/g, '_').toLowerCase()
    const blob = new Blob([pdbFile], { type: 'chemical/x-pdb' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${safeName}.pdb`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Nada seleccionado → no renderizar nada
  if (!hasProteins) return null

  return (
    <>
      {/* ── Panel principal deslizante ── */}
      <div
        data-state={detailsPanelOpen ? 'open' : 'closed'}
        style={widthStyle}
        className={[
          'fixed right-6 top-6 bottom-6 z-50 flex flex-col overflow-hidden',
          'rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10',
          'outline-none transition-all duration-200 ease-out',
          'data-[state=closed]:translate-x-full data-[state=closed]:opacity-0',
          'data-[state=open]:translate-x-0 data-[state=open]:opacity-100',
          !detailsPanelOpen ? 'pointer-events-none' : '',
        ].join(' ')}
      >
        {isComparison ? (
          <ComparisonBody proteins={proteins} visibleCount={visibleCount} />
        ) : proteins.length === 1 ? (
          <DrawerBody protein={proteins[0]} />
        ) : null}

        {/* Botón cerrar panel (no deselecciona) */}
        <button
          onClick={() => setDetailsPanelOpen(false)}
          aria-label="Colapsar panel"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700 cursor-pointer z-10"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Tira colapsada (visible cuando hay proteína pero el panel está cerrado) ── */}
      {!detailsPanelOpen && (
        <div className="fixed right-6 top-6 bottom-6 z-50 flex flex-col items-center gap-2 w-12 rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 py-3 px-1.5">
          {/* Botón expandir */}
          <button
            onClick={() => setDetailsPanelOpen(true)}
            aria-label="Expandir panel"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700 cursor-pointer flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>

          {/* Nombre de la proteína en vertical */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <span
              className="text-[10px] font-semibold text-slate-500 tracking-wide select-none"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={firstProtein?.name ?? ''}
            >
              {isComparison
                ? `${proteins.length} proteínas`
                : (firstProtein?.name ?? 'Proteína')}
            </span>
          </div>

          {/* Botón descarga PDB */}
          <button
            onClick={handleDownloadPdb}
            disabled={!hasPdb}
            aria-label="Descargar PDB"
            title="Descargar PDB"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-30 cursor-pointer flex-shrink-0"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>

          {/* Botón deseleccionar */}
          <button
            onClick={() => clearSelection()}
            aria-label="Cerrar y deseleccionar"
            title="Deseleccionar proteína"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 cursor-pointer flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  )
}
