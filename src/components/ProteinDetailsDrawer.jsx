import { useEffect, useState, useCallback, useRef } from 'react'
import { X, Download, PanelRight } from 'lucide-react'
import { useProteinStore } from '../stores/useProteinStore'
import { useUIStore } from '../stores/useUIStore'
import { DrawerBody, ComparisonBody } from './protein-details'
import ExportDriveButton from './ExportDriveButton'
import { downloadBlob, safeFilename } from './protein-details/formatters'

const MAX_VISIBLE = 4
const SINGLE_WIDTH = 416 // 26rem
const COLLAPSED_WIDTH = 40

export function ProteinDetailsDrawer() {
  const drawerRef = useRef(null)
  const [customWidth, setCustomWidth] = useState(null)

  const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds)
  const proteinsById = useProteinStore((s) => s.proteinsById)
  const clearSelection = useProteinStore((s) => s.clearSelection)
  const detailsPanelOpen = useUIStore((s) => s.detailsPanelOpen)
  const setDetailsPanelOpen = useUIStore((s) => s.setDetailsPanelOpen)

  const proteins = selectedProteinIds.map((id) => proteinsById[id]).filter((p) => p && p.name)
  const hasProteins = proteins.length > 0
  const isComparison = proteins.length >= 2
  const visibleCount = isComparison ? Math.min(proteins.length, MAX_VISIBLE) : 1

  useEffect(() => { if (hasProteins) setDetailsPanelOpen(true) }, [hasProteins, setDetailsPanelOpen])

  useEffect(() => {
    if (!detailsPanelOpen) return
    const h = (e) => { if (e.key === 'Escape') { e.preventDefault(); setDetailsPanelOpen(false) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [detailsPanelOpen, setDetailsPanelOpen])

  // Width calculation
  const defaultWidth = isComparison
    ? Math.min(visibleCount * 352, window.innerWidth - 64)
    : SINGLE_WIDTH
  const drawerWidth = customWidth ?? defaultWidth

  // Propagate current width as CSS variable so FastaBar can read it
  useEffect(() => {
    const wrapper = drawerRef.current?.parentElement
    if (!wrapper) return
    const w = detailsPanelOpen ? drawerWidth : COLLAPSED_WIDTH
    wrapper.style.setProperty('--details-width', `${w}px`)
  }, [detailsPanelOpen, drawerWidth])

  // Resize — imperative DOM updates via style for fluid dragging (same pattern as left sidebar)
  const handleResizeStart = useCallback((e) => {
    e.preventDefault()
    const drawer = drawerRef.current
    if (!drawer) return
    const startX = e.clientX
    const startWidth = drawer.getBoundingClientRect().width
    const MIN_WIDTH = 200
    const MAX_WIDTH = window.innerWidth * 0.8

    drawer.style.transition = 'none'
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const wrapper = drawer.parentElement
    const fastaBar = document.querySelector('[data-slot="fasta-bar"]')
    if (fastaBar) fastaBar.style.transition = 'none'

    const onMove = (ev) => {
      const w = Math.min(Math.max(startWidth + (startX - ev.clientX), MIN_WIDTH), MAX_WIDTH)
      drawer.style.width = `${w}px`
      drawer.style.maxWidth = `${w}px`
      if (wrapper) wrapper.style.setProperty('--details-width', `${w}px`)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setCustomWidth(drawer.getBoundingClientRect().width)
      drawer.style.transition = ''
      if (fastaBar) fastaBar.style.transition = ''
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const firstProtein = proteins[0] ?? null
  const pdbFile = firstProtein?._raw?.structural_data?.pdb_file ?? firstProtein?.pdbData
  const hasPdb = !!pdbFile
  const handleDownloadPdb = () => {
    if (!pdbFile || !firstProtein) return
    const name = firstProtein._raw?.protein_metadata?.protein_name || firstProtein.name || 'protein'
    downloadBlob(pdbFile, `${safeFilename(name)}.pdb`, 'chemical/x-pdb')
  }

  return (
    <>
      {/* Full panel — slides in/out */}
      <div
        ref={drawerRef}
        style={{
          width: drawerWidth,
          maxWidth: drawerWidth,
          transform: detailsPanelOpen ? 'translateX(0)' : `translateX(100%)`,
        }}
        className="absolute right-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out"
      >
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute left-0 top-0 bottom-0 z-50 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors duration-150"
        />

        {hasProteins ? (
          isComparison
            ? <ComparisonBody proteins={proteins} visibleCount={visibleCount} />
            : <DrawerBody protein={proteins[0]} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/50 h-full">
            <div className="mb-4 flex h-16 w-16 items-center justify-center bg-slate-100 text-slate-400"><PanelRight className="h-8 w-8" /></div>
            <h3 className="text-sm font-semibold text-slate-900">Sin selección</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-[180px]">Seleccione una o varias proteínas en el panel izquierdo para ver sus propiedades y análisis.</p>
          </div>
        )}
      </div>

      {/* Collapsed strip — visible when panel is closed */}
      <div
        onClick={() => setDetailsPanelOpen(true)}
        style={{
          width: COLLAPSED_WIDTH,
          opacity: detailsPanelOpen ? 0 : 1,
          pointerEvents: detailsPanelOpen ? 'none' : 'auto',
        }}
        className="absolute right-0 top-0 bottom-0 z-30 flex flex-col items-center gap-2 border-l border-slate-200 bg-white py-4 px-1 cursor-pointer hover:bg-slate-50 transition-opacity duration-300 ease-in-out group"
        title="Expandir detalles"
      >
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <span
            className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 tracking-wide select-none transition-colors"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {hasProteins ? (isComparison ? `${proteins.length} proteínas` : (firstProtein?.name ?? 'Proteína')) : 'Detalles'}
          </span>
        </div>
        {hasProteins && (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <ExportDriveButton proteinData={firstProtein} minimal={true} />
            <button onClick={handleDownloadPdb} disabled={!hasPdb} aria-label="Descargar PDB" title="Descargar PDB" className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-30 cursor-pointer shrink-0">
              <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <button onClick={() => clearSelection()} aria-label="Deseleccionar" title="Deseleccionar proteína" className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 cursor-pointer shrink-0">
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
