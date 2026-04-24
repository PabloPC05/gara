import { SidebarFooter } from "../../ui/sidebar.tsx";

export function ActiveEntriesFooter({ count }) {
  return (
    <SidebarFooter className="border-t border-slate-100 p-3">
      <div className="flex items-center gap-2.5 rounded-none border border-slate-100 bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex h-7 w-7 items-center justify-center rounded-none bg-emerald-50 text-emerald-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-none bg-emerald-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">
            Entradas
          </span>
          <span className="text-[9px] font-bold uppercase tracking-tighter text-emerald-500">
            {count} activas
          </span>
        </div>
      </div>
    </SidebarFooter>
  );
}
