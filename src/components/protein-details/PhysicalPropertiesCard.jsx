import { Beaker } from 'lucide-react'
import { SectionLabel } from './SectionLabel'

const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })
const decimalFormat = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const integerFormat = new Intl.NumberFormat('es-ES')

export function PhysicalPropertiesCard({ biological }) {
  const properties = [
    {
      label: 'Peso molecular',
      value: `${numberFormat.format(biological.molecularWeight)} Da`,
    },
    {
      label: 'Punto isoeléctrico',
      value: decimalFormat.format(biological.isoelectricPoint),
    },
    {
      label: 'Vida media',
      value: biological.halfLife,
    },
    {
      label: 'Coef. extinción',
      value: `${integerFormat.format(biological.extinctionCoefficient)} M⁻¹cm⁻¹`,
    },
  ]

  return (
    <section>
      <SectionLabel icon={Beaker}>Propiedades físicas</SectionLabel>
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-2">
        <dl className="divide-y divide-slate-100">
          {properties.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-3 py-2.5">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {label}
              </dt>
              <dd className="text-[12px] font-black tabular-nums text-slate-900">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
