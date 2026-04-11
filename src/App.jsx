import React, { useEffect } from 'react'
import MolecularScene from '@/components/molecular/MolecularScene'
import { CommandSidebar } from '@/components/CommandSidebar'
import { ProteinDetailsDrawer } from '@/components/ProteinDetailsDrawer'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { MenuBar } from '@/components/navigation/FloatingNavbar'
import { ActivityBar } from '@/components/sidebar/ActivityBar'
import useAuthStore from './stores/useAuthStore'
export default function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#18181b]">
      <MenuBar />
      <div className="flex flex-1 min-h-0">
        <ActivityBar />
        <div style={{ contain: 'layout paint' }} className="relative flex-1 h-full w-full">
          <SidebarProvider
            defaultOpen={true}
            style={{
              '--sidebar-width': '22rem',
            }}
          >
            <CommandSidebar />
            <ProteinDetailsDrawer />
            <SidebarInset className="relative bg-slate-50">
              <div className="relative h-full w-full overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <MolecularScene background="#ffffff" />
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </div>
    </div>
  )
}
