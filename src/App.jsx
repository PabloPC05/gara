import React from 'react'
import MolecularUniverseMock from './components/molecular/MolecularUniverseMock'
import { CommandSidebar } from './components/CommandSidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from './components/ui/sidebar'
import { Search, PanelLeft } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"

export default function App() {
  return (
    <SidebarProvider>
      <CommandSidebar />
      <SidebarInset className="relative">
        <div className="relative h-screen w-full overflow-hidden bg-slate-50">

          {/* 1. LAYER BASE: EL MOTOR 3D */}
          <div className="absolute inset-0 z-0">
            <MolecularUniverseMock background="#ffffff" />
          </div>

          {/* 2. LAYER NAVIGATION: NAVBAR FLOTANTE */}
          <FloatingNavbar />

          {/* 3. LAYER OVERLAY: DECORACIÓN Y HUD */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 z-50">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
              BioViewer Pro · Advanced Molecular Engine
            </span>
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

/**
 * Componente Navbar Flotante - Encapsula la navegación superior
 */
function FloatingNavbar() {
  return (
    <header className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-fit max-w-[90vw]">
      <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 px-4 py-2 shadow-xl backdrop-blur-xl transition-all hover:bg-white/95">

        <SidebarTrigger
          aria-label="Alternar sidebar"
          className="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
        >
          <PanelLeft className="h-4 w-4" />
        </SidebarTrigger>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-1">
          <FileMenu />
          <ViewMenu />
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <SearchBarTrigger />
          <UserAccountModule />
        </div>
      </div>
    </header>
  )
}

// ── SUB-COMPONENTES UI ───────────────────────────────────────────────────────

function FileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          Archivo
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 border border-slate-200 bg-white shadow-xl rounded-2xl p-2 z-[60]">
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Nuevo Proyecto <DropdownMenuShortcut>⌘N</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Abrir PDB...</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold text-blue-600">Guardar Universo</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ViewMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          Vista
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52 border border-slate-200 bg-white shadow-xl rounded-2xl p-2 z-[60]">
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Centrar Cámara</DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Ocultar Todo</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SearchBarTrigger() {
  return (
    <button className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition hover:bg-white hover:border-blue-200 hover:text-blue-600">
      <Search className="h-3.5 w-3.5" />
      ⌘K
    </button>
  )
}

function UserAccountModule() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-2xl border border-slate-200 p-1 hover:bg-slate-50 transition-colors">
          <Avatar className="h-8 w-8 rounded-xl">
            <AvatarImage src="https://avatar.vercel.sh/bio" className="rounded-xl" />
            <AvatarFallback className="bg-blue-600 text-[10px] font-bold text-white rounded-xl">BV</AvatarFallback>
          </Avatar>
          <span className="hidden lg:block pr-2 text-[10px] font-black uppercase tracking-widest text-slate-900">Pro Account</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border border-slate-200 bg-white shadow-xl rounded-2xl p-2 z-[60]">
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Cuenta Profesional</DropdownMenuLabel>
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold">Ajustes</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold text-red-600">Cerrar Sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
