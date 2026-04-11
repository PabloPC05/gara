import { CheckCircle2, AlertTriangle, Dna } from 'lucide-react'
import { SectionLabel } from './SectionLabel'
import { TONE_CLASSES } from './Badge'

export function BiologicalStatusCard({ biological }) {
  const isToxic = Boolean(biological.toxicityAlert)

  const statuses = [
    {
      label: 'Solubilidad',
      value: biological.solubilityLabel,
      tone: 'emerald',
      icon: CheckCircle2,
    },
    {
      label: 'Estabilidad',
      value: biological.instabilityLabel,
      tone: 'emerald',
      icon: CheckCircle2,
    },
    {
      label: 'Toxicidad',
      value: biological.toxicityLabel ?? (isToxic ? 'Alerta' : 'Segura'),
      tone: isToxic ? 'rose' : 'emerald',
      icon: isToxic ? AlertTriangle : CheckCircle2,
    },
  ]

  return (
    <section>
      <SectionLabel icon={Dna}>Estado biológico</SectionLabel>
      <div className="flex flex-col gap-2">
        {statuses.map(({ label, value, tone, icon: Icon }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${TONE_CLASSES[tone]}`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            <div className="flex flex-1 items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {label}
              </span>
              <span className="text-[11px] font-black">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
