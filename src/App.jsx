import React from 'react'
import MolecularUniverseMock from './components/molecular/MolecularUniverseMock'
import { CommandSidebar } from './components/CommandSidebar'
import { ProteinDetailsDrawer } from './components/ProteinDetailsDrawer'
import { SidebarProvider, SidebarInset } from './components/ui/sidebar'
import { FloatingNavbar } from './components/navigation/FloatingNavbar'

export default function App() {
  return (
    <SidebarProvider
      defaultOpen={false}
      style={{
        '--sidebar-width': '20rem',
        '--sidebar-width-icon': '4.5rem',
      }}
    >
      <CommandSidebar />
      <ProteinDetailsDrawer />
      <SidebarInset className="relative">
        <div className="relative h-screen w-full overflow-hidden bg-slate-50">

          {/* 1. LAYER BASE: EL MOTOR 3D */}
          <div className="absolute inset-0 z-0">
            <MolecularUniverseMock background="#ffffff" />
          </div>

          {/* 2. LAYER NAVIGATION: NAVBAR FLOTANTE */}
          <FloatingNavbar />

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
