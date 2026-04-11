import React, { useEffect } from 'react'
import MolecularScene from '@/components/molecular/MolecularScene'
import { CommandSidebar } from '@/components/CommandSidebar'
import { ProteinDetailsDrawer } from '@/components/ProteinDetailsDrawer'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { MenuBar } from '@/components/navigation/FloatingNavbar'
import { ActivityBar } from '@/components/sidebar/ActivityBar'
import useAuthStore from './stores/useAuthStore'
import { useUIStore } from './stores/useUIStore'

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const sceneBackground = useUIStore((state) => state.sceneBackground)

  useEffect(() => {
    const unsubscribe = initializeAuth()
    return () => unsubscribe()
  }, [initializeAuth])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black">
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
            <SidebarInset className="relative transition-colors duration-300" style={{ backgroundColor: sceneBackground }}>
              <div className="relative h-full w-full overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <MolecularScene background={sceneBackground} />
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </div>
    </div>
  )
}
