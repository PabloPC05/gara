import { API_BASE_URL } from '@/lib/appConfig';
import { validateApiResponse } from '@/lib/apiSchema';

const DEFAULT_POLL_INTERVAL_MS = 2000

export class ApiError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    if (cause) this.cause = cause
  }
}

async function request(path, init = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
      ...init,
    })
  } catch (cause) {
    throw new ApiError(`Network error calling ${path}`, { cause })
  }
  if (!response.ok) {
    throw new ApiError(`Request failed: ${response.status} ${response.statusText}`, {
      status: response.status,
    })
  }
  return response.json()
}

/**
 * Crea un job de predicción a partir de una secuencia FASTA.
 *
 * @param {string} fastaSequence  Texto FASTA completo (con cabecera ">...")
 * @returns {Promise<{ jobId: string }>}
 */
export async function submitJob(fastaSequence) {
  const raw = await request('/jobs/submit', {
    method: 'POST',
    body: JSON.stringify({
      fasta_sequence: fastaSequence,
      fasta_filename: 'sequence.fasta',
    }),
  })
  const jobId = raw?.job_id
  if (!jobId) throw new ApiError('submitJob: respuesta sin job_id')
  return { jobId }
}

const asStringOrNull = (value) => (typeof value === 'string' ? value : null)

const asNumberOrNull = (value) => {
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

function normalizeCatalogSummary(raw) {
  if (!raw || typeof raw !== 'object') return null

  const proteinId = asStringOrNull(raw.protein_id)
  if (!proteinId) return null

  return {
    proteinId,
    proteinName: asStringOrNull(raw.protein_name) ?? proteinId,
    uniprotId: asStringOrNull(raw.uniprot_id),
    pdbId: asStringOrNull(raw.pdb_id),
    organism: asStringOrNull(raw.organism) ?? 'Unknown',
    length: asNumberOrNull(raw.length),
    category: asStringOrNull(raw.category),
    description: asStringOrNull(raw.description) ?? '',
  }
}

function normalizeCatalogDetail(raw) {
  const summary = normalizeCatalogSummary(raw)
  if (!summary) return null

  return {
    ...summary,
    sequence: asStringOrNull(raw.sequence) ?? '',
    fastaReady: asStringOrNull(raw.fasta_ready) ?? '',
  }
}

/**
 * Busca proteínas en el catálogo público de la API.
 *
 * @param {string} query
 * @returns {Promise<Array<{
 *   proteinId: string,
 *   proteinName: string,
 *   uniprotId: string|null,
 *   pdbId: string|null,
 *   organism: string,
 *   length: number|null,
 *   category: string|null,
 *   description: string
 * }>>}
 */
export async function searchCatalogProteins(query) {
  const trimmed = query?.trim()
  if (!trimmed) return []

  const params = new URLSearchParams({ search: trimmed })
  const raw = await request(`/proteins/?${params.toString()}`)

  if (!Array.isArray(raw)) {
    throw new ApiError('searchCatalogProteins: respuesta inválida')
  }

  return raw.map(normalizeCatalogSummary).filter(Boolean)
}

/**
 * Obtiene el detalle de una proteína del catálogo, incluyendo `fasta_ready`.
 *
 * @param {string} proteinId
 * @returns {Promise<{
 *   proteinId: string,
 *   proteinName: string,
 *   uniprotId: string|null,
 *   pdbId: string|null,
 *   organism: string,
 *   length: number|null,
 *   category: string|null,
 *   description: string,
 *   sequence: string,
 *   fastaReady: string
 * }>}
 */
export async function getCatalogProteinDetail(proteinId) {
  const trimmed = proteinId?.trim()
  if (!trimmed) {
    throw new ApiError('getCatalogProteinDetail: proteinId requerido')
  }

  const raw = await request(`/proteins/${encodeURIComponent(trimmed)}`)
  const detail = normalizeCatalogDetail(raw)

  if (!detail) {
    throw new ApiError('getCatalogProteinDetail: respuesta inválida')
  }

  return detail
}

/**
 * Consulta el estado de un job. Si está COMPLETED, obtiene también los
 * outputs (PDB, confianza, datos biológicos) en una segunda llamada.
 * La respuesta pasa por `validateApiResponse` para que el resto de la app
 * trabaje siempre con la forma normalizada del schema.
 *
 * @param {string} jobId
 */
export async function getJob(jobId) {
  const statusRaw = await request(`/jobs/${encodeURIComponent(jobId)}/status`)
  const status = statusRaw?.status ?? 'UNKNOWN'

  if (status === 'COMPLETED') {
    const outputsRaw = await request(`/jobs/${encodeURIComponent(jobId)}/outputs`)
    const result = validateApiResponse(outputsRaw)
    if (!result.valid) throw new ApiError(`getJob: respuesta inválida (${result.error})`)
    return result.data
  }

  const result = validateApiResponse(statusRaw)
  if (!result.valid) throw new ApiError(`getJob: respuesta inválida (${result.error})`)
  return result.data
}

const waitWithAbort = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener?.('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener?.('abort', onAbort, { once: true })
  })

/**
 * Polling hasta que el job alcanza un estado terminal (COMPLETED/FAILED).
 * Respeta AbortSignal para cancelación limpia.
 *
 * @param {string} jobId
 * @param {{ intervalMs?: number, signal?: AbortSignal }} [options]
 */
export async function pollJob(jobId, { intervalMs = DEFAULT_POLL_INTERVAL_MS, signal } = {}) {
  for (;;) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const job = await getJob(jobId)
    if (job.status === 'COMPLETED' || job.status === 'FAILED') return job
    await waitWithAbort(intervalMs, signal)
  }
}
