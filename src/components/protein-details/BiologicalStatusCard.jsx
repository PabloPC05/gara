import { CircleCheck, TriangleAlert, ShieldCheck, Droplets, Scale, ShieldAlert } from 'lucide-react'
import { SectionLabel } from './SectionLabel'

function StatusRow({ icon: Icon, label, value, score, tone }) {
  const isOk = tone === 'ok'
  return (
    <div
      className={`flex items-center gap-3 rounded-none border px-4 py-3 backdrop-blur-sm ${
        isOk
          ? 'border-emerald-200/60 bg-emerald-50/50'
          : 'border-rose-200/60 bg-rose-50/50'
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-none ${
          isOk ? 'bg-emerald-100' : 'bg-rose-100'
        }`}
      >
        <Icon
          className={`h-4 w-4 ${isOk ? 'text-emerald-600' : 'text-rose-600'}`}
          strokeWidth={2.5}
        />
      </div>
      <div className="flex flex-1 items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {label}
          </span>
          {score != null && (
            <span className="text-[10px] text-slate-500 tabular-nums">
              {typeof score === 'number' ? score.toFixed(1) : score}
            </span>
          )}
        </div>
        <span
          className={`text-[11px] font-black ${
            isOk ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

function AlertsRow({ label, alerts }) {
  const hasAlerts = Array.isArray(alerts) && alerts.length > 0

  if (!hasAlerts) {
    return (
      <div className="flex items-center gap-3 rounded-none border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 backdrop-blur-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-emerald-100">
          <CircleCheck className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
        </div>
        <div className="flex flex-1 items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {label}
          </span>
          <span className="text-[11px] font-black text-emerald-700">Sin alertas</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-none border border-rose-200/60 bg-rose-50/50 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-rose-100">
          <TriangleAlert className="h-4 w-4 text-rose-600" strokeWidth={2.5} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </span>
      </div>
      <ul className="ml-11 flex flex-col gap-1">
        {alerts.map((alert, i) => (
          <li key={i} className="text-[11px] font-medium text-rose-700 leading-relaxed">
            {alert}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BiologicalStatusCard({ protein }) {
  const bio = protein._raw?.biological_data
  const fallbackBio = protein.biological

  const solubilityScore = bio?.solubility_score ?? fallbackBio?.solubility
  const solubilityPrediction = bio?.solubility_prediction ?? fallbackBio?.solubilityLabel ?? 'Desconocida'
  const instabilityIndex = bio?.instability_index ?? fallbackBio?.instabilityIndex
  const stabilityStatus = bio?.stability_status ?? fallbackBio?.instabilityLabel ?? 'Desconocida'
  const toxicityAlerts = bio?.toxicity_alerts ?? (fallbackBio?.toxicityAlert ? [fallbackBio.toxicityLabel] : [])
  const allergenicityAlerts = bio?.allergenicity_alerts ?? []

  const isSoluble = solubilityPrediction.toLowerCase().includes('soluble')
  const isStable = stabilityStatus.toLowerCase().includes('estable') || stabilityStatus.toLowerCase() === 'stable'

  return (
    <section>
      <SectionLabel icon={ShieldCheck}>Viabilidad biológica</SectionLabel>
      <div className="flex flex-col gap-2">
        <StatusRow
          icon={Droplets}
          label="Solubilidad"
          value={solubilityPrediction}
          score={solubilityScore}
          tone={isSoluble ? 'ok' : 'warn'}
        />
        <StatusRow
          icon={Scale}
          label="Estabilidad"
          value={stabilityStatus}
          score={instabilityIndex}
          tone={isStable ? 'ok' : 'warn'}
        />
        <AlertsRow label="Toxicidad" alerts={toxicityAlerts} />
        <AlertsRow label="Alergenicidad" alerts={allergenicityAlerts} />
      </div>
    </section>
  )
}
