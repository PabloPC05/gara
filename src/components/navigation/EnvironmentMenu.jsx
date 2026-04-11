import React from 'react'
import { Sun, Moon, Camera } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export function EnvironmentMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          <Sun className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Entorno</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border border-slate-200 bg-white shadow-xl rounded-2xl p-2 z-[60]">
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center justify-between">
          Iluminación Clínica
          <Sun className="h-4 w-4 text-slate-400" />
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center justify-between">
          Modo Oscuro
          <Moon className="h-4 w-4 text-slate-400" />
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-2 text-blue-600">
          <Camera className="h-4 w-4" /> Captura 4K (Fondo Transparente)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
