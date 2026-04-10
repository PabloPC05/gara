import MolecularUniverse from './components/MolecularUniverse'
import { AppSidebar } from './components/AppSidebar'
import { User, Bell, Search } from 'lucide-react'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from "./components/ui/menubar"

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
    <div className="relative h-screen w-full overflow-hidden bg-white flex">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Viewport */}
      <main className="flex-1 relative flex flex-col">
        
        {/* Top Header with Menubar and Account */}
        <header className="absolute top-0 left-0 right-0 z-50 h-14 border-b bg-white/60 backdrop-blur-md flex items-center justify-between px-6 ml-64">
          <div className="flex items-center gap-4">
            <Menubar className="border-none bg-transparent shadow-none h-auto">
              <MenubarMenu>
                <MenubarTrigger className="font-bold text-xs uppercase tracking-widest text-slate-600">Archivo</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Nuevo Proyecto <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
                  <MenubarItem>Abrir PDB... <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Guardar Escena <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
                  <MenubarItem>Exportar Imagen...</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Salir</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="font-bold text-xs uppercase tracking-widest text-slate-600">Ventana</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Maximizar Visor</MenubarItem>
                  <MenubarItem>Pantalla Completa</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Consola de Python</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="font-bold text-xs uppercase tracking-widest text-slate-600">Ayuda</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Documentación</MenubarItem>
                  <MenubarItem>Atajos de Teclado</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Acerca de BioViewer</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">
               <Search className="h-3 w-3 text-slate-400" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buscar...</span>
               <kbd className="ml-2 pointer-events-none inline-flex h-4 items-center gap-1 rounded border bg-white px-1 font-mono text-[8px] font-medium text-slate-400">
                 ⌘K
               </kbd>
            </div>
            
            <button className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-lg transition-all group">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <User className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Mi Cuenta</span>
            </button>
          </div>
        </header>

        {/* The 3D Molecular Universe - High Performance Viewport */}
        <div className="flex-1 relative bg-slate-950">
          <MolecularUniverse proteins={pdbUniverse} background="#0a0a0c" />
        </div>
      </main>
    </div>
  )
}
