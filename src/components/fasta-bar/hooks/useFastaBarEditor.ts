import { useState, useRef, useCallback } from "react";

import { useProteinStore } from "@/stores/useProteinStore";
import { useViewerConfigStore } from "@/stores/useViewerConfigStore";
import { useAminoAcidBuilder } from "@/components/left-sidebar/hooks/useAminoAcidBuilder";
import { useSequenceEditor } from "@/hooks/useSequenceEditor";
import { useCarouselSync } from "@/hooks/useCarouselSync";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

export function useFastaBarEditor() {
	const activeProteinId = useProteinStore((s) => s.activeProteinId);
	const proteinsById = useProteinStore((s) => s.proteinsById);
	const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds);
	const focusedResidueByProtein = useViewerConfigStore(
		(s) => s.focusedResidueByProtein,
	);
	const setFocusedResidue = useViewerConfigStore((s) => s.setFocusedResidue);

	const {
		isPickerOpen,
		draftSequence,
		handlePickerOpenChange,
		handleConfirmPicker,
		appendLetter,
		deleteLastLetter,
		clearDraft,
		setDraftSequence,
	} = useAminoAcidBuilder();

	const [focused, setFocused] = useState(false);
	const ignoreOpenRef = useRef(false);

	// --- Derived state ---

	const protein = activeProteinId ? proteinsById[activeProteinId] : null;
	const proteinSequence: string = protein?.sequence ?? "";

	const validSelectedIds = selectedProteinIds.filter((id: string) => {
		const p = proteinsById[id];
		return p && p.name;
	});
	const isComparison = validSelectedIds.length >= 2;
	const showComparison = isComparison && draftSequence.length === 0;

	// The 1-based seqId of the currently focused residue in view mode
	const viewModeFocusedSeqId =
		activeProteinId && draftSequence.length === 0
			? (focusedResidueByProtein[activeProteinId]?.seqId ?? null)
			: null;

	// --- Residue selection ---

	const handleSelect = useCallback(
		(pid: string, seqId: number) => {
			setFocusedResidue(pid, { seqId });
		},
		[setFocusedResidue],
	);

	const handleDeselect = useCallback(
		(pid: string) => {
			setFocusedResidue(pid, null);
		},
		[setFocusedResidue],
	);

	const clearAllFocusedResidues = useCallback(() => {
		selectedProteinIds.forEach((pid: string) => setFocusedResidue(pid, null));
	}, [selectedProteinIds, setFocusedResidue]);

	// --- Compose specialized hooks ---

	const sequenceEditor = useSequenceEditor({
		activeProteinId,
		proteinSequence,
		draftSequence,
		setDraftSequence,
		appendLetter,
		deleteLastLetter,
		clearAllFocusedResidues,
		viewModeFocusedSeqId,
	});

	const carouselSync = useCarouselSync({
		activeProteinId,
		selectedIndex: sequenceEditor.selectedIndex,
		displaySequence: sequenceEditor.displaySequence,
		draftLength: draftSequence.length,
		canSelect: sequenceEditor.canSelect,
		isComparison,
		validSelectedIds,
		focusedResidueByProtein,
	});

	const keyboard = useKeyboardNavigation({
		selectedIndex: sequenceEditor.selectedIndex,
		setSelectedIndex: sequenceEditor.setSelectedIndex,
		displaySequence: sequenceEditor.displaySequence,
		canProcess: sequenceEditor.canProcess,
		canSelect: sequenceEditor.canSelect,
		insertAfterSelected: sequenceEditor.insertAfterSelected,
		deleteSelected: sequenceEditor.deleteSelected,
		isValidAA: sequenceEditor.isValidAA,
		getActiveApi: carouselSync.getActiveApi,
		isComparison,
		activeProteinId,
		proteinsById,
		focusedResidueByProtein,
		setFocusedResidue,
		draftSequence,
		handleConfirmPicker,
	});

	// --- Picker helpers ---

	const handlePickerAppendLetter = useCallback(
		(letter: string) => {
			sequenceEditor.insertAfterSelected(letter);
		},
		[sequenceEditor.insertAfterSelected],
	);

	const handlePickerDeleteLast = useCallback(() => {
		sequenceEditor.deleteSelected();
	}, [sequenceEditor.deleteSelected]);

	const toggleKeyboard = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (isPickerOpen) {
				ignoreOpenRef.current = true;
				handlePickerOpenChange(false);
				setTimeout(() => {
					ignoreOpenRef.current = false;
				}, 300);
			} else {
				handlePickerOpenChange(true);
			}
		},
		[isPickerOpen, handlePickerOpenChange],
	);

	const handleSheetOpenChange = useCallback(
		(next: boolean) => {
			if (next && ignoreOpenRef.current) return;
			handlePickerOpenChange(next);
		},
		[handlePickerOpenChange],
	);

	const handleClearDraft = useCallback(() => {
		clearDraft();
		sequenceEditor.setSelectedIndex(null);
	}, [clearDraft, sequenceEditor.setSelectedIndex]);

	const handleConfirm = useCallback(() => {
		handleConfirmPicker();
		sequenceEditor.setSelectedIndex(null);
	}, [handleConfirmPicker, sequenceEditor.setSelectedIndex]);

	return {
		// State
		focused,
		setFocused,
		selectedIndex: sequenceEditor.selectedIndex,
		setSelectedIndex: sequenceEditor.setSelectedIndex,
		isPickerOpen,

		// Derived
		activeProteinId,
		proteinsById,
		focusedResidueByProtein,
		displaySequence: sequenceEditor.displaySequence,
		canProcess: sequenceEditor.canProcess,
		canSelect: sequenceEditor.canSelect,
		showComparison,
		isComparison,
		validSelectedIds,
		draftSequence,

		// Carousel
		registerApi: carouselSync.registerApi,
		scrollAllBy: carouselSync.scrollAllBy,

		// Keyboard
		handleKeyDownCapture: keyboard.handleKeyDownCapture,
		handleKeyDown: keyboard.handleKeyDown,

		// Selection
		handleSelect,
		handleDeselect,

		// Picker
		handlePickerAppendLetter,
		handlePickerDeleteLast,
		toggleKeyboard,
		handleSheetOpenChange,
		handleClearDraft,
		handleConfirm,
	} as const;
}
