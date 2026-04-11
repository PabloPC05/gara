import React from 'react'
import { Palette } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export function StyleMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          <Palette className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Estilo</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border border-slate-200 bg-white shadow-xl rounded-2xl p-2 z-[60]">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Representación</DropdownMenuLabel>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium">Cartoon (Cintas)</DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium">Superficie</DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium">Esferas (VDW)</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Coloración</DropdownMenuLabel>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium">Por Cadena</DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium">Por B-Factor</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
