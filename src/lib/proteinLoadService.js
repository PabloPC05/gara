import { submitJob, pollJob, ApiError } from '@/lib/apiClient'
import { apiToUnified } from '@/lib/proteinAdapter'
import { useJobStatusStore } from '@/stores/useJobStatusStore'
import { useProteinStore } from '@/stores/useProteinStore'
import { useUIStore } from '@/stores/useUIStore'

function toFasta(input) {
  const trimmed = input.trim()
  if (trimmed.startsWith('>')) return trimmed
  return `>sequence\n${trimmed}`
}

function normalizeTerminalPanelStatus(status) {
  return status === 'CANCELLED' ? 'CANCELLED' : 'FAILED'
}

export class ProteinLoadJobError extends ApiError {
  constructor(message, { jobStatus = null, jobId = null, cause } = {}) {
    super(message, { cause })
    this.name = 'ProteinLoadJobError'
    this.jobStatus = jobStatus
    this.jobId = jobId
  }
}

export async function loadProteinFromInput(input, { signal, onStatusChange, onJobCreated } = {}) {
  const trimmed = input?.trim()
  if (!trimmed) return null

  const { upsertProtein, setProteinLoading, setProteinError } = useProteinStore.getState()

  let jobId = null
  try {
    const fasta = toFasta(trimmed)
    const jobResources = useUIStore.getState().jobResources
    const submission = await submitJob(fasta, jobResources)
    jobId = submission.jobId
    onJobCreated?.(jobId)
    setProteinLoading(jobId)

    const job = await pollJob(jobId, { signal, onStatusChange })
    if (job.status !== 'COMPLETED') {
      throw new ProteinLoadJobError(
        `Job ${jobId} terminó con estado ${job.status}`,
        { jobStatus: job.status, jobId },
      )
    }

    const unified = apiToUnified(job, fasta)
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
}

export async function loadProteinFromInputWithJobPanel(
  input,
  { panelKey, subjectId = null, signal } = {},
) {
  const trimmed = input?.trim()
  if (!trimmed) return null

  const { upsertJobPanel, clearJobPanel } = useJobStatusStore.getState()

  if (panelKey) {
    upsertJobPanel(panelKey, {
      status: 'PENDING',
      error: null,
      jobId: null,
      subjectId,
    })
  }

  try {
    const loadedProteinId = await loadProteinFromInput(trimmed, {
      signal,
      onJobCreated: (jobId) => {
        if (!panelKey) return
        useJobStatusStore.getState().upsertJobPanel(panelKey, { jobId })
      },
      onStatusChange: (status) => {
        if (!panelKey) return
        useJobStatusStore.getState().upsertJobPanel(panelKey, {
          status,
          error: null,
          subjectId,
        })
      },
    })

    if (panelKey) {
      clearJobPanel(panelKey)
    }

    return loadedProteinId
  } catch (error) {
    if (panelKey) {
      useJobStatusStore.getState().upsertJobPanel(panelKey, {
        status: normalizeTerminalPanelStatus(error?.jobStatus),
        error: error?.message ?? 'No se pudo procesar la proteína',
        jobId: error?.jobId ?? null,
        subjectId: null,
      })
    }

    throw error
  }
}
