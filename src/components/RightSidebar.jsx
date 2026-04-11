import { useEffect, useMemo } from 'react'
import { PanelRight } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
} from './ui/sidebar.tsx'
import { useProteinStore } from '../stores/useProteinStore'
import { useUIStore } from '../stores/useUIStore'
import { DrawerBody, ComparisonBody } from './protein-details'

const MAX_VISIBLE = 4

export function RightSidebar({ children }) {
  const selectedProteinIds = useProteinStore((state) => state.selectedProteinIds)
  const proteinsById       = useProteinStore((state) => state.proteinsById)
  const clearSelection     = useProteinStore((state) => state.clearSelection)

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
  const sidebarWidth = isComparison
    ? `min(${visibleCount * 22}rem, calc(100vw - 4rem))`
    : '26rem'

  return (
    <SidebarProvider
      open={detailsPanelOpen}
      onOpenChange={setDetailsPanelOpen}
      style={{
        '--sidebar-width': sidebarWidth,
        '--right-sidebar-width': sidebarWidth,
        '--sidebar-width-icon': '0px',
      }}
      className="flex flex-1 min-h-0 w-full"
    >
      {/* Main content (SidebarInset equivalent — rendered via children) */}
      {children}

      {/* Right Sidebar */}
      <Sidebar
        side="right"
        collapsible="offcanvas"
        className="border-l border-white/5 bg-[#0c0c0e] shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.5)]"
      >
        <SidebarContent className="p-0 bg-transparent">
          {hasProteins ? (
            <div className="flex h-full flex-col overflow-hidden">
              {isComparison ? (
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
