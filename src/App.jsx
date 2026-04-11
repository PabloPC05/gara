import React, { useEffect } from 'react'
import MolecularScene from '@/components/molecular/MolecularScene'
import { CommandSidebar } from '@/components/CommandSidebar'
import { ProteinDetailsDrawer } from '@/components/ProteinDetailsDrawer'
import { FastaBar } from '@/components/FastaBar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { MenuBar } from '@/components/navigation/FloatingNavbar'
import { ActivityBar } from '@/components/sidebar/ActivityBar'
import useAuthStore from './stores/useAuthStore'
import { useUIStore } from './stores/useUIStore'
import { initGoogleIdentity } from './lib/googleDriveService'

export default function App() {
  const { initializeAuth } = useAuthStore()
  const darkMode         = useUIStore((s) => s.darkMode)
  const viewerBackground = useUIStore((s) => s.viewerBackground)

  useEffect(() => {
    const unsubscribe = initializeAuth()
    
    // Inicializar Google Workspace si el CLIENT_ID está disponible
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId) {
      initGoogleIdentity(clientId);
    }
    
    return () => unsubscribe()
  }, [initializeAuth])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{ '--sidebar-width': '22rem' }}
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#18181b]"
    >
      <header className="h-9 flex-shrink-0">
        <MenuBar />
      </header>
      
      <div className="flex flex-1 min-h-0">
        <ActivityBar />
        <div style={{ contain: 'layout paint' }} className="relative flex-1 h-full w-full">
          <CommandSidebar />
          
          <div className="absolute right-0 top-0 bottom-0 z-50">
            <ProteinDetailsDrawer />
          </div>

          <SidebarInset
            className="relative flex flex-col h-full w-full"
            style={{ backgroundColor: viewerBackground }}
          >
            <FastaBar />
            <div className="relative flex-1 min-h-0 w-full overflow-hidden">
              <MolecularScene background={viewerBackground} />
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
