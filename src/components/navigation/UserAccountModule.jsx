import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export function UserAccountModule() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center rounded-md p-1 hover:bg-slate-100 transition-colors">
          <Avatar className="h-6 w-6 rounded-md">
            <AvatarImage src="https://avatar.vercel.sh/bio" className="rounded-md" />
            <AvatarFallback className="bg-blue-600 text-[9px] font-bold text-white rounded-md">BV</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border border-slate-200 bg-white shadow-xl rounded-xl p-2 z-[60]">
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Cuenta Profesional</DropdownMenuLabel>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium">Ajustes de Sesión</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium text-red-600">Cerrar Sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
