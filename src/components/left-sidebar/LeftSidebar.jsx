import React, { useCallback, useEffect, useMemo } from 'react';
import { Sidebar, SidebarContent, useSidebar } from './ui/sidebar.tsx';
import { useProteinStore } from '../stores/useProteinStore';
import { useUIStore } from '../stores/useUIStore';
import { useAminoAcidBuilder } from '../hooks/useAminoAcidBuilder';

// Tab components
import { PlusTabContent } from './sidebar/PlusTabContent.jsx';
import { FilesSection } from './sidebar/FilesSection.jsx';
import { SearchSection } from './sidebar/SearchSection.jsx';
import { AiSection } from './sidebar/AiSection.jsx';
import { SettingsSection } from './sidebar/SettingsSection.jsx';

import { WorkspacePanel } from './sidebar/WorkspacePanel.jsx';

// Extra UI components
import { AminoAcidPicker } from './sidebar/AminoAcidPicker.jsx';

/**
 * Strategy mapping for sidebar tabs.
 */
const TAB_COMPONENTS = {
  plus: PlusTabContent,
  files: FilesSection,
  workspace: WorkspacePanel,
  search: SearchSection,
  ai: AiSection,
  settings: SettingsSection,
};

export function CommandSidebar() {
  const proteinsById = useProteinStore((s) => s.proteinsById);
  const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds);
  const toggleProteinSelection = useProteinStore((s) => s.toggleProteinSelection);

  const activeTab = useUIStore((s) => s.activeTab);
  const { setOpen, open } = useSidebar();

  const {
    isPickerOpen,
    draftSequence,
    handleStartCreateEntry,
    handlePickerOpenChange,
    handleConfirmPicker,
    appendLetter,
    deleteLastLetter,
    clearDraft,
  } = useAminoAcidBuilder();

  const entries = useMemo(() => Object.values(proteinsById), [proteinsById]);

  useEffect(() => {
    if (activeTab === null && open) setOpen(false);
    else if (activeTab !== null && !open) setOpen(true);
  }, [activeTab, open, setOpen]);

  // ── Resize horizontal de la sidebar ──────────────────────────────────
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();

    const wrapper   = document.querySelector('[data-slot="sidebar-wrapper"]');
    const container = document.querySelector('[data-slot="sidebar-container"]');
    const gap       = document.querySelector('[data-slot="sidebar-gap"]');
    if (!wrapper || !container) return;

    const startX     = e.clientX;
    const startWidth = container.getBoundingClientRect().width;
    const MIN_WIDTH  = 200;
    const MAX_WIDTH  = 600;

    // Desactivar transiciones para arrastre fluido
    if (gap) gap.style.transition  = 'none';
    container.style.transition     = 'none';
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev) => {
      const newWidth = Math.min(Math.max(startWidth + ev.clientX - startX, MIN_WIDTH), MAX_WIDTH);
      wrapper.style.setProperty('--sidebar-width', `${newWidth}px`);
      wrapper.style.setProperty('--left-sidebar-width', `${newWidth}px`);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
      if (gap) gap.style.transition = '';
      container.style.transition    = '';
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }, []);

  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

  return (
    <>
      <Sidebar
        collapsible="offcanvas"
        className="border-r border-slate-200 bg-[#fafbfc] dark:bg-[#18181b] dark:border-[#27272a]"
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          {/* Handle de redimensión — arrastra el borde derecho de la sidebar */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-150"
          />
          <SidebarContent className={`px-3 pt-2 pb-3${activeTab === 'ai' ? ' overflow-hidden' : ''}`}>
            {ActiveTabComponent && (
              <ActiveTabComponent
                entries={entries}
                selectedProteinIds={selectedProteinIds}
                onAddEntry={handleStartCreateEntry}
                onToggleProteinSelection={toggleProteinSelection}
              />
            )}
          </SidebarContent>
        </div>
      </Sidebar>

      <AminoAcidPicker
        open={isPickerOpen}
        onOpenChange={handlePickerOpenChange}
        draftSequence={draftSequence}
        onAppendLetter={appendLetter}
        onDeleteLast={deleteLastLetter}
        onClear={clearDraft}
        onConfirm={handleConfirmPicker}
        canConfirm={draftSequence.length > 0}
      />
    </>
  );
}
