import { useEffect, useMemo, useCallback } from 'react'
import { PanelRight } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
} from './ui/sidebar.tsx'
import { useProteinStore } from '../stores/useProteinStore'
import { useUIStore } from '../stores/useUIStore'
import { DrawerBody, ComparisonBody, CompactComparison } from './protein-details'

const MAX_VISIBLE = 4

export function RightSidebar({ children }) {
  const selectedProteinIds = useProteinStore((state) => state.selectedProteinIds)
  const proteinsById       = useProteinStore((state) => state.proteinsById)

  const detailsPanelOpen    = useUIStore((s) => s.detailsPanelOpen)
  const setDetailsPanelOpen = useUIStore((s) => s.setDetailsPanelOpen)

  const proteins = useMemo(
    () =>
      selectedProteinIds
        .map((id) => proteinsById[id])
        .filter((p) => p && p.name),
    [selectedProteinIds, proteinsById],
  )

  const hasProteins  = proteins.length > 0
  const isComparison = proteins.length >= 2
  const visibleCount = isComparison ? Math.min(proteins.length, MAX_VISIBLE) : 1

  // Auto-open the panel when a protein is selected
  useEffect(() => {
    if (hasProteins) setDetailsPanelOpen(true)
  }, [hasProteins, setDetailsPanelOpen])

  // Close panel with Escape
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

  // Dynamic width based on comparison mode
  const defaultWidth = proteins.length === 2
    ? '30rem'
    : isComparison
      ? `min(${visibleCount * 22}rem, calc(100vw - 4rem))`
      : '26rem'

  // ── Resize horizontal de la sidebar derecha ──────────────────────────
  const handleResizeStart = useCallback((e) => {
    e.preventDefault()

    const wrapper = e.target.closest('[data-slot="sidebar-wrapper"]')
    if (!wrapper) return

    const container = wrapper.querySelector('[data-slot="sidebar-container"][data-side="right"]')
    if (!container) return

    const startX     = e.clientX
    const startWidth = container.getBoundingClientRect().width
    const MIN_WIDTH  = 300
    const MAX_WIDTH  = 900

    container.style.transition = 'none'
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev) => {
      const newWidth = Math.min(Math.max(startWidth - (ev.clientX - startX), MIN_WIDTH), MAX_WIDTH)
      const px = `${newWidth}px`
      wrapper.style.setProperty('--sidebar-width', px)
      wrapper.style.setProperty('--right-sidebar-width', px)
      wrapper.style.setProperty('--details-sidebar-width', px)
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
      container.style.transition = ''
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
  }, [])

  return (
    <SidebarProvider
      open={detailsPanelOpen}
      onOpenChange={setDetailsPanelOpen}
      style={{
        '--sidebar-width': defaultWidth,
        '--right-sidebar-width': defaultWidth,
        '--sidebar-width-icon': '0px',
        // Variables consumed by FastaBar for margin coordination
        '--details-sidebar-width': defaultWidth,
        '--details-sidebar-collapsed-width': '2.5rem',
      }}
      className="flex flex-1 min-h-0 w-full"
    >
      {/* Main content (passed via children) */}
      {children}

      {/* Right Sidebar */}
      <Sidebar
        side="right"
        collapsible="offcanvas"
        className="bg-[#0c0c0e]"
        style={{ borderColor: '#27272a' }}
      >
        {/* Handle de redimensión — arrastra el borde izquierdo de la sidebar */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute left-0 top-0 z-50 h-full w-1 cursor-col-resize hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-150"
        />
        <SidebarContent className="p-0 bg-transparent">
          {hasProteins ? (
            <div className="flex h-full flex-col overflow-hidden">
              {proteins.length === 2 ? (
                <CompactComparison proteins={proteins} />
              ) : isComparison ? (
                <ComparisonBody proteins={proteins} visibleCount={visibleCount} />
              ) : (
                <DrawerBody protein={proteins[0]} />
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-transparent">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-sm bg-white/[0.02] border border-white/5 text-slate-700 shadow-inner">
                <PanelRight className="h-8 w-8 opacity-20" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Sin selección</h3>
              <p className="mt-2 text-[10px] text-slate-600 max-w-[180px] font-medium leading-relaxed">
                Seleccione una o varias proteínas en el panel izquierdo para ver sus propiedades y análisis.
              </p>
            </div>
          )}
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
