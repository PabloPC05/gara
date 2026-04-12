import { SidebarFooter } from '../ui/sidebar.tsx'

export function StatusFooter({ count }) {
  return (
    <SidebarFooter className="border-t border-slate-100 p-3">
      <div className="flex items-center gap-2.5 rounded-none bg-white px-3.5 py-2.5 border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex h-7 w-7 items-center justify-center rounded-none bg-emerald-50 text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
            Entradas
          </span>
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">
            {count} activas
          </span>
        </div>
      </div>
    </SidebarFooter>
  )
}
