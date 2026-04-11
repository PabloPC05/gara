import React from 'react'
import { Sun, Moon, Camera, Monitor, Zap } from 'lucide-react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarTrigger,
  MenubarShortcut,
  MenubarCheckboxItem,
} from "../ui/menubar"

export function EnvironmentMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger>Entorno</MenubarTrigger>
      <MenubarContent className="w-64 bg-[#1e1e22] border border-[#2e2e33] rounded-xl p-1.5 shadow-2xl shadow-black/40">
        <MenubarCheckboxItem checked className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Sun className="h-4 w-4 text-amber-400" /> Iluminación Clínica
        </MenubarCheckboxItem>
        <MenubarItem className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Moon className="h-4 w-4 text-indigo-400" /> Modo Oscuro
          <MenubarShortcut>D</MenubarShortcut>
        </MenubarItem>
        <MenubarItem className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Monitor className="h-4 w-4 text-slate-400" /> Fondo Blanco
        </MenubarItem>
        <MenubarItem className="text-slate-200 hover:bg-white/8 focus:bg-white/8">
          <Zap className="h-4 w-4 text-yellow-400" /> Sombras Suaves
        </MenubarItem>
        <MenubarSeparator className="bg-white/6" />
        <MenubarItem className="text-blue-400 hover:bg-blue-500/10 focus:bg-blue-500/10">
          <Camera className="h-4 w-4" /> Captura 4K (Fondo Transparente)
          <MenubarShortcut>⇧C</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}
