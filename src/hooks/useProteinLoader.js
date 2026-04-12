import { useCallback, useState } from 'react'

import { loadProteinFromInput } from '@/lib/proteinLoadService'

/**
 * Hook para lanzar la carga de una proteína a partir de un input libre
 * (PDB ID, UniProt ID o secuencia FASTA). Orquesta:
 *   submitJob → pollJob → apiToUnified → upsertProtein
 *
 * Devuelve el `proteinId` (unified.id) una vez completado, o lanza error.
 * Expone `jobStatus` con el último estado recibido del servidor.
 */
export function useProteinLoader() {
  const [jobStatus, setJobStatus] = useState(null)

  const load = useCallback(
    async (input, { signal, onStatusChange } = {}) => {
      const trimmed = input?.trim()
      if (!trimmed) return null

      setJobStatus('PENDING')
      return loadProteinFromInput(trimmed, {
        signal,
        onStatusChange: (status) => {
          setJobStatus(status)
          onStatusChange?.(status)
        },
      })
    },
    [],
  )

  return { load, jobStatus }
}
