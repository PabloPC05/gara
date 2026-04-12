import React from 'react'
import { Check, FlaskConical } from 'lucide-react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from '../ui/menubar'
import { useUIStore } from '../../stores/useUIStore'
import { BIOCHEMICAL_LENSES } from '../../utils/biochemistry'

const REPR_OPTIONS = [
  { label: 'Cartoon (Cintas)',       value: 'cartoon' },
  { label: 'Superficie (SAS)',        value: 'gaussian-surface' },
  { label: 'Esferas (VDW)',           value: 'spacefill' },
  { label: 'Licorice (Palos y Bolas)',value: 'ball-and-stick' },
  { label: 'Malla (Mesh)',            value: 'molecular-surface' },
]

const DISCOVERY_LENSES = [
  { id: 'electrostatic-charge',          label: 'Carga Electrostática' },
  { id: 'hydrophobicity-kyte-doolittle', label: 'Hidrofobicidad (Kyte-Doolittle)' },
]

export function StyleMenu() {
  const viewerRepresentation    = useUIStore((s) => s.viewerRepresentation)
  const setViewerRepresentation = useUIStore((s) => s.setViewerRepresentation)
  const viewerColorScheme       = useUIStore((s) => s.viewerColorScheme)
  const setViewerColorScheme    = useUIStore((s) => s.setViewerColorScheme)

  const drugDiscoveryMode    = useUIStore((s) => s.drugDiscoveryMode)
  const drugDiscoveryLens    = useUIStore((s) => s.drugDiscoveryLens)
  const toggleDrugDiscovery  = useUIStore((s) => s.toggleDrugDiscovery)
  const setDrugDiscoveryLens = useUIStore((s) => s.setDrugDiscoveryLens)

  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer"
  const activeItemClass = `${itemClass} text-white`

  return (
    <MenubarMenu>
      <MenubarTrigger>Estilo</MenubarTrigger>
      <MenubarContent className="w-72 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">

        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Drug Discovery
        </MenubarLabel>

        <MenubarItem
          className={drugDiscoveryMode ? activeItemClass : itemClass}
          onClick={toggleDrugDiscovery}
        >
          <FlaskConical className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          <span className="flex-1">Superficie Gaussiana</span>
          {drugDiscoveryMode ? (
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">ON</span>
          ) : (
            <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">OFF</span>
          )}
        </MenubarItem>

        {drugDiscoveryMode && (
          <div className="ml-5 mt-0.5 mb-1 flex flex-col gap-0.5">
            {DISCOVERY_LENSES.map(({ id, label }) => (
              <MenubarItem
                key={id}
                className={drugDiscoveryLens === id ? activeItemClass : itemClass}
                onClick={() => setDrugDiscoveryLens(id)}
              >
                <span className="flex-1">{label}</span>
                {drugDiscoveryLens === id && (
                  <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                )}
              </MenubarItem>
            ))}
          </div>
        )}

        <MenubarSeparator className="bg-white/10 mx-1 my-1" />

        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Representación
        </MenubarLabel>

        {REPR_OPTIONS.map(({ label, value }) => (
          <MenubarItem
            key={value}
            className={viewerRepresentation === value ? activeItemClass : itemClass}
            onClick={() => setViewerRepresentation(value)}
          >
            <span className="flex-1">{label}</span>
            {viewerRepresentation === value && (
              <Check className="h-3 w-3 text-blue-400 shrink-0" />
            )}
          </MenubarItem>
        ))}

        <MenubarSeparator className="bg-white/10 mx-1 my-1" />

        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Coloración
        </MenubarLabel>

        {BIOCHEMICAL_LENSES.map(({ id, label }) => (
          <MenubarItem
            key={id}
            className={viewerColorScheme === id ? activeItemClass : itemClass}
            onClick={() => setViewerColorScheme(id)}
          >
            <span className="flex-1">{label}</span>
            {viewerColorScheme === id && (
              <Check className="h-3 w-3 text-blue-400 shrink-0" />
            )}
          </MenubarItem>
        ))}

      </MenubarContent>
    </MenubarMenu>
  )
}
