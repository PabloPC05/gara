import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
  useSidebar,
} from './ui/sidebar.tsx'
import { useProteinStore } from '../stores/useProteinStore'
import { useUIStore } from '../stores/useUIStore'
import { useProteinLoader } from '../hooks/useProteinLoader'
import { isValidEntry } from '../hooks/useCommandEntries'
import { EntriesSection } from './sidebar/EntriesSection'
import { StatusFooter } from './sidebar/StatusFooter'
import { ProteinComparison } from './sidebar/ProteinComparison'
import { FilesSection } from './sidebar/FilesSection'
import { SearchSection } from './sidebar/SearchSection'
import { AiSection } from './sidebar/AiSection'
import { SettingsSection } from './sidebar/SettingsSection'
import { AminoAcidPicker } from './sidebar/AminoAcidPicker'

export function CommandSidebar() {
  const proteinsById           = useProteinStore((s) => s.proteinsById)
  const selectedProteinIds     = useProteinStore((s) => s.selectedProteinIds)
  const setSelectedProteinIds  = useProteinStore((s) => s.setSelectedProteinIds)
  const toggleProteinSelection = useProteinStore((s) => s.toggleProteinSelection)
  const { load } = useProteinLoader()

  const activeTab = useUIStore((s) => s.activeTab)
  const { setOpen, open } = useSidebar()

  // Las entradas activas son las proteínas ya cargadas en el store
  const entries = useMemo(() => Object.values(proteinsById), [proteinsById])

  // ── AminoAcidPicker (constructor visual de secuencias) ────────────────
  const [isPickerOpen,  setIsPickerOpen]  = useState(false)
  const [draftSequence, setDraftSequence] = useState('')

  const handleStartCreateEntry = useCallback(() => {
    if (isPickerOpen) return
    setDraftSequence('')
    setIsPickerOpen(true)
  }, [isPickerOpen])

  const handlePickerOpenChange = useCallback((next) => {
    setIsPickerOpen(next)
    if (!next) setDraftSequence('')
  }, [])

  const handleConfirmPicker = useCallback(async () => {
    if (!isValidEntry(draftSequence)) return
    try {
      const loadedId = await load(draftSequence)
      if (loadedId) setSelectedProteinIds([loadedId])
    } catch (_) {
      // El error queda registrado en errorById del store
    }
    handlePickerOpenChange(false)
  }, [draftSequence, load, setSelectedProteinIds, handlePickerOpenChange])

  // ── Sincronizar sidebar shadcn con activeTab ──────────────────────────
  useEffect(() => {
    if (activeTab === null && open) setOpen(false)
    else if (activeTab !== null && !open) setOpen(true)
  }, [activeTab, open, setOpen])

  return (
    <>
      <Sidebar
        collapsible="offcanvas"
        className="border-r border-slate-200 bg-[#fafbfc] dark:bg-[#18181b] dark:border-[#27272a]"
      >
        <div className="flex h-full w-full flex-col overflow-hidden">
          <SidebarContent className="px-3 pt-5 pb-3">

            {activeTab === 'plus' && (
              <>
                <EntriesSection
                  entries={entries}
                  selectedProteinIds={selectedProteinIds}
                  onAddEntry={handleStartCreateEntry}
                  onToggleProteinSelection={toggleProteinSelection}
                />

                <SidebarSeparator className="my-4" />

                <ProteinComparison selectedProteinIds={selectedProteinIds} />
              </>
            )}

            {activeTab === 'files'    && <FilesSection />}
            {activeTab === 'search'   && <SearchSection />}
            {activeTab === 'ai'       && <AiSection />}
            {activeTab === 'settings' && <SettingsSection />}

          </SidebarContent>

          {activeTab === 'plus' && entries.length > 0 && (
            <StatusFooter count={entries.length} />
          )}
        </div>
      </Sidebar>

      <AminoAcidPicker
        open={isPickerOpen}
        onOpenChange={handlePickerOpenChange}
        draftSequence={draftSequence}
        onAppendLetter={(l) => setDraftSequence((p) => p + l)}
        onDeleteLast={() => setDraftSequence((p) => p.slice(0, -1))}
        onClear={() => setDraftSequence('')}
        onConfirm={handleConfirmPicker}
      />
    </>
  )
}
