import { useCallback } from "react";

import type { CarouselApi } from "@/components/ui/carousel";

interface UseKeyboardNavigationParams {
	selectedIndex: number | null;
	setSelectedIndex: (pos: number | null) => void;
	displaySequence: string;
	canProcess: boolean;
	canSelect: boolean;
	insertAfterSelected: (letter: string) => void;
	deleteSelected: () => void;
	isValidAA: (key: string) => boolean;

	getActiveApi: () => CarouselApi | undefined;

	isComparison: boolean;

	activeProteinId: string | null;
	proteinsById: Record<string, { sequence?: string; name?: string }>;
	focusedResidueByProtein: Record<string, { seqId: number } | null>;
	setFocusedResidue: (pid: string, residue: { seqId: number } | null) => void;

	draftSequence: string;
	handleConfirmPicker: () => void;
}

export function useKeyboardNavigation({
	selectedIndex,
	setSelectedIndex,
	displaySequence,
	canProcess,
	canSelect,
	insertAfterSelected,
	deleteSelected,
	isValidAA,
	getActiveApi,
	isComparison,
	activeProteinId,
	proteinsById,
	focusedResidueByProtein,
	setFocusedResidue,
	draftSequence,
	handleConfirmPicker,
}: UseKeyboardNavigationParams) {
	const handleArrowInDraftMode = useCallback(
		(e: React.KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const seqLen = displaySequence.length;
			if (seqLen === 0) return;

			let next: number;
			if (selectedIndex === null) {
				next = e.key === "ArrowLeft" ? seqLen - 1 : 0;
			} else {
				next =
					e.key === "ArrowLeft"
						? Math.max(0, selectedIndex - 1)
						: Math.min(seqLen - 1, selectedIndex + 1);
			}
			setSelectedIndex(next);

			const api = getActiveApi();
			if (api) api.scrollTo(next);
		},
		[selectedIndex, displaySequence.length, setSelectedIndex, getActiveApi],
	);

	const handleKeyDownCapture = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
			if (draftSequence.length > 0 && !isComparison)
				return handleArrowInDraftMode(e);
		},
		[draftSequence.length, isComparison, handleArrowInDraftMode],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const target = e.target as HTMLElement;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
			if (isComparison) return;

			if (e.key === "Escape" && selectedIndex !== null) {
				e.preventDefault();
				setSelectedIndex(null);
				return;
			}

			const key = e.key.toUpperCase();
			if (isValidAA(key) && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				insertAfterSelected(key);
				return;
			}

			if (e.key === "Backspace") {
				e.preventDefault();
				deleteSelected();
				return;
			}

			if (e.key === "Enter") {
				e.preventDefault();
				if (canProcess && draftSequence.length > 0) {
					handleConfirmPicker();
					setSelectedIndex(null);
				}
				return;
			}
		},
		[
			isComparison,
			selectedIndex,
			setSelectedIndex,
			isValidAA,
			insertAfterSelected,
			deleteSelected,
			canProcess,
			draftSequence.length,
			handleConfirmPicker,
		],
	);

	return { handleKeyDownCapture, handleKeyDown } as const;
}
