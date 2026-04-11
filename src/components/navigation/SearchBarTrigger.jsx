import React from 'react'
import { Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export function SearchBarTrigger() {
  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 rounded-lg border border-slate-600 bg-white/5 px-3 py-1 cursor-text hover:bg-white/10 hover:border-slate-500 transition-colors w-[600px]">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-[12px] text-slate-400 truncate">Buscar...</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[600px] bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-lg p-1.5 z-[60]">
        <DropdownMenuItem className={itemClass}>
          Search Proteins
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass}>
          Search Sequences
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass}>
          Help
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
