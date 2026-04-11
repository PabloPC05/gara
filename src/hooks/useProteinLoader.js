import { useCallback } from 'react'

import { useProteinStore } from '@/stores/useProteinStore'
import { submitJob, pollJob, ApiError } from '@/lib/apiClient'
import { apiToUnified } from '@/lib/proteinAdapter'

/**
 * Hook para lanzar la carga de una proteína a partir de un input libre
 * (PDB ID, UniProt ID o secuencia FASTA). Orquesta:
 *   submitJob → pollJob → apiToUnified → upsertProtein
 *
 * Devuelve el `proteinId` (unified.id) una vez completado, o lanza error.
 */
export function useProteinLoader() {
  const upsertProtein    = useProteinStore((s) => s.upsertProtein)
  const setProteinLoading = useProteinStore((s) => s.setProteinLoading)
  const setProteinError   = useProteinStore((s) => s.setProteinError)

  /** Garantiza formato FASTA. Si el input ya tiene cabecera ">", lo deja tal cual. */
  const toFasta = (input) => {
    const trimmed = input.trim()
    if (trimmed.startsWith('>')) return trimmed
    return `>sequence\n${trimmed}`
  }

  const load = useCallback(
    async (input, { signal } = {}) => {
      const trimmed = input?.trim()
      if (!trimmed) return null

      let jobId = null
      try {
        const submission = await submitJob(toFasta(trimmed))
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

  return { load }
}
