import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FastaBar } from "@/components/fasta-bar";

const mockProteinStore = {
	activeProteinId: null,
	proteinsById: {},
	selectedProteinIds: [],
};

const mockLayoutStore = {
	activeTab: null,
	detailsPanelOpen: false,
};

const mockViewerConfigStore = {
	focusedResidueByProtein: {},
	setFocusedResidue: vi.fn(),
};

vi.mock("@/stores/useProteinStore", () => ({
	useProteinStore: (selector) => selector(mockProteinStore),
}));

vi.mock("@/stores/useLayoutStore", () => ({
	useLayoutStore: (selector) => selector(mockLayoutStore),
}));

vi.mock("@/stores/useViewerConfigStore", () => ({
	useViewerConfigStore: (selector) => selector(mockViewerConfigStore),
}));

const mockEditor = {
	focused: false,
	setFocused: vi.fn(),
	selectedIndex: null,
	setSelectedIndex: vi.fn(),
	isPickerOpen: false,
	activeProteinId: null,
	proteinsById: {},
	focusedResidueByProtein: {},
	displaySequence: "",
	canProcess: false,
	canSelect: false,
	showComparison: false,
	isComparison: false,
	validSelectedIds: [],
	draftSequence: "",
	registerApi: vi.fn(),
	scrollAllBy: vi.fn(),
	handleKeyDownCapture: vi.fn(),
	handleKeyDown: vi.fn(),
	handleSelect: vi.fn(),
	handleDeselect: vi.fn(),
	handlePickerAppendLetter: vi.fn(),
	handlePickerDeleteLast: vi.fn(),
	toggleKeyboard: vi.fn(),
	handleSheetOpenChange: vi.fn(),
	handleClearDraft: vi.fn(),
	handleConfirm: vi.fn(),
};

vi.mock("@/components/fasta-bar/hooks/useFastaBarEditor", () => ({
	useFastaBarEditor: () => mockEditor,
}));

vi.mock("@/components/fasta-bar/layout/SingleRowLayout", () => ({
	SingleRowLayout: () => <div data-testid="single-row-layout" />,
}));

vi.mock("@/components/fasta-bar/layout/ComparisonRowsLayout", () => ({
	ComparisonRowsLayout: () => <div data-testid="comparison-rows-layout" />,
}));

vi.mock("@/components/left-sidebar/widgets/AminoAcidGridPicker", () => ({
	AminoAcidGridPicker: () => <div data-testid="amino-acid-picker" />,
}));

describe("FastaBar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLayoutStore.activeTab = null;
		mockLayoutStore.detailsPanelOpen = false;
		mockProteinStore.activeProteinId = null;
		mockProteinStore.proteinsById = {};
		mockProteinStore.selectedProteinIds = [];

		mockEditor.focused = false;
		mockEditor.displaySequence = "";
		mockEditor.showComparison = false;
		mockEditor.validSelectedIds = [];
		mockEditor.draftSequence = "";
	});

	it("renders sequence header by default", () => {
		render(<FastaBar />);

		expect(screen.getByText("Secuencia")).toBeInTheDocument();
		expect(screen.getByTestId("single-row-layout")).toBeInTheDocument();
	});

	it("renders draft editing header when draft exists", () => {
		mockEditor.draftSequence = "MAG";

		render(<FastaBar />);

		expect(screen.getByText("Editando Borrador")).toBeInTheDocument();
	});

	it("renders comparison layout when editor is in comparison mode", () => {
		mockEditor.showComparison = true;
		mockEditor.validSelectedIds = ["p1", "p2"];

		render(<FastaBar />);

		expect(screen.getByText("Comparación")).toBeInTheDocument();
		expect(screen.getByTestId("comparison-rows-layout")).toBeInTheDocument();
	});

	it("uses sidebar-aware margins", () => {
		mockLayoutStore.activeTab = "plus";
		mockLayoutStore.detailsPanelOpen = true;

		render(<FastaBar />);

		expect(screen.getByTestId("fasta-bar")).toHaveStyle({
			marginLeft: "var(--left-sidebar-width, 22rem)",
			marginRight: "var(--right-sidebar-width, 26rem)",
		});
	});

	it("forwards keyboard events to editor handlers", async () => {
		const user = userEvent.setup();
		render(<FastaBar />);

		const root = screen.getByTestId("fasta-bar");
		root.focus();
		await user.keyboard("M");

		expect(mockEditor.handleKeyDown).toHaveBeenCalled();
		expect(mockEditor.handleKeyDownCapture).toHaveBeenCalled();
	});
});
