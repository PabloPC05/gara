import { SectionContainerLayout } from "../layout/SectionContainerLayout";
import PaeHeatmapChartWidget from "../widgets/PaeHeatmapChartWidget";

export function PaeHeatmapSection({ v }) {
  if (!v.paeMatrix || v.paeMatrix.length === 0) return null;

  return (
    <SectionContainerLayout title="Mapa de error PAE">
      <div style={{ maxWidth: "100%", overflow: "hidden" }}>
        <PaeHeatmapChartWidget paeMatrix={v.paeMatrix} meanPae={v.meanPae} compact />
      </div>
    </SectionContainerLayout>
  );
}
