import { Activity } from 'lucide-react'
import { SidebarHeader } from '../ui/sidebar.tsx'

export function SidebarBrand() {
  return (
    <SidebarHeader className="border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200/60">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-slate-900 tracking-tight leading-none uppercase">
            Comandos
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">
            Lista de Entradas
          </span>
        </div>
      </div>
    </SidebarHeader>
  )
}
