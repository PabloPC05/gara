import { CircleCheck, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isSoluble(label: string | null | undefined): boolean {
  return (label ?? "").toLowerCase().includes("soluble");
}

export function isStable(label: string | null | undefined): boolean {
  const lower = (label ?? "").toLowerCase();
  return lower.includes("estable") || lower === "stable";
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function SectionHeader({ icon: Icon, children }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center gap-2 px-4 pb-1.5 pt-4"
      style={{ gridColumn: "1 / -1" }}
    >
      {Icon && <Icon className="h-3 w-3 text-slate-300" strokeWidth={2.5} />}
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
        {children}
      </span>
    </div>
  );
}

// ─── ComparisonRow ────────────────────────────────────────────────────────────

interface ComparisonValue {
  text: string;
  highlight?: string;
}

interface ComparisonRowProps {
  label: string;
  icon?: LucideIcon;
  values: ComparisonValue[];
}

export function ComparisonRow({
  label,
  icon: Icon,
  values,
}: ComparisonRowProps) {
  return (
    <>
      <dt className="sticky left-0 z-10 flex items-center gap-1.5 whitespace-nowrap border-b border-slate-100 bg-white/95 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 backdrop-blur-sm">
        {Icon && (
          <Icon className="h-3 w-3 shrink-0 text-slate-300" strokeWidth={2} />
        )}
        {label}
      </dt>
      {values.map((v, i) => (
        <dd
          key={i}
          className={`border-b border-slate-100 px-4 py-2 text-[12px] font-black tabular-nums ${v.highlight ?? "text-slate-800"}`}
        >
          {v.text}
        </dd>
      ))}
    </>
  );
}

// ─── StatusComparisonRow ──────────────────────────────────────────────────────

interface StatusValue {
  text: string;
  tone: "ok" | "warn";
}

interface StatusComparisonRowProps {
  label: string;
  values: StatusValue[];
}

export function StatusComparisonRow({
  label,
  values,
}: StatusComparisonRowProps) {
  return (
    <>
      <dt className="sticky left-0 z-10 flex items-center whitespace-nowrap border-b border-slate-100 bg-white/95 px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 backdrop-blur-sm">
        {label}
      </dt>
      {values.map((v, i) => {
        const color = v.tone === "ok" ? "text-emerald-700" : "text-rose-600";
        const dot = v.tone === "ok" ? "bg-emerald-400" : "bg-rose-400";
        return (
          <dd
            key={i}
            className={`flex items-center gap-1.5 border-b border-slate-100 px-4 py-2.5 text-[11px] font-black ${color}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
            {v.text}
          </dd>
        );
      })}
    </>
  );
}

// ─── AlertComparisonRow ───────────────────────────────────────────────────────

interface AlertComparisonRowProps {
  label: string;
  alerts: string[][];
}

export function AlertComparisonRow({ label, alerts }: AlertComparisonRowProps) {
  return (
    <>
      <dt className="sticky left-0 z-10 flex items-center whitespace-nowrap border-b border-slate-100 bg-white/95 px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 backdrop-blur-sm">
        {label}
      </dt>
      {alerts.map((proteinAlerts, i) => {
        const hasAlerts =
          Array.isArray(proteinAlerts) && proteinAlerts.length > 0;
        return (
          <dd
            key={i}
            className="flex items-center border-b border-slate-100 px-4 py-2.5"
          >
            {hasAlerts ? (
              <span className="flex items-center gap-1 text-[11px] font-black text-rose-600">
                <TriangleAlert className="h-3 w-3" strokeWidth={2.5} />
                {proteinAlerts.length} alerta
                {proteinAlerts.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700">
                <CircleCheck className="h-3 w-3" strokeWidth={2.5} />
                Sin alertas
              </span>
            )}
          </dd>
        );
      })}
    </>
  );
}
