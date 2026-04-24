import { useMolecularViewer } from "@/components/molecular/hooks/useMolecularViewer";
import ViewerCanvas from "@/components/molecular/widgets/ViewerCanvas";

interface MolecularViewerProps {
	proteinId: string | null;
}

export default function MolecularViewer({ proteinId }: MolecularViewerProps) {
	const canvasProps = useMolecularViewer(proteinId);

	return (
		<ViewerCanvas {...canvasProps}>
			<div />
		</ViewerCanvas>
	);
}
