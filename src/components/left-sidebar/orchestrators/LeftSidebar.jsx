import React, { useEffect, useMemo } from "react";
import { Sidebar, SidebarContent, useSidebar } from "../../ui/sidebar.tsx";
import { useProteinStore } from "../../../stores/useProteinStore";
import { useLayoutStore } from "../../../stores/useLayoutStore";
import { useAminoAcidBuilder } from "../hooks/useAminoAcidBuilder";
import { useSidebarResize } from "../hooks/useSidebarResize";

// Tab components
import { EntriesTabContent } from "../sections/EntriesTabContent.jsx";
import { FastaJobsSection } from "../sections/FastaJobsSection.jsx";
import { CatalogSearchSection } from "../sections/CatalogSearchSection.jsx";
import { AiAssistantSection } from "../sections/AiAssistantSection.jsx";
import { SettingsSection } from "../sections/SettingsSection.jsx";
import { FileExplorerPanel } from "../sections/FileExplorerPanel.jsx";

import { AminoAcidGridPicker } from "../widgets/AminoAcidGridPicker.jsx";

/**
 * Strategy mapping for sidebar tabs.
 */
const TAB_COMPONENTS = {
  plus: EntriesTabContent,
  files: FastaJobsSection,
  workspace: FileExplorerPanel,
  search: CatalogSearchSection,
  ai: AiAssistantSection,
  settings: SettingsSection,
};

export function LeftSidebar() {
  const proteinsById = useProteinStore((s) => s.proteinsById);
  const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds);
  const toggleProteinSelection = useProteinStore(
    (s) => s.toggleProteinSelection,
  );

  const activeTab = useLayoutStore((s) => s.activeTab);
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

  const { handleResizeStart } = useSidebarResize({
    side: "left",
    minWidth: 300,
    maxWidth: 600,
    cssVars: ["--sidebar-width", "--left-sidebar-width"],
  });

  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

  return (
    <>
      <Sidebar
        collapsible="offcanvas"
        className="border-r border-slate-200 bg-[#fafbfc] dark:border-[#27272a] dark:bg-[#18181b]"
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          {/* Handle de redimensión — arrastra el borde derecho de la sidebar */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors duration-150 hover:bg-slate-300 dark:hover:bg-slate-600"
          />
          <SidebarContent
            className={`px-3 pt-2 pb-3${activeTab === "ai" ? " overflow-hidden" : ""}`}
          >
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

      <AminoAcidGridPicker
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
