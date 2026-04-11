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
        <button className="flex items-center gap-2 rounded-2xl border border-slate-200 p-1 hover:bg-slate-50 transition-colors">
          <Avatar className="h-8 w-8 rounded-xl">
            <AvatarImage src="https://avatar.vercel.sh/bio" className="rounded-xl" />
            <AvatarFallback className="bg-blue-600 text-[10px] font-bold text-white rounded-xl">BV</AvatarFallback>
          </Avatar>
          <span className="hidden lg:block pr-2 text-[10px] font-black uppercase tracking-widest text-slate-900">Pro Account</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border border-slate-200 bg-white shadow-xl rounded-2xl p-2 z-[60]">
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Cuenta Profesional</DropdownMenuLabel>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium">Ajustes de Sesión</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium text-red-600">Cerrar Sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
