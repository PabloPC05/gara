import React from 'react';
import { SidebarSeparator } from '../ui/sidebar.tsx';
import { EntriesSection } from './EntriesSection';
import { ProteinComparison } from './ProteinComparison';

/**
 * PlusTabContent component - groups the entries and comparison sections for the 'plus' tab.
 * @param {Object} props
 * @param {Array} props.entries - List of loaded proteins.
 * @param {Array} props.selectedProteinIds - IDs of selected proteins.
 * @param {Function} props.onAddEntry - Handler for adding a new entry.
 * @param {Function} props.onToggleProteinSelection - Handler for toggling protein selection.
 */
export function PlusTabContent({
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

      <ProteinComparison selectedProteinIds={selectedProteinIds} />
    </>
  );
}
