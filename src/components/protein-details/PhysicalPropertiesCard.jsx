import { Beaker, ArrowLeftRight } from 'lucide-react'
import { SectionLabel } from './SectionLabel'

const numFmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })
const intFmt = new Intl.NumberFormat('es-ES')

export function PhysicalPropertiesCard({ protein }) {
  const seqProps = protein._raw?.sequence_properties
  const fallbackBio = protein.biological
  const length = seqProps?.length ?? protein.length ?? 0
  const mwKda = seqProps?.molecular_weight_kda ?? (fallbackBio?.molecularWeight ? fallbackBio.molecularWeight / 1000 : 0)
  const posCharges = seqProps?.positive_charges ?? fallbackBio?.positiveCharges ?? 0
  const negCharges = seqProps?.negative_charges ?? fallbackBio?.negativeCharges ?? 0
  const cysteines = seqProps?.cysteine_residues ?? fallbackBio?.cysteineResidues ?? 0
  const chargeBalance = posCharges - negCharges
  const properties = [
    { label: 'Longitud', value: `${intFmt.format(length)} aa` },
    { label: 'Peso molecular', value: `${numFmt.format(mwKda)} kDa` },
    { label: 'Cargas (+)', value: intFmt.format(posCharges), highlight: 'text-blue-600' },
    { label: 'Cargas (−)', value: intFmt.format(negCharges), highlight: 'text-rose-500' },
    { label: 'Balance neto', value: `${chargeBalance > 0 ? '+' : ''}${chargeBalance}`, icon: ArrowLeftRight },
    { label: 'Cisteínas', value: intFmt.format(cysteines), hint: cysteines > 0 ? 'Posibles puentes S-S' : null },
  ]

  return (
    <section className="overflow-hidden">
      <SectionLabel icon={Beaker}>Propiedades físicas</SectionLabel>
      <div className="border border-slate-200/60 bg-white/60 overflow-hidden">
        <dl>
          {properties.map(({ label, value, highlight, icon: ItemIcon, hint }, i) => (
            <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i < properties.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {ItemIcon && <ItemIcon className="h-3 w-3 text-slate-300" strokeWidth={2} />}
                {label}
              </dt>
              <div className="flex items-center gap-2">
                <dd className={`text-[12px] font-black tabular-nums ${highlight || 'text-slate-800'}`}>{value}</dd>
                {hint && <span className="text-[9px] text-slate-400 font-medium">{hint}</span>}
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
