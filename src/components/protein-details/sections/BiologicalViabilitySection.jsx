import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionContainerLayout } from "../layout/SectionContainerLayout";
import { SingleDataCellLayout } from "../layout/SingleDataCellLayout";
import { num2Fmt } from "../utils/dataFormatters";

function AlertRow({ label, alerts }) {
  const hasAlerts = Array.isArray(alerts) && alerts.length > 0;

  if (!hasAlerts) {
    return (
      <div className="flex items-baseline justify-between py-0.5">
        <span className="text-[11px] text-slate-600">{label}</span>
        <span className="font-mono text-[10px] text-emerald-700">
          sin alertas
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ maxWidth: "100%", overflow: "hidden" }}
      className="flex flex-col gap-1 py-0.5"
    >
      <span className="flex items-center gap-1 text-[11px] text-slate-600">
        <TriangleAlert
          className="h-3 w-3 shrink-0 text-amber-600"
          strokeWidth={2}
        />
        {label}
      </span>
      <div
        style={{ maxWidth: "100%", overflow: "hidden" }}
        className="flex flex-wrap gap-1"
      >
        {alerts.map((alert, i) => (
          <Badge
            key={i}
            variant="outline"
            style={{
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            className="rounded-none border-amber-300 bg-amber-50/60 px-1.5 py-0.5 font-sans text-[10px] font-medium text-amber-700"
          >
            {alert}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function BiologicalViabilitySection({ v }) {
  const hasMetrics = v.solubilityScore != null || v.instabilityIndex != null;
  const hasAlerts =
    v.toxicityAlerts.length > 0 || v.allergenicityAlerts.length > 0;
  if (!hasMetrics && !hasAlerts) return null;

  const solTone =
    v.solubilityScore == null
      ? "text-slate-700"
      : v.solubilityScore > 50
        ? "text-emerald-700"
        : v.solubilityScore < 30
          ? "text-rose-700"
          : "text-amber-700";

  const stabTone =
    v.instabilityIndex == null
      ? "text-slate-700"
      : v.instabilityIndex < 40
        ? "text-emerald-700"
        : "text-rose-700";

  return (
    <SectionContainerLayout title="Viabilidad biológica">
      {hasMetrics && (
        <dl className="flex flex-col divide-y divide-slate-100 border-y border-slate-100">
          {v.solubilityScore != null && (
            <SingleDataCellLayout
              label="Solubilidad"
              value={num2Fmt.format(v.solubilityScore)}
              unit="/100"
              sub={v.solubilityLabel ?? null}
              tone={solTone}
            />
          )}
          {v.instabilityIndex != null && (
            <SingleDataCellLayout
              label="Inestabilidad"
              value={num2Fmt.format(v.instabilityIndex)}
              unit="II"
              sub={v.instabilityLabel ?? null}
              tone={stabTone}
            />
          )}
        </dl>
      )}
      <div className="mt-1.5 flex flex-col gap-0.5">
        <AlertRow label="Toxicidad" alerts={v.toxicityAlerts} />
        <AlertRow label="Alergenicidad" alerts={v.allergenicityAlerts} />
      </div>
    </SectionContainerLayout>
  );
}
