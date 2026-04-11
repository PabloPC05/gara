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
 * Crea un job de predicción a partir de un input libre: PDB ID, UniProt
 * ID o secuencia de aminoácidos. El backend se encarga del dispatch.
 *
 * @param {string} input
 * @returns {Promise<{ jobId: string }>}
 */
export async function submitJob(input) {
  const raw = await request('/jobs', {
    method: 'POST',
    body: JSON.stringify({ input }),
  })
  const jobId = raw?.job_id
  if (!jobId) throw new ApiError('submitJob: respuesta sin job_id')
  return { jobId }
}

/**
 * Consulta el estado y los resultados de un job. La respuesta pasa por
 * `validateApiResponse` para que el resto de la app trabaje siempre con
 * la forma normalizada del schema.
 *
 * @param {string} jobId
 */
export async function getJob(jobId) {
  const raw = await request(`/jobs/${encodeURIComponent(jobId)}`)
  const result = validateApiResponse(raw)
  if (!result.valid) {
    throw new ApiError(`getJob: respuesta inválida (${result.error})`)
  }
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
