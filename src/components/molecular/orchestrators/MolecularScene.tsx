import MolecularViewer from "@/components/molecular/sections/MolecularViewer";
import { useProteinStore } from "@/stores/useProteinStore";

interface MolecularSceneProps {
	background: string;
}

export default function MolecularScene({ background }: MolecularSceneProps) {
	const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds);
	const primaryProteinId = selectedProteinIds[0] ?? null;
	const secondaryProteinId = selectedProteinIds[1] ?? null;
	void background;

	if (selectedProteinIds.length === 0) {
		return (
			<div className="relative h-full w-full overflow-hidden">
				<MolecularViewer proteinId={null} />
			</div>
		);
	}

	if (selectedProteinIds.length === 1) {
		return (
			<div className="relative h-full w-full overflow-hidden">
				<MolecularViewer proteinId={primaryProteinId} />
			</div>
		);
	}

	return (
		<div className="grid h-full w-full grid-cols-2 overflow-hidden">
			<div className="relative min-h-0 min-w-0 overflow-hidden">
				<MolecularViewer proteinId={primaryProteinId} />
			</div>

			<div className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-20 w-px bg-slate-300/60" />

			<div className="relative min-h-0 min-w-0 overflow-hidden">
				<MolecularViewer proteinId={secondaryProteinId} />
			</div>
		</div>
	);
}
