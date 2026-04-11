import React from 'react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"

export function StyleMenu() {
  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer"
  
  return (
    <MenubarMenu>
      <MenubarTrigger>Estilo</MenubarTrigger>
      <MenubarContent className="w-64 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Representación</MenubarLabel>
        <MenubarItem className={itemClass}>
          Cartoon (Cintas)
        </MenubarItem>
        <MenubarItem className={itemClass}>
          Superficie
        </MenubarItem>
        <MenubarItem className={itemClass}>
          Esferas (VDW)
        </MenubarItem>
        <MenubarSeparator className="bg-white/10 mx-1" />
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Coloración</MenubarLabel>
        <MenubarItem className={itemClass}>
          Por Cadena
        </MenubarItem>
        <MenubarItem className={itemClass}>
          Por B-Factor
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}
