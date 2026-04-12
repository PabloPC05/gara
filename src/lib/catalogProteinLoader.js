import { ApiError, getCatalogProteinDetail } from '@/lib/apiClient'
import { loadProteinFromInputWithJobPanel } from '@/lib/proteinLoadService'
import {
  ACTIVE_JOB_STATUSES,
  getJobPanel,
  JOB_PANEL_KEYS,
  useJobStatusStore,
} from '@/stores/useJobStatusStore'
import { useProteinStore } from '@/stores/useProteinStore'

export async function loadCatalogProtein(proteinId) {
  const trimmedProteinId = proteinId?.trim()
  if (!trimmedProteinId) return null

  const currentPanel = getJobPanel(JOB_PANEL_KEYS.catalog)
  const isJobActive = ACTIVE_JOB_STATUSES.has(currentPanel?.status)

  if (isJobActive) return null

  useJobStatusStore.getState().upsertJobPanel(JOB_PANEL_KEYS.catalog, {
    status: 'PENDING',
    error: null,
    jobId: null,
    subjectId: trimmedProteinId,
  })

  try {
    const detail = await getCatalogProteinDetail(trimmedProteinId)
    if (!detail.fastaReady) {
      throw new ApiError('La respuesta del detalle no incluye fasta_ready')
    }

    const loadedProteinId = await loadProteinFromInputWithJobPanel(detail.fastaReady, {
      panelKey: JOB_PANEL_KEYS.catalog,
      subjectId: trimmedProteinId,
    })

    if (loadedProteinId) {
      useProteinStore.getState().setSelectedProteinIds([loadedProteinId])
    }

    return loadedProteinId
  } catch (error) {
    const panel = getJobPanel(JOB_PANEL_KEYS.catalog)
    if (!panel || !['FAILED', 'CANCELLED'].includes(panel.status)) {
      useJobStatusStore.getState().upsertJobPanel(JOB_PANEL_KEYS.catalog, {
        status: 'FAILED',
        error: error?.message ?? 'No se pudo cargar la proteína seleccionada',
        jobId: null,
        subjectId: null,
      })
    }
    throw error
  }
}
