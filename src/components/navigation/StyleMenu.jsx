import React from 'react'
import { Palette, Ribbon, Circle, Paintbrush, Layers, Sparkles } from 'lucide-react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
  MenubarShortcut,
  MenubarCheckboxItem,
} from "../ui/menubar"

export function StyleMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger>Estilo</MenubarTrigger>
      <MenubarContent className="w-64 bg-[#1e1e22] border border-[#2e2e33] rounded-xl p-1.5 shadow-2xl shadow-black/40">
        <MenubarLabel className="text-slate-500">Representación</MenubarLabel>
        <MenubarCheckboxItem checked className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Ribbon className="h-4 w-4 text-blue-400" /> Cartoon (Cintas)
        </MenubarCheckboxItem>
        <MenubarItem className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Circle className="h-4 w-4 text-violet-400" /> Superficie
        </MenubarItem>
        <MenubarItem className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Layers className="h-4 w-4 text-amber-400" /> Esferas (VDW)
        </MenubarItem>
        <MenubarSeparator className="bg-white/6" />
        <MenubarLabel className="text-slate-500">Coloración</MenubarLabel>
        <MenubarItem className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Paintbrush className="h-4 w-4 text-emerald-400" /> Por Cadena
          <MenubarShortcut>A</MenubarShortcut>
        </MenubarItem>
        <MenubarItem className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Sparkles className="h-4 w-4 text-rose-400" /> Por B-Factor
          <MenubarShortcut>B</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}
