import { useMemo } from "react";
import { normalizeProtein } from "../utils/normalizeProteinData";
import { IdentityAndTaxonomySection } from "../sections/IdentityAndTaxonomySection";
import { BiologicalFunctionSection } from "../sections/BiologicalFunctionSection";
import { PhysicalPropertiesSection } from "../sections/PhysicalPropertiesSection";
import { PiChargeCalculatorWidget } from "../widgets/PiChargeCalculatorWidget";
import { StructuralConfidenceSection } from "../sections/StructuralConfidenceSection";
import { PaeHeatmapSection } from "../sections/PaeHeatmapSection";
import { BiologicalViabilitySection } from "../sections/BiologicalViabilitySection";
import { KnownPdbStructuresSection } from "../sections/KnownPdbStructuresSection";
import { AminoAcidSequenceSection } from "../sections/AminoAcidSequenceSection";
import { ProteinActionBarSection } from "../sections/ProteinActionBarSection";

export function SingleProteinOrchestrator({ protein }) {
  const v = useMemo(() => normalizeProtein(protein), [protein]);
  if (!v) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        background: "white",
      }}
    >
      <div
        style={{
          flex: "1 1 0%",
          minHeight: 0,
          minWidth: 0,
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            padding: "0 24px 16px 20px",
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
          className="divide-y divide-slate-100"
        >
          <IdentityAndTaxonomySection v={v} />
          <BiologicalFunctionSection v={v} />
          <PhysicalPropertiesSection v={v} />
          <PiChargeCalculatorWidget v={v} />
          <StructuralConfidenceSection v={v} />
          <PaeHeatmapSection v={v} />
          <BiologicalViabilitySection v={v} />
          <KnownPdbStructuresSection v={v} />
          <AminoAcidSequenceSection v={v} />
        </div>
      </div>
      <ProteinActionBarSection protein={protein} v={v} />
    </div>
  );
}
