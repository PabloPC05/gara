import React from 'react'
import { Ruler, Trash2 } from 'lucide-react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"
import { useUIStore } from "../../stores/useUIStore"
import useAnalysisStore from "../../stores/useAnalysisStore"

export function ToolsMenu() {
  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer"
  const activeItemClass = `${itemClass} text-white`

  const flexibilityAnimating = useUIStore((s) => s.flexibilityAnimating)
  const toggleFlexibilityAnimation = useUIStore((s) => s.toggleFlexibilityAnimation)

  const analysisMode = useAnalysisStore((s) => s.mode)
  const toggleMode   = useAnalysisStore((s) => s.toggleMode)
  const clearAll     = useAnalysisStore((s) => s.clearAll)

  return (
    <MenubarMenu>
      <MenubarTrigger>Análisis</MenubarTrigger>
      <MenubarContent className="w-72 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">

        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Mediciones
        </MenubarLabel>

        <MenubarItem
          className={`${analysisMode === 'distance' ? activeItemClass : itemClass} flex justify-between items-center`}
          onClick={() => toggleMode('distance')}
        >
          <span className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 shrink-0" />
            Medir Distancias (Å)
          </span>
          {analysisMode === 'distance' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
          )}
        </MenubarItem>

        <MenubarItem
          className={`${itemClass} flex items-center gap-1.5 text-red-400/70 hover:text-red-300`}
          onClick={clearAll}
        >
          <Trash2 className="h-3 w-3 shrink-0" />
          Limpiar Mediciones
        </MenubarItem>

        <MenubarSeparator className="bg-white/10 mx-1 my-1" />

        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Interacciones
        </MenubarLabel>

        <MenubarItem
          className={`${analysisMode === 'hbonds' ? activeItemClass : itemClass} flex justify-between items-center`}
          onClick={() => toggleMode('hbonds')}
        >
          <span>Puentes de Hidrógeno</span>
          {analysisMode === 'hbonds' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
          )}
        </MenubarItem>

        <MenubarSeparator className="bg-white/10 mx-1 my-1" />

        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Simulación
        </MenubarLabel>

        <MenubarItem
          className={`${itemClass} flex justify-between items-center`}
          onClick={toggleFlexibilityAnimation}
        >
          <span>Flexibilidad (pLDDT)</span>
          {flexibilityAnimating && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
          )}
        </MenubarItem>

      </MenubarContent>
    </MenubarMenu>
  )
}
