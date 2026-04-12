import { Activity, Info, Waves } from 'lucide-react'
import { SectionLabel } from './SectionLabel'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUIStore } from '../../stores/useUIStore'

function getPlddtTone(value) {
  if (value >= 90) return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', ring: 'bg-blue-500', label: 'Muy alta' }
  if (value >= 70) return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', ring: 'bg-sky-400', label: 'Alta' }
  if (value >= 50) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'bg-amber-400', label: 'Moderada' }
  return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', ring: 'bg-orange-500', label: 'Baja' }
}

export function ConfidenceSection({ protein }) {
  const confidence = protein._raw?.structural_data?.confidence
  const plddtMean = confidence?.plddt_mean ?? protein.plddtMean
  const meanPae = confidence?.mean_pae ?? protein.meanPae

  if (plddtMean == null && meanPae == null) return null

  return (
    <section>
      <SectionLabel icon={Activity}>Confianza del modelo</SectionLabel>
      <div className="flex flex-col gap-2">
        {plddtMean != null && (
          <div className="flex items-stretch gap-3">
            <PlddtCard value={plddtMean} />
          </div>
        )}
        <FlexibilityToggle />
        {meanPae != null && (
          <div className="flex items-center gap-3 rounded-none border border-slate-200/60 bg-white/60 backdrop-blur-sm px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-slate-100">
              <Activity className="h-4 w-4 text-slate-500" strokeWidth={2} />
            </div>
            <div className="flex flex-1 items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Error medio PAE
              </span>
              <span className="text-sm font-black tabular-nums text-slate-800">
                {meanPae.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function PlddtCard({ value }) {
  const tone = getPlddtTone(value)
  const pct = Math.min(Math.max(value, 0), 100)

  return (
    <div className={`flex flex-1 items-center gap-3 rounded-none border ${tone.border} ${tone.bg} px-4 py-3 backdrop-blur-sm`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-none ${tone.bg}`}>
        <span className={`h-3 w-3 rounded-none ${tone.ring} shadow-sm`} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              pLDDT medio
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-none text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                  >
                    <Info className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-center text-[11px] leading-relaxed">
                  Score de 0 a 100 que indica la confianza del modelo en la posición local de los aminoácidos.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-black tabular-nums ${tone.text}`}>
              {value.toFixed(1)}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider ${tone.text} opacity-60`}>
              {tone.label}
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-none bg-white/60">
          <div
            className={`h-full rounded-none ${tone.ring} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function FlexibilityToggle() {
  const active = useUIStore((s) => s.flexibilityAnimating)
  const toggle = useUIStore((s) => s.toggleFlexibilityAnimation)

  return (
    <button
      type="button"
      onClick={toggle}
      className={`
        flex items-center gap-2.5 w-full rounded-none border px-4 py-2.5
        backdrop-blur-sm transition-all duration-200 cursor-pointer
        ${active
          ? 'border-orange-300 bg-orange-50 text-orange-700 shadow-sm'
          : 'border-slate-200/60 bg-white/60 text-slate-500 hover:bg-white/80 hover:text-slate-700'
        }
      `}
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-none ${active ? 'bg-orange-100' : 'bg-slate-100'}`}>
        <Waves className={`h-3.5 w-3.5 ${active ? 'text-orange-500' : 'text-slate-400'}`} strokeWidth={2} />
      </div>
      <div className="flex flex-1 items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {active ? 'Simulación activa' : 'Simular Flexibilidad'}
        </span>
        {active && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
        )}
      </div>
    </button>
  )
}
