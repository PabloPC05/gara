import { Activity } from "lucide-react";
import { SidebarHeader } from "../../ui/sidebar.tsx";

export function SidebarHeaderTitle() {
  return (
    <SidebarHeader className="border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-none bg-blue-600 text-white shadow-lg shadow-blue-200/60">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-black uppercase leading-none tracking-tight text-slate-900">
            Comandos
          </span>
          <span className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Lista de Entradas
          </span>
        </div>
      </div>
    </SidebarHeader>
  );
}
