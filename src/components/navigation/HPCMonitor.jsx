import React from 'react'
import { Activity } from 'lucide-react'

export function HPCMonitor() {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
      <div className="relative flex h-2 w-2 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
      </div>
      <Activity className="h-3 w-3 text-emerald-400" />
      <span className="text-[10px] font-semibold text-emerald-300">HPC Inactivo</span>
    </div>
  )
}
