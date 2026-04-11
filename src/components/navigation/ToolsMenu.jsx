import React from 'react'
import { Beaker, Ruler, Layers, Crosshair } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export function ToolsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          <Beaker className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Análisis</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border border-slate-200 bg-white shadow-xl rounded-2xl p-2 z-[60]">
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-2">
          <Ruler className="h-4 w-4 text-slate-400" /> Medir Distancias
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-400" /> Superponer Estructuras
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Modo de Selección</DropdownMenuLabel>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center justify-between">
          <span>Átomos</span>
          <Crosshair className="h-3.5 w-3.5 text-slate-400" />
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center justify-between">
          <span className="font-bold text-blue-600">Residuos</span>
          <Crosshair className="h-3.5 w-3.5 text-blue-600" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
