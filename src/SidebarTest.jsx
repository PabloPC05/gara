/**
 * Página aislada para testear overflow de la RightSidebar.
 * Abre en: http://localhost:5173/sidebar-test.html
 */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { ThemeProvider } from '@/components/theme-provider'
import { RightSidebar } from '@/components/RightSidebar'
import { useUIStore } from '@/stores/useUIStore'
import { searchCatalogProteins } from '@/lib/apiClient'
import { loadCatalogProtein } from '@/lib/catalogProteinLoader'

function SidebarTest() {
  const darkMode = useUIStore((s) => s.darkMode)
  const [status, setStatus] = useState('Buscando proteina en el catalogo...')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Cargar la primera proteina del catalogo automaticamente
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setStatus('Buscando en el catalogo...')
        const results = await searchCatalogProteins({ limit: 1 })

        if (cancelled) return

        if (!results || results.length === 0) {
          setStatus('No hay proteinas en el catalogo. Revisa que el backend este corriendo.')
          return
        }

        const first = results[0]
        setStatus(`Cargando "${first.proteinName}" (${first.proteinId})...`)

        await loadCatalogProtein(first.proteinId)

        if (cancelled) return
        setStatus(null) // ya cargada, sidebar visible
      } catch (err) {
        if (cancelled) return
        setStatus(`Error: ${err.message}`)
        console.error(err)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#18181b]">
      <RightSidebar>
        <div className="flex-1 flex items-center justify-center text-white/40 text-sm select-none p-8 text-center">
          {status ?? 'RightSidebar isolation test — proteina cargada, revisa overflow'}
        </div>
      </RightSidebar>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <SidebarTest />
    </ThemeProvider>
  </StrictMode>,
)
