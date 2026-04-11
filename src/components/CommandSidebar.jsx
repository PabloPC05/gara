import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
  useSidebar,
} from './ui/sidebar.tsx'
import { useCommandEntries } from '../hooks/useCommandEntries'
import { useProteinStore } from '../stores/useProteinStore'
import { CollapsedPeek } from './sidebar/CollapsedPeek'
import { SidebarBrand } from './sidebar/SidebarBrand'
import { EntriesSection } from './sidebar/EntriesSection'
import { StatusFooter } from './sidebar/StatusFooter'
import { ProteinComparison } from './sidebar/ProteinComparison'

export function CommandSidebar() {
  const { entries, focusedId, canAppend, updateEntry, appendEntry, focusEntry } =
    useCommandEntries()

  const selectedProteinIds = useProteinStore((state) => state.selectedProteinIds)
  const setSelectedProteinIds = useProteinStore((state) => state.setSelectedProteinIds)
  const toggleProteinSelection = useProteinStore((state) => state.toggleProteinSelection)

  const { setOpen } = useSidebar()

  const handleSidebarEnter = () => {
    setOpen(true)
  }

  const handleSidebarLeave = () => {
    setOpen(false)
  }

  return (
    <Sidebar
      collapsible="icon"
      className="relative border-r border-slate-200 bg-[#fafbfc] transition-[width] duration-[140ms] ease-out"
      onMouseEnter={handleSidebarEnter}
      onMouseLeave={handleSidebarLeave}
    >
      {/* Estado colapsado: la flecha rota y se desvanece al expandirse */}
      <CollapsedPeek />

      {/* Estado expandido: entrada suave del contenido */}
      <div className="flex h-full w-full flex-col overflow-hidden opacity-100 translate-x-0 transition-[opacity,transform] duration-[120ms] ease-out will-change-transform group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-translate-x-1">
        <SidebarBrand />

        <SidebarContent className="px-3 pt-5 pb-3">
          <EntriesSection
            entries={entries}
            focusedId={focusedId}
            canAppend={canAppend}
            selectedProteinIds={selectedProteinIds}
            onChangeEntry={updateEntry}
            onFocusEntry={focusEntry}
            onAppend={appendEntry}
            onToggleProteinSelection={toggleProteinSelection}
            onSetSelectedProteinIds={setSelectedProteinIds}
          />

          <SidebarSeparator className="my-4" />

          <ProteinComparison selectedProteinIds={selectedProteinIds} />
        </SidebarContent>

        <StatusFooter count={entries.length} />
      </div>
    </Sidebar>
  )
}
