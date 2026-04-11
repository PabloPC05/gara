import React from 'react'
import { Activity } from 'lucide-react'

export function HPCMonitor() {
  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors">
      <div className="relative flex h-2 w-2 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
      </div>
      <Activity className="h-3 w-3 text-emerald-600" />
      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">HPC Inactivo</span>
    </div>
  )
}
