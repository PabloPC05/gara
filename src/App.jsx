import MolecularUniverse from './components/MolecularUniverse'
import { AppSidebar } from './components/AppSidebar'
import { Bell, Search, PanelLeft } from 'lucide-react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"

export default function App() {
  // PDB Universe Data: Expert configuration for protein distribution
  const pdbUniverse = [
    { pdbId: '1ubq', x: 0, y: 0, z: 0 },       // Ubiquitin
    { pdbId: '1crn', x: 50, y: 20, z: -10 },   // Crambin
    { pdbId: '6lu7', x: -40, y: -30, z: 20 },  // SARS-CoV-2 Main Protease
    { pdbId: '1tna', x: 10, y: 60, z: -30 },   // tRNA
    { pdbId: '7ahl', x: -60, y: 40, z: -15 }   // Alpha-Hemolysin
  ];

  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full overflow-hidden bg-white">
        {/* Actual Shadcn Sidebar */}
        <AppSidebar />

        <SidebarInset className="relative flex-1 bg-white flex flex-col min-w-0">
          {/* Header Bar */}
          <header className="z-50 h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors" />
              
              <div className="h-4 w-px bg-slate-200" />

              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
                      Archivo
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-56 border border-slate-200 bg-white/95 text-slate-900 shadow-xl backdrop-blur-xl rounded-2xl p-2">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Gestión de Archivos</DropdownMenuLabel>
                    <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Nuevo Proyecto <DropdownMenuShortcut>⌘N</DropdownMenuShortcut></DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Abrir PDB... <DropdownMenuShortcut>⌘O</DropdownMenuShortcut></DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold text-blue-600">Guardar Escena <DropdownMenuShortcut>⌘S</DropdownMenuShortcut></DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="rounded-xl px-3 py-2 text-sm font-bold">Exportar como...</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="border border-slate-200 bg-white shadow-xl rounded-2xl p-2">
                        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Imagen PNG</DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Modelo GLB</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
                      Ventana
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-52 border border-slate-200 bg-white shadow-xl rounded-2xl p-2">
                    <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Consola Python</DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Monitor de Red</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-white hover:border-blue-200 hover:text-blue-600 md:flex">
                <Search className="h-3.5 w-3.5" />
                Buscar Proteínas
                <kbd className="ml-2 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-400">⌘K</kbd>
              </button>

              <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors">
                <Bell className="h-4 w-4" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl border border-slate-200 p-1 hover:bg-slate-50 transition-colors">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="https://avatar.vercel.sh/bio" className="rounded-lg" />
                      <AvatarFallback className="bg-blue-600 text-[10px] font-bold text-white rounded-lg">BV</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border border-slate-200 bg-white shadow-xl rounded-2xl p-2">
                  <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Perfil de Usuario</DropdownMenuLabel>
                  <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Ajustes</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Suscripción Pro</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold text-red-600">Cerrar Sesión</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* 3D Viewport - The Molecular Universe */}
          <div className="flex-1 relative overflow-hidden bg-white">
            <MolecularUniverse proteins={pdbUniverse} background="#ffffff" />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
