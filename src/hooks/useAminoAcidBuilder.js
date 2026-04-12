import { useState, useCallback } from 'react';
import { loadProteinFromInputWithJobPanel } from '@/lib/proteinLoadService';
import { JOB_PANEL_KEYS } from '@/stores/useJobStatusStore';
import { useProteinStore } from '../stores/useProteinStore';
import { isValidEntry } from './useCommandEntries';

/**
 * Hook to manage the state and logic for the Amino Acid Picker/Builder.
 * @returns {Object} An object containing the picker state and handlers.
 */
export function useAminoAcidBuilder() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [draftSequence, setDraftSequence] = useState('');

  const setSelectedProteinIds = useProteinStore((s) => s.setSelectedProteinIds);

  const handleStartCreateEntry = useCallback(() => {
    if (isPickerOpen) return;
    setDraftSequence('');
    setIsPickerOpen(true);
  }, [isPickerOpen]);

  const handlePickerOpenChange = useCallback((next) => {
    setIsPickerOpen(next);
  }, []);

  const handleConfirmPicker = useCallback(async () => {
    if (!isValidEntry(draftSequence)) return;
    const seq = draftSequence;
    try {
      const loadedId = await loadProteinFromInputWithJobPanel(seq, {
        panelKey: JOB_PANEL_KEYS.aminoBuilder,
      });
      if (loadedId) {
        setSelectedProteinIds([loadedId]);
        setDraftSequence('');
        setIsPickerOpen(false);
      }
    } catch {
      // El panel persistente refleja el estado terminal y permite descartarlo.
    }
  }, [draftSequence, setSelectedProteinIds]);

  const appendLetter = useCallback((letter) => {
    setDraftSequence((prev) => prev + letter);
  }, []);

  const deleteLastLetter = useCallback(() => {
    setDraftSequence((prev) => prev.slice(0, -1));
  }, []);

  const clearDraft = useCallback(() => {
    setDraftSequence('');
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
