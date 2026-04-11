import React, { useEffect } from 'react'
import MolecularViewer from '@/components/molecular/MolecularViewer'
import { USE_MOCK } from '@/lib/appConfig'
import { useProteinStore } from '@/stores/useProteinStore'
import { MOCK_HELIX_LAYOUTS } from '@/data/mockProteinCatalog'
import { buildHelixPdb } from '@/lib/helix'
import { mockToUnified } from '@/lib/proteinAdapter'

/**
 * Gate de modo. Ahora siempre utiliza MolecularViewer (basado en Mol*)
 * pero se encarga de poblar el catálogo mock si no hay backend activo.
 */
export default function MolecularScene(props) {
  const replaceCatalog = useProteinStore((state) => state.replaceCatalog)

  // Poblado inicial del catálogo mock en el store si estamos en modo offline.
  // Esto permite que el visor (MolecularViewer) lea los IDs y los datos 
  // estructurales unificados desde la misma fuente que el resto de la UI.
  useEffect(() => {
    if (USE_MOCK) {
      const mockProteins = MOCK_HELIX_LAYOUTS.map((layout) => {
        const pdbData = buildHelixPdb(layout.residues, layout.offset)
        return mockToUnified(layout.id, layout.details, pdbData)
      })
      replaceCatalog(mockProteins)
    }
  }, [replaceCatalog])

  return <MolecularViewer {...props} />
}
