import { fireEvent, render, screen } from "@testing-library/react";

import { AminoAcidGridPicker } from "@/components/left-sidebar/widgets/AminoAcidGridPicker";

describe("AminoAcidGridPicker", () => {
	const defaultProps = {
		open: true,
		onOpenChange: vi.fn(),
		onAppendLetter: vi.fn(),
		onDeleteLast: vi.fn(),
		onClear: vi.fn(),
		onConfirm: vi.fn(),
		canConfirm: true,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("appends amino acid letter when clicking a key", () => {
		render(<AminoAcidGridPicker {...defaultProps} />);

		fireEvent.click(screen.getByRole("button", { name: "Gly" }));

		expect(defaultProps.onAppendLetter).toHaveBeenCalledWith("G");
	});

	it("handles Backspace key to delete last residue", () => {
		render(<AminoAcidGridPicker {...defaultProps} />);

		fireEvent.keyDown(screen.getByRole("dialog"), { key: "Backspace" });

		expect(defaultProps.onDeleteLast).toHaveBeenCalledTimes(1);
	});

	it("handles Enter key only when confirmation is enabled", () => {
		const { rerender } = render(<AminoAcidGridPicker {...defaultProps} />);

		fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });
		expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);

		rerender(<AminoAcidGridPicker {...defaultProps} canConfirm={false} />);
		fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });

		expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
	});
});
