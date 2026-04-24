import {
  Dna, Beaker, ShieldCheck, ArrowLeftRight,
  CircleCheck, TriangleAlert, Activity,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import PaeHeatmap from '@/components/PaeHeatmap'
import { normalizeProtein } from './normalizeProtein'
import { intFmt, num2Fmt } from './formatters'

// ─── Row components ──────────────────────────────────────────────────────

function ComparisonRow({ label, icon: Icon, valA, valB, highlightA, highlightB }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-2 border-b border-slate-100 last:border-b-0">
      <dd className={`text-right text-[12px] font-black tabular-nums ${highlightA || 'text-slate-800'}`}>
        {valA}
      </dd>
      <dt className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
        {Icon && <Icon className="h-3 w-3 text-slate-300" strokeWidth={2} />}
        {label}
      </dt>
      <dd className={`text-[12px] font-black tabular-nums ${highlightB || 'text-slate-800'}`}>
        {valB}
      </dd>
    </div>
  )
}

function StatusComparisonRow({ label, valA, valB, toneA, toneB }) {
  const colorA = toneA === 'ok' ? 'text-emerald-700' : 'text-rose-600'
  const colorB = toneB === 'ok' ? 'text-emerald-700' : 'text-rose-600'
  const dotA = toneA === 'ok' ? 'bg-emerald-400' : 'bg-rose-400'
  const dotB = toneB === 'ok' ? 'bg-emerald-400' : 'bg-rose-400'

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-2.5 border-b border-slate-100 last:border-b-0">
      <dd className={`flex items-center justify-end gap-1.5 text-[11px] font-black ${colorA}`}>
        {valA}
        <span className={`h-2 w-2 rounded-full shrink-0 ${dotA}`} />
      </dd>
      <dt className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap text-center">
        {label}
      </dt>
      <dd className={`flex items-center gap-1.5 text-[11px] font-black ${colorB}`}>
        <span className={`h-2 w-2 rounded-full shrink-0 ${dotB}`} />
        {valB}
      </dd>
    </div>
  )
}

function AlertComparisonRow({ label, alertsA, alertsB }) {
  const hasA = Array.isArray(alertsA) && alertsA.length > 0
  const hasB = Array.isArray(alertsB) && alertsB.length > 0

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-2.5 border-b border-slate-100 last:border-b-0">
      <dd className="flex items-center justify-end gap-1.5">
        {hasA ? (
          <span className="flex items-center gap-1 text-[11px] font-black text-rose-600">
            {alertsA.length} alerta{alertsA.length > 1 ? 's' : ''}
            <TriangleAlert className="h-3 w-3" strokeWidth={2.5} />
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700">
            Sin alertas
            <CircleCheck className="h-3 w-3" strokeWidth={2.5} />
          </span>
        )}
      </dd>
      <dt className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap text-center">
        {label}
      </dt>
      <dd className="flex items-center gap-1.5">
        {hasB ? (
          <span className="flex items-center gap-1 text-[11px] font-black text-rose-600">
            <TriangleAlert className="h-3 w-3" strokeWidth={2.5} />
            {alertsB.length} alerta{alertsB.length > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700">
            <CircleCheck className="h-3 w-3" strokeWidth={2.5} />
            Sin alertas
          </span>
        )}
      </dd>
    </div>
  )
}

function SectionHeader({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
      {Icon && <Icon className="h-3 w-3 text-slate-300" strokeWidth={2.5} />}
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
        {children}
      </span>
    </div>
  )
}

// ─── Derived comparison helpers ──────────────────────────────────────────

function isSoluble(label) {
  return (label ?? '').toLowerCase().includes('soluble')
}

function isStable(label) {
  const lower = (label ?? '').toLowerCase()
  return lower.includes('estable') || lower === 'stable'
}

// ─── Main component ──────────────────────────────────────────────────────

export function CompactComparison({ proteins }) {
  const [pA, pB] = proteins
  const vA = normalizeProtein(pA)
  const vB = normalizeProtein(pB)

  if (!vA || !vB) return null

  const mwKdaA = vA.mwDa != null ? vA.mwDa / 1000 : 0
  const mwKdaB = vB.mwDa != null ? vB.mwDa / 1000 : 0
  const balanceA = (vA.positiveCharges ?? 0) - (vA.negativeCharges ?? 0)
  const balanceB = (vB.positiveCharges ?? 0) - (vB.negativeCharges ?? 0)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 px-6 pt-7 pb-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-none bg-blue-600 text-white shadow-lg shadow-blue-200/60">
            <Dna className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
            Comparativa
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {[vA, vB].map((v, idx) => (
            <div key={v.proteinId ?? idx} className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 truncate">{v.name}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">
                <em>{v.organism}</em> &middot; {v.length ?? '—'} aa
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-black uppercase tracking-widest rounded-none gap-1 font-sans">
                  <span className="opacity-60">UniProt</span>
                  <span>{v.uniprotId ?? '—'}</span>
                </Badge>
                <Badge variant="outline" className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-black uppercase tracking-widest rounded-none gap-1 font-sans">
                  <span className="opacity-60">pLDDT</span>
                  <span>{v.plddtMean?.toFixed(1) ?? '—'}</span>
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Scrollable comparison body */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="pb-6">
          {/* Physical properties */}
          <SectionHeader icon={Beaker}>Propiedades físicas</SectionHeader>
          <div className="mx-4 rounded-none border border-slate-200/60 bg-white/60 backdrop-blur-sm overflow-hidden">
            <ComparisonRow label="Longitud" valA={`${intFmt.format(vA.length ?? 0)} aa`} valB={`${intFmt.format(vB.length ?? 0)} aa`} />
            <ComparisonRow label="Peso mol." valA={`${num2Fmt.format(mwKdaA)} kDa`} valB={`${num2Fmt.format(mwKdaB)} kDa`} />
            {vA.isoelectricPoint != null && vB.isoelectricPoint != null && (
              <ComparisonRow label="pI" valA={num2Fmt.format(vA.isoelectricPoint)} valB={num2Fmt.format(vB.isoelectricPoint)} />
            )}
            <ComparisonRow label="Cargas (+)" valA={intFmt.format(vA.positiveCharges ?? 0)} valB={intFmt.format(vB.positiveCharges ?? 0)} highlightA="text-blue-600" highlightB="text-blue-600" />
            <ComparisonRow label="Cargas (−)" valA={intFmt.format(vA.negativeCharges ?? 0)} valB={intFmt.format(vB.negativeCharges ?? 0)} highlightA="text-rose-500" highlightB="text-rose-500" />
            <ComparisonRow
              label="Balance"
              icon={ArrowLeftRight}
              valA={`${balanceA > 0 ? '+' : ''}${balanceA}`}
              valB={`${balanceB > 0 ? '+' : ''}${balanceB}`}
            />
            <ComparisonRow label="Cisteínas" valA={intFmt.format(vA.cysteines ?? 0)} valB={intFmt.format(vB.cysteines ?? 0)} />
          </div>

          {/* Biological viability */}
          <SectionHeader icon={ShieldCheck}>Viabilidad biológica</SectionHeader>
          <div className="mx-4 rounded-none border border-slate-200/60 bg-white/60 backdrop-blur-sm overflow-hidden">
            <StatusComparisonRow
              label="Solubilidad"
              valA={vA.solubilityLabel ?? '—'}
              valB={vB.solubilityLabel ?? '—'}
              toneA={isSoluble(vA.solubilityLabel) ? 'ok' : 'warn'}
              toneB={isSoluble(vB.solubilityLabel) ? 'ok' : 'warn'}
            />
            <StatusComparisonRow
              label="Estabilidad"
              valA={vA.instabilityLabel ?? '—'}
              valB={vB.instabilityLabel ?? '—'}
              toneA={isStable(vA.instabilityLabel) ? 'ok' : 'warn'}
              toneB={isStable(vB.instabilityLabel) ? 'ok' : 'warn'}
            />
            <AlertComparisonRow label="Toxicidad" alertsA={vA.toxicityAlerts} alertsB={vB.toxicityAlerts} />
            <AlertComparisonRow label="Alergenicidad" alertsA={vA.allergenicityAlerts} alertsB={vB.allergenicityAlerts} />
          </div>

          {/* Structural confidence */}
          <SectionHeader icon={Activity}>Confianza estructural</SectionHeader>
          <div className="mx-4 rounded-none border border-slate-200/60 bg-white/60 backdrop-blur-sm overflow-hidden">
            <ComparisonRow
              label="pLDDT"
              valA={vA.plddtMean?.toFixed(1) ?? '—'}
              valB={vB.plddtMean?.toFixed(1) ?? '—'}
              highlightA={vA.plddtMean >= 90 ? 'text-emerald-700' : vA.plddtMean >= 70 ? 'text-amber-600' : 'text-rose-600'}
              highlightB={vB.plddtMean >= 90 ? 'text-emerald-700' : vB.plddtMean >= 70 ? 'text-amber-600' : 'text-rose-600'}
            />
            <ComparisonRow
              label="PAE medio"
              valA={vA.meanPae != null ? `${num2Fmt.format(vA.meanPae)} Å` : '—'}
              valB={vB.meanPae != null ? `${num2Fmt.format(vB.meanPae)} Å` : '—'}
            />
          </div>

          {/* PAE Heatmaps */}
          {(vA.paeMatrix.length > 0 || vB.paeMatrix.length > 0) && (
            <>
              <SectionHeader>Mapas PAE</SectionHeader>
              <div className="mx-4 grid grid-cols-2 gap-3">
                {[vA, vB].map((v, idx) => (
                  <div key={v.proteinId ?? idx} className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate">
                      {v.name}
                    </span>
                    {v.paeMatrix.length > 0 ? (
                      <PaeHeatmap paeMatrix={v.paeMatrix} meanPae={v.meanPae} compact />
                    ) : (
                      <div className="h-20 flex items-center justify-center border border-dashed border-slate-200 text-[10px] text-slate-400">
                        Sin datos
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Sequences */}
          <SectionHeader icon={Dna}>Secuencias</SectionHeader>
          <div className="mx-4 flex flex-col gap-3">
            {[vA, vB].map((v, idx) => (
              <div key={v.proteinId ?? idx} className="rounded-none border border-slate-200/60 bg-white/60 overflow-hidden">
                <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50/50">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate">
                    {v.name}
                  </span>
                </div>
                <div className="px-3 py-2 max-h-20 overflow-y-auto">
                  <p className="text-[10px] font-mono leading-relaxed text-slate-600 break-all select-all">
                    {v.sequence ?? 'Sin secuencia'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
