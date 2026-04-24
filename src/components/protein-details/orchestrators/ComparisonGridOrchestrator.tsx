import { useMemo } from "react";
import {
  Dna,
  Beaker,
  ShieldCheck,
  Activity,
  ArrowLeftRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import PaeHeatmapChartWidget from "../widgets/PaeHeatmapChartWidget";
import { normalizeProtein } from "../utils/normalizeProteinData";
import { intFmt, num2Fmt } from "../utils/dataFormatters";
import {
  ComparisonRow,
  StatusComparisonRow,
  AlertComparisonRow,
  SectionHeader,
  isSoluble,
  isStable,
} from "../layout/ComparisonRowLayout";
import type { RawProtein, NormalizedProtein } from "../utils/proteinTypes";

interface ProteinComparisonGridProps {
  proteins: RawProtein[];
}

function plddtColor(plddt: number | null): string {
  if (plddt == null) return "text-slate-400";
  if (plddt >= 90) return "text-emerald-700";
  if (plddt >= 70) return "text-amber-600";
  return "text-rose-600";
}

export function ComparisonGridOrchestrator({
  proteins,
}: ProteinComparisonGridProps) {
  const normalized = useMemo(
    () => proteins.map(normalizeProtein).filter(Boolean) as NormalizedProtein[],
    [proteins],
  );

  if (normalized.length === 0) return null;

  const n = normalized.length;
  const gridStyle = {
    gridTemplateColumns: `12rem repeat(${n}, minmax(10rem, 1fr))`,
  };

  const hasPae = normalized.some((v) => v.paeMatrix.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 px-6 pb-5 pt-7">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-none bg-blue-600 text-white shadow-lg shadow-blue-200/60">
            <Dna className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
            Comparativa
          </span>
        </div>
        <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900">
          {n} proteína{n > 1 ? "s" : ""} seleccionada{n > 1 ? "s" : ""}
        </h2>

        {/* Per-protein badges row */}
        <div className="mt-4 flex flex-wrap gap-3">
          {normalized.map((v, idx) => (
            <div key={v.proteinId ?? idx} className="min-w-0">
              <h3 className="truncate text-sm font-black text-slate-900">
                {v.name}
              </h3>
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <em>{v.organism}</em> &middot; {v.length ?? "—"} aa
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Badge
                  variant="outline"
                  className="gap-1 rounded-none border-blue-100 bg-blue-50 px-2 py-0.5 font-sans text-[9px] font-black uppercase tracking-widest text-blue-700"
                >
                  <span className="opacity-60">UniProt</span>
                  <span>{v.uniprotId ?? "—"}</span>
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1 rounded-none border-emerald-100 bg-emerald-50 px-2 py-0.5 font-sans text-[9px] font-black uppercase tracking-widest text-emerald-700"
                >
                  <span className="opacity-60">pLDDT</span>
                  <span>{v.plddtMean?.toFixed(1) ?? "—"}</span>
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Comparison grid — native horizontal scroll with CSS snap */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="snap-x snap-mandatory overflow-x-auto pb-6">
          <div className="grid min-w-max" style={gridStyle}>
            {/* ── Physical properties ────────────────────────────────── */}
            <SectionHeader icon={Beaker}>Propiedades físicas</SectionHeader>
            <div
              className="mx-4 overflow-hidden rounded-none border border-slate-200/60 bg-white/60 backdrop-blur-sm"
              style={{ gridColumn: "1 / -1" }}
            >
              <div className="grid" style={gridStyle}>
                <ComparisonRow
                  label="Longitud"
                  values={normalized.map((v) => ({
                    text: `${intFmt.format(v.length ?? 0)} aa`,
                  }))}
                />
                <ComparisonRow
                  label="Peso mol."
                  values={normalized.map((v) => ({
                    text: `${num2Fmt.format((v.mwDa ?? 0) / 1000)} kDa`,
                  }))}
                />
                {normalized.some((v) => v.isoelectricPoint != null) && (
                  <ComparisonRow
                    label="pI"
                    values={normalized.map((v) => ({
                      text:
                        v.isoelectricPoint != null
                          ? num2Fmt.format(v.isoelectricPoint)
                          : "—",
                    }))}
                  />
                )}
                <ComparisonRow
                  label="Cargas (+)"
                  values={normalized.map((v) => ({
                    text: intFmt.format(v.positiveCharges ?? 0),
                    highlight: "text-blue-600",
                  }))}
                />
                <ComparisonRow
                  label="Cargas (−)"
                  values={normalized.map((v) => ({
                    text: intFmt.format(v.negativeCharges ?? 0),
                    highlight: "text-rose-500",
                  }))}
                />
                <ComparisonRow
                  label="Balance"
                  icon={ArrowLeftRight}
                  values={normalized.map((v) => {
                    const b =
                      (v.positiveCharges ?? 0) - (v.negativeCharges ?? 0);
                    return { text: `${b > 0 ? "+" : ""}${b}` };
                  })}
                />
                <ComparisonRow
                  label="Cisteínas"
                  values={normalized.map((v) => ({
                    text: intFmt.format(v.cysteines ?? 0),
                  }))}
                />
              </div>
            </div>

            {/* ── Biological viability ───────────────────────────────── */}
            <SectionHeader icon={ShieldCheck}>
              Viabilidad biológica
            </SectionHeader>
            <div
              className="mx-4 overflow-hidden rounded-none border border-slate-200/60 bg-white/60 backdrop-blur-sm"
              style={{ gridColumn: "1 / -1" }}
            >
              <div className="grid" style={gridStyle}>
                <StatusComparisonRow
                  label="Solubilidad"
                  values={normalized.map((v) => ({
                    text: v.solubilityLabel ?? "—",
                    tone: isSoluble(v.solubilityLabel) ? "ok" : "warn",
                  }))}
                />
                <StatusComparisonRow
                  label="Estabilidad"
                  values={normalized.map((v) => ({
                    text: v.instabilityLabel ?? "—",
                    tone: isStable(v.instabilityLabel) ? "ok" : "warn",
                  }))}
                />
                <AlertComparisonRow
                  label="Toxicidad"
                  alerts={normalized.map((v) => v.toxicityAlerts)}
                />
                <AlertComparisonRow
                  label="Alergenicidad"
                  alerts={normalized.map((v) => v.allergenicityAlerts)}
                />
              </div>
            </div>

            {/* ── Structural confidence ──────────────────────────────── */}
            <SectionHeader icon={Activity}>Confianza estructural</SectionHeader>
            <div
              className="mx-4 overflow-hidden rounded-none border border-slate-200/60 bg-white/60 backdrop-blur-sm"
              style={{ gridColumn: "1 / -1" }}
            >
              <div className="grid" style={gridStyle}>
                <ComparisonRow
                  label="pLDDT"
                  values={normalized.map((v) => ({
                    text: v.plddtMean?.toFixed(1) ?? "—",
                    highlight: plddtColor(v.plddtMean),
                  }))}
                />
                <ComparisonRow
                  label="PAE medio"
                  values={normalized.map((v) => ({
                    text:
                      v.meanPae != null
                        ? `${num2Fmt.format(v.meanPae)} Å`
                        : "—",
                  }))}
                />
              </div>
            </div>

            {/* ── PAE heatmaps ───────────────────────────────────────── */}
            {hasPae && (
              <>
                <SectionHeader>Mapas PAE</SectionHeader>
                <div
                  className="mx-4 grid gap-3"
                  style={{
                    gridColumn: "1 / -1",
                    gridTemplateColumns: `repeat(${n}, minmax(8rem, 1fr))`,
                  }}
                >
                  {normalized.map((v, idx) => (
                    <div
                      key={v.proteinId ?? idx}
                      className="flex flex-col gap-1"
                    >
                      <span className="truncate text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        {v.name}
                      </span>
                      {v.paeMatrix.length > 0 ? (
                        <PaeHeatmapChartWidget
                          paeMatrix={v.paeMatrix}
                          meanPae={v.meanPae}
                          compact
                        />
                      ) : (
                        <div className="flex h-20 items-center justify-center border border-dashed border-slate-200 text-[10px] text-slate-400">
                          Sin datos
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Sequences ─────────────────────────────────────────── */}
            <SectionHeader icon={Dna}>Secuencias</SectionHeader>
            <div
              className="mx-4 grid gap-3"
              style={{
                gridColumn: "1 / -1",
                gridTemplateColumns: `repeat(${n}, minmax(8rem, 1fr))`,
              }}
            >
              {normalized.map((v, idx) => (
                <div
                  key={v.proteinId ?? idx}
                  className="overflow-hidden rounded-none border border-slate-200/60 bg-white/60"
                >
                  <div className="border-b border-slate-100 bg-slate-50/50 px-3 py-1.5">
                    <span className="truncate text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {v.name}
                    </span>
                  </div>
                  <div className="max-h-20 overflow-y-auto px-3 py-2">
                    <p className="select-all break-all font-mono text-[10px] leading-relaxed text-slate-600">
                      {v.sequence ?? "Sin secuencia"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
