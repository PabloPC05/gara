import React from 'react'
import { Ruler, Layers, Crosshair, Atom, Hexagon } from 'lucide-react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
  MenubarShortcut,
  MenubarRadioGroup,
  MenubarRadioItem,
} from "../ui/menubar"

export function ToolsMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger>Análisis</MenubarTrigger>
      <MenubarContent className="w-64 bg-[#1e1e22] border border-[#2e2e33] rounded-xl p-1.5 shadow-2xl shadow-black/40">
        <MenubarItem className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Ruler className="h-4 w-4 text-sky-400" /> Medir Distancias
          <MenubarShortcut>M</MenubarShortcut>
        </MenubarItem>
        <MenubarItem className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Layers className="h-4 w-4 text-indigo-400" /> Superponer Estructuras
          <MenubarShortcut>S</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator className="bg-white/6" />
        <MenubarLabel className="text-slate-500">Modo de Selección</MenubarLabel>
        <MenubarRadioGroup value="residues">
          <MenubarRadioItem value="atoms" className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
            <Atom className="h-4 w-4 text-slate-400" /> Átomos
          </MenubarRadioItem>
          <MenubarRadioItem value="residues" className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
            <Hexagon className="h-4 w-4 text-blue-400" /> Residuos
          </MenubarRadioItem>
        </MenubarRadioGroup>
      </MenubarContent>
    </MenubarMenu>
  )
}
