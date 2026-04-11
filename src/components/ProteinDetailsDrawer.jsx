import { useEffect, useState, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Download, PanelRight } from 'lucide-react'
import { useProteinStore } from '../stores/useProteinStore'
import { useUIStore } from '../stores/useUIStore'
import { DrawerBody, ComparisonBody } from './protein-details'
import ExportDriveButton from './ExportDriveButton'

export function ProteinDetailsDrawer() {
  const drawerRef = useRef(null)
  const [customWidth, setCustomWidth] = useState(null)

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

  const defaultWidth = isComparison
    ? `min(${visibleCount * 22}rem, calc(100vw - 4rem))`
    : '26rem'
    
  const widthStyle = customWidth ? { width: `${customWidth}px` } : { width: defaultWidth }

  // ── Resize horizontal de la sidebar derecha ──────────────────────────────
  const handleResizeStart = useCallback((e) => {
    e.preventDefault()

    const drawer = drawerRef.current
    if (!drawer) return

    const startX = e.clientX
    const startWidth = drawer.getBoundingClientRect().width
    const MIN_WIDTH = 280 // Aumentado el ancho mínimo para evitar colisiones
    const MAX_WIDTH = window.innerWidth * 0.8 // Max 80% of screen

    // Desactivar transiciones para arrastre fluido
    const fastaBar = document.querySelector('[data-slot="fasta-bar"]')
    const originalTransition = drawer.style.transition
    drawer.style.transition = 'none'
    if (fastaBar) fastaBar.style.transition = 'none'
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev) => {
      const deltaX = startX - ev.clientX
      const newWidth = Math.min(Math.max(startWidth + deltaX, MIN_WIDTH), MAX_WIDTH)
      
      drawer.style.width = `${newWidth}px`
      
      const provider = drawer.closest('.flex-1') || document.documentElement
      provider.style.setProperty('--details-sidebar-width', `${newWidth}px`)

      setCustomWidth(newWidth)
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      drawer.style.transition = originalTransition
      if (fastaBar) fastaBar.style.transition = 'margin-left 0.3s ease-in-out, margin-right 0.3s ease-in-out'
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

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

  return (
    <>
      {/* ── Panel principal ── */}
      <div
        ref={drawerRef}
        data-state={detailsPanelOpen ? 'open' : 'closed'}
        style={widthStyle}
        className={[
          'absolute right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden shrink-0',
          'border-l border-slate-200 bg-white shadow-xl',
          'outline-none',
          !customWidth && 'transition-all duration-300 ease-in-out',
          'data-[state=closed]:translate-x-full data-[state=closed]:opacity-0',
          'data-[state=open]:translate-x-0 data-[state=open]:opacity-100',
          !detailsPanelOpen ? 'pointer-events-none' : '',
        ].filter(Boolean).join(' ')}
      >
        {/* Handle de redimensión */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute left-0 top-0 z-50 h-full w-1.5 cursor-col-resize hover:bg-blue-500/50 transition-colors duration-150"
        />
        
        {/* Envoltorio con SCROLL VERTICAL (Aquí estaba el bug) */}
        <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col relative">
          {hasProteins ? (
            <>
              {isComparison ? (
                <ComparisonBody proteins={proteins} visibleCount={visibleCount} />
              ) : (
                <DrawerBody protein={proteins[0]} />
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-none bg-slate-100 text-slate-400">
                <PanelRight className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Sin selección</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-[180px]">
                Seleccione una o varias proteínas en el panel izquierdo para ver sus propiedades y análisis.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Tira colapsada ── */}
      {!detailsPanelOpen && (
        <div 
          onClick={() => setDetailsPanelOpen(true)}
          className="absolute right-0 top-0 bottom-0 z-50 flex flex-col items-center gap-2 w-10 border-l border-slate-200 bg-white shadow-sm py-4 px-1 cursor-pointer hover:bg-slate-50 transition-colors group"
          title="Expandir detalles"
        >
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <span
              className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 tracking-wide select-none transition-colors"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {hasProteins 
                ? (isComparison ? `${proteins.length} proteínas` : (firstProtein?.name ?? 'Proteína'))
                : 'Detalles'}
            </span>
          </div>

          {hasProteins && (
            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <ExportDriveButton 
                proteinData={firstProtein} 
                minimal={true} 
              />

              <button
                onClick={handleDownloadPdb}
                disabled={!hasPdb}
                aria-label="Descargar PDB"
                title="Descargar PDB"
                className="flex h-8 w-8 items-center justify-center rounded-none border border-slate-200 bg-white text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-30 cursor-pointer flex-shrink-0"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>

              <button
                onClick={() => clearSelection()}
                aria-label="Cerrar y deseleccionar"
                title="Deseleccionar proteína"
                className="flex h-8 w-8 items-center justify-center rounded-none border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 cursor-pointer flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}