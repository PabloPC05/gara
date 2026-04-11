import { useCallback } from 'react'

import { useProteinStore } from '@/stores/useProteinStore'
import { submitJob, pollJob, ApiError } from '@/lib/apiClient'
import { apiToUnified } from '@/lib/proteinAdapter'
import { USE_MOCK } from '@/lib/appConfig'

/**
 * Hook para lanzar la carga de una proteína a partir de un input libre
 * (PDB ID, UniProt ID o secuencia). Orquesta `submitJob → pollJob →
 * adapt → upsert` contra el store global.
 *
 * En modo mock es un no-op que devuelve null — el catálogo se llena al
 * arrancar desde `mockProteinCatalog`, así que no hay nada que cargar.
 */
export function useProteinLoader() {
  const upsertProtein = useProteinStore((state) => state.upsertProtein)
  const setProteinLoading = useProteinStore((state) => state.setProteinLoading)
  const setProteinError = useProteinStore((state) => state.setProteinError)

  const load = useCallback(
    async (input, { signal } = {}) => {
      if (USE_MOCK) return null
      const trimmed = input?.trim()
      if (!trimmed) return null

      let jobId = null
      try {
        const submission = await submitJob(trimmed)
        jobId = submission.jobId
        setProteinLoading(jobId)
        const job = await pollJob(jobId, { signal })
        if (job.status !== 'COMPLETED') {
          throw new ApiError(`Job ${jobId} terminó con estado ${job.status}`)
        }
        const unified = apiToUnified(job)
        if (!unified) {
          throw new ApiError('Respuesta de la API sin datos suficientes')
        }
        upsertProtein(unified)
        return unified.id
      } catch (error) {
        if (error?.name === 'AbortError') return null
        if (jobId) {
          setProteinError(jobId, error?.message ?? 'Error desconocido')
        }
        throw error
      }
    },
    [upsertProtein, setProteinLoading, setProteinError],
  )

  return { load, isMock: USE_MOCK }
}
