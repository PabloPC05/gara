import { render, screen } from "@testing-library/react";
import { ComparisonGridOrchestrator } from "@/components/protein-details/orchestrators/ComparisonGridOrchestrator";

vi.mock("@/components/protein-details/widgets/PaeHeatmapChartWidget", () => ({
	default: () => <div data-testid="pae-heatmap" />,
}));

const makeProteins = (count) =>
	Array.from({ length: count }, (_, i) => ({
		id: `prot-${i}`,
		name: `Protein ${i}`,
		organism: "E. coli",
		length: 100 + i,
	}));

describe("ComparisonGridOrchestrator", () => {
	it("renders header with protein count", () => {
		render(<ComparisonGridOrchestrator proteins={makeProteins(3)} />);
		expect(screen.getByText("3 proteínas seleccionadas")).toBeInTheDocument();
	});

	it("renders all protein names in header", () => {
		render(<ComparisonGridOrchestrator proteins={makeProteins(2)} />);
		expect(screen.getAllByText("Protein 0").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Protein 1").length).toBeGreaterThan(0);
	});

	it("renders physical properties section", () => {
		render(<ComparisonGridOrchestrator proteins={makeProteins(2)} />);
		expect(screen.getByText(/propiedades físicas/i)).toBeInTheDocument();
	});

	it("renders biological viability section", () => {
		render(<ComparisonGridOrchestrator proteins={makeProteins(2)} />);
		expect(screen.getByText(/viabilidad biológica/i)).toBeInTheDocument();
	});

	it("renders structural confidence section", () => {
		render(<ComparisonGridOrchestrator proteins={makeProteins(2)} />);
		expect(screen.getByText(/confianza estructural/i)).toBeInTheDocument();
	});

	it("uses native scroll container (no prev/next buttons)", () => {
		render(<ComparisonGridOrchestrator proteins={makeProteins(4)} />);
		expect(
			screen.queryByLabelText("Proteína anterior"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText("Proteína siguiente"),
		).not.toBeInTheDocument();
	});

	it("returns null with empty proteins", () => {
		const { container } = render(<ComparisonGridOrchestrator proteins={[]} />);
		expect(container.firstChild).toBeNull();
	});
});
