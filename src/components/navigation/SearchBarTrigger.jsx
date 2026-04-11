import React from 'react'
import { Search } from 'lucide-react'

export function SearchBarTrigger() {
  return (
    <button className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition hover:bg-white hover:border-blue-200 hover:text-blue-600">
      <Search className="h-3.5 w-3.5" />
      ⌘K
    </button>
  )
}
