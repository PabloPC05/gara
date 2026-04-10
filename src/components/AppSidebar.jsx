import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "./ui/sidebar"
import { Database, Settings, Activity, Layers, User } from "lucide-react"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-bold text-slate-900">BioViewer Pro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup title="Exploración">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50/50">
            <Layers className="h-4 w-4" />
            Espacio 3D
          </div>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Database className="h-4 w-4" />
            Librería PDB
          </div>
        </SidebarGroup>
        <SidebarGroup title="Configuración">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Settings className="h-4 w-4" />
            Preferencias
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Motor 3Dmol.js v2.5
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
