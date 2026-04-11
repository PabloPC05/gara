import React from 'react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"

export function EnvironmentMenu() {
  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer"

  return (
    <MenubarMenu>
      <MenubarTrigger>Entorno</MenubarTrigger>
      <MenubarContent className="w-64 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">
        <MenubarItem className={itemClass}>
          Iluminación Clínica
        </MenubarItem>
        <MenubarItem className={itemClass}>
          Modo Oscuro
        </MenubarItem>
        <MenubarItem className={itemClass}>
          Fondo Blanco
        </MenubarItem>
        <MenubarItem className={itemClass}>
          Sombras Suaves
        </MenubarItem>
        <MenubarSeparator className="bg-white/10 mx-1" />
        <MenubarItem className="text-xs text-blue-400 hover:bg-blue-500/10 focus:bg-blue-500/10 hover:text-blue-300 focus:text-blue-300 rounded-lg px-2 py-1.5 cursor-pointer">
          Captura 4K (Fondo Transparente)
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}
