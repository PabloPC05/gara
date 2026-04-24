import { useState, useCallback, useEffect } from "react";

import { isValidEntry } from "@/hooks/useCommandEntries";

const VALID_AA = "GAVLIMFWPSTCYNQDEKRH";

interface UseSequenceEditorParams {
  activeProteinId: string | null;
  proteinSequence: string;
  draftSequence: string;
  setDraftSequence: React.Dispatch<React.SetStateAction<string>>;
  appendLetter: (letter: string) => void;
  deleteLastLetter: () => void;
  clearAllFocusedResidues: () => void;
  // 1-based seqId of the currently focused residue in view mode (null if none)
  viewModeFocusedSeqId: number | null;
}

export function useSequenceEditor({
  activeProteinId,
  proteinSequence,
  draftSequence,
  setDraftSequence,
  appendLetter,
  deleteLastLetter,
  clearAllFocusedResidues,
  viewModeFocusedSeqId,
}: UseSequenceEditorParams) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const displaySequence =
    draftSequence.length > 0 ? draftSequence : proteinSequence;
  const canProcess = isValidEntry(displaySequence);
  const canSelect = !!activeProteinId && draftSequence.length === 0;

  // Reset selectedIndex on protein change
  useEffect(() => {
    setSelectedIndex(null);
  }, [activeProteinId]);

  const getBaseSequence = useCallback(
    () => (draftSequence.length > 0 ? draftSequence : proteinSequence),
    [draftSequence, proteinSequence],
  );

  /**
   * Insert a letter after the currently selected amino acid.
   * - selectedIndex !== null  → insert at selectedIndex+1, advance selection
   * - selectedIndex === null, view mode, focusedResidue exists → insert after that residue
   * - otherwise → append at end
   */
  const insertAfterSelected = useCallback(
    (letter: string) => {
      const base = getBaseSequence();

      let insertPos: number;
      if (selectedIndex !== null) {
        insertPos = selectedIndex + 1;
      } else if (draftSequence.length === 0 && viewModeFocusedSeqId !== null) {
        // seqId is 1-based; insert after means index = seqId (0-based slot after)
        insertPos = viewModeFocusedSeqId;
      } else {
        insertPos = base.length;
      }

      const newDraft = base.slice(0, insertPos) + letter + base.slice(insertPos);
      setDraftSequence(newDraft);
      setSelectedIndex(insertPos); // 0-based index of the newly inserted AA
      clearAllFocusedResidues();
    },
    [
      selectedIndex,
      viewModeFocusedSeqId,
      draftSequence.length,
      getBaseSequence,
      setDraftSequence,
      clearAllFocusedResidues,
    ],
  );

  /**
   * Delete the currently selected amino acid (or the last one if nothing selected).
   */
  const deleteSelected = useCallback(() => {
    const base = getBaseSequence();

    if (selectedIndex !== null) {
      const newDraft = base.slice(0, selectedIndex) + base.slice(selectedIndex + 1);
      setDraftSequence(newDraft);
      const newLen = newDraft.length;
      setSelectedIndex(newLen === 0 ? null : Math.min(selectedIndex, newLen - 1));
    } else if (draftSequence.length === 0 && proteinSequence.length > 0) {
      setDraftSequence(proteinSequence.slice(0, -1));
    } else {
      deleteLastLetter();
    }
    clearAllFocusedResidues();
  }, [
    selectedIndex,
    getBaseSequence,
    draftSequence.length,
    proteinSequence,
    setDraftSequence,
    deleteLastLetter,
    clearAllFocusedResidues,
  ]);

  const isValidAA = useCallback((key: string) => {
    return VALID_AA.includes(key) && key.length === 1;
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    displaySequence,
    canProcess,
    canSelect,
    insertAfterSelected,
    deleteSelected,
    isValidAA,
  } as const;
}
