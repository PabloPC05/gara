import React from 'react'
import { Search, Settings, Moon, Globe, Keyboard, Bell, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export function SearchBarTrigger() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 rounded-md border border-slate-600 bg-white/5 px-2.5 py-1 cursor-text hover:bg-white/10 hover:border-slate-500 transition-colors w-52">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-[12px] text-slate-400 truncate">Buscar...</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 border border-slate-200 bg-white shadow-xl rounded-xl p-2 z-[60]">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ajustes rápidos</DropdownMenuLabel>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-3">
          <Settings className="h-4 w-4 text-slate-400" /> Configuración general
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-3">
          <User className="h-4 w-4 text-slate-400" /> Perfil de usuario
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-3">
          <Globe className="h-4 w-4 text-slate-400" /> Idioma
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-3">
          <Moon className="h-4 w-4 text-slate-400" /> Tema de interfaz
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-3">
          <Bell className="h-4 w-4 text-slate-400" /> Notificaciones
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-3">
          <Keyboard className="h-4 w-4 text-slate-400" /> Atajos de teclado
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
