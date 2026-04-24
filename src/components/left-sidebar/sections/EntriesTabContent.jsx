import React from "react";
import { SidebarSeparator } from "../../ui/sidebar.tsx";
import { EntriesSection } from "./EntriesSection";
import { ProteinComparisonSummary } from "../widgets/ProteinComparisonSummary";

export function EntriesTabContent({
  entries,
  selectedProteinIds,
  onAddEntry,
  onToggleProteinSelection,
}) {
  return (
    <>
      <EntriesSection
        entries={entries}
        selectedProteinIds={selectedProteinIds}
        onAddEntry={onAddEntry}
        onToggleProteinSelection={onToggleProteinSelection}
      />

      <SidebarSeparator className="my-4" />

      <ProteinComparisonSummary selectedProteinIds={selectedProteinIds} />
    </>
  );
}
