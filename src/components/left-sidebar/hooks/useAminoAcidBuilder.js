import { useState, useCallback } from "react";
import { useProteinStore } from "../../../stores/useProteinStore";
import { useProteinLoader } from "./useProteinLoader";
import { isValidEntry } from "../../../hooks/useCommandEntries";

/**
 * Hook to manage the state and logic for the Amino Acid Picker/Builder.
 * @returns {Object} An object containing the picker state and handlers.
 */
export function useAminoAcidBuilder() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [draftSequence, setDraftSequence] = useState("");

  const setSelectedProteinIds = useProteinStore((s) => s.setSelectedProteinIds);
  const clearSelection = useProteinStore((s) => s.clearSelection);
  const { load } = useProteinLoader();

  const handleStartCreateEntry = useCallback(() => {
    if (isPickerOpen) return;
    clearSelection();
    setDraftSequence("");
    setIsPickerOpen(true);
  }, [isPickerOpen, clearSelection]);

  const handlePickerOpenChange = useCallback((next) => {
    setIsPickerOpen(next);
  }, []);

  const handleConfirmPicker = useCallback(async () => {
    if (!isValidEntry(draftSequence)) return;
    const seq = draftSequence;
    setDraftSequence("");
    try {
      const loadedId = await load(seq);
      if (loadedId) setSelectedProteinIds([loadedId]);
    } catch (error) {
      console.error("Failed to load protein entry:", error);
    }
    setIsPickerOpen(false);
  }, [draftSequence, load, setSelectedProteinIds]);

  const appendLetter = useCallback((letter) => {
    setDraftSequence((prev) => prev + letter);
  }, []);

  const deleteLastLetter = useCallback(() => {
    setDraftSequence((prev) => prev.slice(0, -1));
  }, []);

  const clearDraft = useCallback(() => {
    setDraftSequence("");
  }, []);

  return {
    isPickerOpen,
    draftSequence,
    handleStartCreateEntry,
    handlePickerOpenChange,
    handleConfirmPicker,
    appendLetter,
    deleteLastLetter,
    clearDraft,
    setDraftSequence,
  };
}
