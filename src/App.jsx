import React, { useEffect, useCallback } from 'react'
import MolecularScene from '@/components/molecular/MolecularScene'
import { CommandSidebar } from '@/components/CommandSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { FastaBar } from '@/components/FastaBar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { MenuBar } from '@/components/navigation/FloatingNavbar'
import { ActivityBar } from '@/components/sidebar/ActivityBar'
import { DropZoneOverlay } from '@/components/workspace/DropZoneOverlay'
import { Toaster } from '@/components/ui/sonner'
import useAuthStore from './stores/useAuthStore'
import { useUIStore } from './stores/useUIStore'
import { useProteinStore } from './stores/useProteinStore'
import { initGoogleIdentity } from './lib/googleDriveService'
import { parseStructureFile, readTextFile } from './lib/importStructure'
import { useDeepLinkRestore } from './hooks/useDeepLinkRestore'

export default function App() {
  const { initializeAuth } = useAuthStore()
  const darkMode         = useUIStore((s) => s.darkMode)
  const viewerBackground = useUIStore((s) => s.viewerBackground)

  useDeepLinkRestore()

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

  const handleFilesDropped = useCallback(async (files) => {
    const { upsertProtein, setActiveProteinId } = useProteinStore.getState()
    for (const file of files) {
      try {
        const text = await readTextFile(file)
        const name = file.name.toLowerCase()
        if (name.endsWith('.fasta') || name.endsWith('.fas') || name.endsWith('.fa') || name.endsWith('.seq') || name.endsWith('.txt')) {
          const fastaText = text.trim()
          if (fastaText.startsWith('>')) {
            const lines = fastaText.split('\n')
            const header = lines[0].replace(/^>\s*/, '').trim()
            const sequence = lines.slice(1).join('').replace(/\s/g, '')
            const id = `fasta-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
            upsertProtein({
              id,
              name: header || file.name,
              sequence,
              fasta: fastaText,
              source: 'local',
              organism: 'Unknown',
              length: sequence.length,
              structureData: null,
              structureFormat: null,
              pdbData: null,
              cifData: null,
              uniprotId: null,
              pdbId: null,
              plddtMean: null,
              meanPae: null,
              paeMatrix: [],
              biological: null,
              _raw: {
                protein_metadata: { protein_name: header || file.name, organism: 'Unknown', data_source: 'Archivo local' },
                structural_data: { confidence: {}, pdb_file: '' },
                biological_data: null,
                sequence_properties: { length: sequence.length },
                logs: '',
              },
            })
            setActiveProteinId(id)
          }
        } else if (name.endsWith('.session')) {
          try {
            const data = JSON.parse(text)
            if (data.type === 'camelia-session' && Array.isArray(data.proteins)) {
              useProteinStore.getState().replaceCatalog(data.proteins)
            }
          } catch { /* ignore invalid session files */ }
        } else {
          const protein = parseStructureFile(text, file.name)
          upsertProtein(protein)
          setActiveProteinId(protein.id)
        }
      } catch (err) {
        console.error(`Error importing ${file.name}:`, err)
      }
    }
  }, [])

  return (
    <>
    <SidebarProvider
      defaultOpen={true}
      style={{ '--sidebar-width': '22rem', '--left-sidebar-width': '22rem' }}
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#18181b]"
    >
      <header className="h-9 flex-shrink-0">
        <MenuBar />
      </header>

      <div className="flex flex-1 min-h-0">
        <ActivityBar />
        <div style={{ contain: 'layout paint' }} className="relative flex-1 h-full min-w-0 overflow-hidden">
          <CommandSidebar />

          <SidebarInset
            className="relative flex flex-col h-full w-full"
            style={{ backgroundColor: viewerBackground }}
          >
            <RightSidebar>
              <div
                className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden"
                style={{ backgroundColor: viewerBackground }}
              >
                <FastaBar />
                <div className="relative flex-1 min-h-0 w-full overflow-hidden">
                  <DropZoneOverlay onFilesDropped={handleFilesDropped}>
                    <MolecularScene background={viewerBackground} />
                  </DropZoneOverlay>
                </div>
              </div>
            </RightSidebar>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
    <Toaster />
    </>
  )
}
