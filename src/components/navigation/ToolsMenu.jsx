import React from 'react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"

export function ToolsMenu() {
  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer"

  return (
    <MenubarMenu>
      <MenubarTrigger>Análisis</MenubarTrigger>
      <MenubarContent className="w-64 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">
        <MenubarItem className={itemClass}>
          Medir Distancias
        </MenubarItem>
        <MenubarItem className={itemClass}>
          Superponer Estructuras
        </MenubarItem>
        <MenubarSeparator className="bg-white/10 mx-1" />
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Modo de Selección</MenubarLabel>
        <MenubarItem className={itemClass}>
          Átomos
        </MenubarItem>
        <MenubarItem className={itemClass}>
          Residuos
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}
