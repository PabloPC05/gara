import React from 'react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"
import { useUIStore } from "../../stores/useUIStore"

export function ToolsMenu() {
  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer"
  
  const flexibilityAnimating = useUIStore((s) => s.flexibilityAnimating)
  const toggleFlexibilityAnimation = useUIStore((s) => s.toggleFlexibilityAnimation)

  return (
    <MenubarMenu>
      <MenubarTrigger>Análisis</MenubarTrigger>
      <MenubarContent className="w-80 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Mediciones</MenubarLabel>
        <MenubarItem className={itemClass}>Medir Distancias</MenubarItem>
        <MenubarItem className={itemClass}>Medir Ángulos</MenubarItem>
        <MenubarItem className={itemClass}>Ángulos Diedros (Ramachandran)</MenubarItem>
        
        <MenubarSeparator className="bg-white/10 mx-1 my-1" />
        
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Interacciones</MenubarLabel>
        <MenubarItem className={itemClass}>Detectar Puentes de Hidrógeno</MenubarItem>
        <MenubarItem className={itemClass}>Detectar Interacciones Pi-Pi / Cation-Pi</MenubarItem>
        <MenubarItem className={itemClass}>Calcular Superficie Accesible al Solvente (SASA)</MenubarItem>
        
        <MenubarSeparator className="bg-white/10 mx-1 my-1" />
        
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Alineamiento</MenubarLabel>
        <MenubarItem className={itemClass}>Superponer Estructuras (RMSD)</MenubarItem>
        <MenubarItem className={itemClass}>Alineamiento de Secuencias</MenubarItem>
        
        <MenubarSeparator className="bg-white/10 mx-1 my-1" />

        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Dinámica</MenubarLabel>
        <MenubarItem 
          className={`${itemClass} flex justify-between items-center`}
          onClick={toggleFlexibilityAnimation}
        >
          <span>Simular Flexibilidad</span>
          {flexibilityAnimating && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
          )}
        </MenubarItem>
        
        <MenubarSeparator className="bg-white/10 mx-1 my-1" />
        
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Predicciones / Modelado</MenubarLabel>
        <MenubarItem className={itemClass}>Calcular Potencial Electroestático (APBS)</MenubarItem>
        <MenubarItem className={itemClass}>Simular Mutación (In-silico Mutagenesis)</MenubarItem>
        
        <MenubarSeparator className="bg-white/10 mx-1 my-1" />
        
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Modo de Selección</MenubarLabel>
        <MenubarItem className={itemClass}>Átomos</MenubarItem>
        <MenubarItem className={itemClass}>Residuos</MenubarItem>
        <MenubarItem className={itemClass}>Cadenas</MenubarItem>
        <MenubarItem className={itemClass}>Ligandos/Solvente</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}
