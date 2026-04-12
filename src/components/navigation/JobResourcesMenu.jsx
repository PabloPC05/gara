import React, { useState } from 'react'
import { Check, ChevronDown, Cpu } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/useUIStore'
import {
  DEFAULT_JOB_RESOURCES_PRESET_ID,
  JOB_RESOURCE_LIMITS,
  JOB_RESOURCE_PRESETS,
  JOB_RUNTIME_MINUTES_LIMITS,
  formatJobResourcesSummary,
} from '@/lib/jobResources'

function ResourceInput({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = null,
  onChange,
}) {
  const handleChange = (event) => {
    const nextValue = Number(event.target.value)
    if (!Number.isFinite(nextValue)) return
    onChange(nextValue)
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className={cn(
            'h-8 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-sm text-white outline-none transition-colors',
            'focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30',
            suffix ? 'pr-10' : 'pr-2',
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}

export function JobResourcesMenu() {
  const jobResources = useUIStore((state) => state.jobResources)
  const jobResourcesPreset = useUIStore((state) => state.jobResourcesPreset)
  const setJobResourcesPreset = useUIStore((state) => state.setJobResourcesPreset)
  const updateJobResources = useUIStore((state) => state.updateJobResources)
  const [advancedOpen, setAdvancedOpen] = useState(jobResourcesPreset === 'custom')

  const activePreset = JOB_RESOURCE_PRESETS.find((preset) => preset.id === jobResourcesPreset)
  const runtimeMinutes = Math.round(jobResources.max_runtime_seconds / 60)
  const isCustomized = jobResourcesPreset !== DEFAULT_JOB_RESOURCES_PRESET_ID
  const currentTitle = activePreset?.label ?? 'Personalizado'
  const currentDescription = activePreset?.description ?? 'Ajustes manuales para el próximo envío.'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Configurar recursos del próximo job"
          title="Configurar recursos del próximo job"
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-none transition-colors hover:bg-white/10',
            'data-[state=open]:bg-white/10 data-[state=open]:text-white',
            isCustomized ? 'text-blue-400 hover:text-blue-300' : 'text-slate-400 hover:text-white',
          )}
        >
          <Cpu className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[60] w-[340px] rounded-xl border border-white/10 bg-[#111113] p-1.5 text-slate-200 shadow-2xl backdrop-blur-md"
      >
        <div className="px-2 pb-1 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Próximo job
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{currentTitle}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                {currentDescription}
              </p>
            </div>

            <div className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-300">
              {formatJobResourcesSummary(jobResources)}
            </div>
          </div>
        </div>

        <div className="mx-1 my-1 h-px bg-white/10" />

        <div className="px-1 pb-1">
          {JOB_RESOURCE_PRESETS.map((preset) => {
            const selected = preset.id === jobResourcesPreset

            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => setJobResourcesPreset(preset.id)}
                className={cn(
                  'flex w-full flex-col items-start gap-1 rounded-lg px-2 py-2 text-left transition-colors',
                  selected
                    ? 'bg-white/10 ring-1 ring-blue-400/30'
                    : 'hover:bg-white/5',
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">{preset.label}</span>
                  {selected && <Check className="h-3.5 w-3.5 text-blue-400" />}
                </div>
                <span className="text-[11px] leading-relaxed text-slate-400">
                  {preset.description}
                </span>
                <span className="text-[10px] text-slate-500">
                  {formatJobResourcesSummary(preset.resources)}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mx-1 my-1 h-px bg-white/10" />

        <button
          type="button"
          onClick={() => setAdvancedOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
        >
          <div>
            <p className="text-xs font-semibold text-white">Opciones avanzadas</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Ajusta GPUs, CPUs, memoria y tiempo máximo solo si lo necesitas.
            </p>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-slate-500 transition-transform',
              advancedOpen && 'rotate-180',
            )}
          />
        </button>

        {advancedOpen && (
          <div className="px-2 pb-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <ResourceInput
                label="GPUs"
                min={JOB_RESOURCE_LIMITS.gpus.min}
                max={JOB_RESOURCE_LIMITS.gpus.max}
                value={jobResources.gpus}
                onChange={(gpus) => updateJobResources({ gpus })}
              />

              <ResourceInput
                label="CPUs"
                min={JOB_RESOURCE_LIMITS.cpus.min}
                max={JOB_RESOURCE_LIMITS.cpus.max}
                value={jobResources.cpus}
                onChange={(cpus) => updateJobResources({ cpus })}
              />

              <ResourceInput
                label="Memoria"
                min={JOB_RESOURCE_LIMITS.memory_gb.min}
                max={JOB_RESOURCE_LIMITS.memory_gb.max}
                value={jobResources.memory_gb}
                suffix="GB"
                onChange={(memory_gb) => updateJobResources({ memory_gb })}
              />

              <ResourceInput
                label="Tiempo máx."
                min={JOB_RUNTIME_MINUTES_LIMITS.min}
                max={JOB_RUNTIME_MINUTES_LIMITS.max}
                value={runtimeMinutes}
                suffix="min"
                onChange={(minutes) => updateJobResources({
                  max_runtime_seconds: minutes * 60,
                })}
              />
            </div>

            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Límites API: 0–4 GPUs, 1–64 CPUs, 1–256 GB y 1–1440 min. Si cambias un valor manualmente,
              el perfil pasa a personalizado.
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
