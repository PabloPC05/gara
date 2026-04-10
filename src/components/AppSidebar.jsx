import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar.tsx"
import { 
  Database, 
  Settings, 
  Activity, 
  Layers, 
  Dna, 
  Box, 
  Shapes, 
  LineChart, 
  HelpCircle 
} from "lucide-react"

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-slate-200 bg-white">
      <SidebarHeader className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Activity className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">BioViewer</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pro Edition</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Estructuras Activas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive className="bg-blue-50/50 text-blue-600 font-bold">
                  <Layers className="h-4 w-4" />
                  <span>Universo Molecular</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-slate-600 hover:text-slate-900">
                  <Database className="h-4 w-4" />
                  <span>Librería PDB</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-slate-600 hover:text-slate-900">
                  <Dna className="h-4 w-4" />
                  <span>Cargar Secuencia</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Capas de Visualización</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-slate-600 hover:text-slate-900">
                  <Box className="h-4 w-4" />
                  <span>Cartoon (Ribbon)</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-slate-600 hover:text-slate-900">
                  <Shapes className="h-4 w-4" />
                  <span>Superficie de Solvente</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-slate-600 hover:text-slate-900">
                  <LineChart className="h-4 w-4" />
                  <span>Malla de Átomos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Análisis de Dominios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-slate-600 hover:text-slate-900">
                  <HelpCircle className="h-4 w-4" />
                  <span>Ver Confianza pLDDT</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 transition hover:bg-slate-100 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
            <Activity className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Motor Render</span>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Activo v2.5.4</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
