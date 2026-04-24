import { SectionContainerLayout } from "../layout/SectionContainerLayout";
import { num2Fmt } from "../utils/dataFormatters";

const PLDDT_BANDS = [
  { min: 90, hex: "#0053D6", label: "Muy alta" },
  { min: 70, hex: "#65CBF3", label: "Alta" },
  { min: 50, hex: "#E7CB30", label: "Moderada" },
  { min: -Infinity, hex: "#FF7D45", label: "Baja" },
];

function getPlddtBand(val) {
  if (val == null) return null;
  return PLDDT_BANDS.find((b) => val >= b.min) ?? null;
}

export function StructuralConfidenceSection({ v }) {
  if (v.plddtMean == null && v.meanPae == null) return null;

  const band = getPlddtBand(v.plddtMean);

  return (
    <SectionContainerLayout title="Confianza estructural">
      <div className="flex flex-col gap-4">
        {v.plddtMean != null && band && (
          <div className="flex items-center gap-1.5">
            <span
              className="h-5 w-1 shrink-0"
              style={{ backgroundColor: band.hex }}
            />
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] text-slate-400">pLDDT</span>
              <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-900">
                {num2Fmt.format(v.plddtMean)}
                <span className="ml-1 text-[9px] font-normal text-slate-400">
                  {band.label}
                </span>
              </span>
            </div>
          </div>
        )}
        {v.meanPae != null && (
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] text-slate-400">PAE medio</span>
            <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-800">
              {num2Fmt.format(v.meanPae)}
              <span className="ml-0.5 text-[9px] font-normal text-slate-400">
                Å
              </span>
            </span>
          </div>
        )}
      </div>
    </SectionContainerLayout>
  );
}
