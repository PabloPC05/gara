import React from 'react'
import { ChevronRight, FlaskConical } from 'lucide-react'

export function ProjectBreadcrumbs() {
  return (
    <div className="hidden md:flex items-center gap-2 px-2">
      <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-blue-50 text-blue-600">
        <FlaskConical className="h-3.5 w-3.5" />
      </div>
      <span className="text-[11px] font-bold text-slate-600 hover:text-blue-600 cursor-pointer transition-colors">
        Proyecto Alfa
      </span>
      <ChevronRight className="h-3 w-3 text-slate-300" />
      <span className="text-[11px] font-black text-slate-900">
        Comparación Estructural
      </span>
    </div>
  )
}
