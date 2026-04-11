import React, { useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
  useSidebar,
} from './ui/sidebar.tsx'
import { useCommandEntries } from '../hooks/useCommandEntries'
import { useProteinStore } from '../stores/useProteinStore'
import { useUIStore } from '../stores/useUIStore'
import { EntriesSection } from './sidebar/EntriesSection'
import { StatusFooter } from './sidebar/StatusFooter'
import { ProteinComparison } from './sidebar/ProteinComparison'
import { FilesSection } from './sidebar/FilesSection'
import { SearchSection } from './sidebar/SearchSection'

export function CommandSidebar() {
  const { entries, focusedId, canAppend, updateEntry, appendEntry, focusEntry } =
    useCommandEntries()

  const selectedProteinIds = useProteinStore((state) => state.selectedProteinIds)
  const setSelectedProteinIds = useProteinStore((state) => state.setSelectedProteinIds)
  const toggleProteinSelection = useProteinStore((state) => state.toggleProteinSelection)

  const activeTab = useUIStore((state) => state.activeTab)
  const { setOpen, open } = useSidebar()

  // Sincronizar el estado del sidebar de shadcn con nuestro activeTab
  useEffect(() => {
    if (activeTab === null && open) {
      setOpen(false)
    } else if (activeTab !== null && !open) {
      setOpen(true)
    }
  }, [activeTab, open, setOpen])

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-slate-200 bg-[#fafbfc]"
    >
      <div className="flex h-full w-full flex-col overflow-hidden">
        <SidebarContent className="px-3 pt-5 pb-3">
          {activeTab === 'plus' && (
            <>
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
            </>
          )}

          {activeTab === 'files' && <FilesSection />}
          
          {activeTab === 'search' && <SearchSection />}
        </SidebarContent>

        {activeTab === 'plus' && <StatusFooter count={entries.length} />}
      </div>
    </Sidebar>
  )
}
