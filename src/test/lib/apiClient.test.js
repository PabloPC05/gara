import {
  submitJob,
  getJob,
  pollJob,
  searchCatalogProteins,
  ApiError,
} from '@/lib/apiClient'

vi.mock('@/lib/appConfig', () => ({
  API_BASE_URL: 'http://test-api.local',
}))

vi.mock('@/lib/apiSchema', () => ({
  validateApiResponse: vi.fn((raw) => {
    if (raw.invalid) return { valid: false, error: 'bad schema' }
    return { valid: true, data: raw }
  }),
}))

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('ApiError', () => {
    it('carries status and cause', () => {
      const err = new ApiError('test', { status: 500, cause: new Error('root') })
      expect(err.name).toBe('ApiError')
      expect(err.message).toBe('test')
      expect(err.status).toBe(500)
      expect(err.cause.message).toBe('root')
    })
  })

  describe('submitJob', () => {
    it('returns jobId on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ job_id: 'j-1' }),
      })

      const result = await submitJob('1UBQ')
      expect(result).toEqual({ jobId: 'j-1' })
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.local/jobs/submit',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            fasta_sequence: '1UBQ',
            fasta_filename: 'sequence.fasta',
          }),
        }),
      )
    })

    it('throws ApiError when response lacks job_id', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await expect(submitJob('test')).rejects.toThrow(ApiError)
    })

    it('throws ApiError on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(submitJob('test')).rejects.toThrow(/500/)
    })

    it('throws ApiError on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(submitJob('test')).rejects.toThrow(/Network error/)
    })

    it('includes job resources in the payload when provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ job_id: 'j-2' }),
      })

      await submitJob('>seq\nAAAA', {
        gpus: 1,
        cpus: 8,
        memory_gb: 32,
        max_runtime_seconds: 3600,
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.local/jobs/submit',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            fasta_sequence: '>seq\nAAAA',
            fasta_filename: 'sequence.fasta',
            gpus: 1,
            cpus: 8,
            memory_gb: 32,
            max_runtime_seconds: 3600,
          }),
        }),
      )
    })
  })

  describe('getJob', () => {
    it('returns status payload for non-completed jobs', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'PENDING', job_id: 'j-1' }),
      })

      const result = await getJob('j-1')
      expect(result.status).toBe('PENDING')
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.local/jobs/j-1/status',
        expect.anything(),
      )
    })

    it('returns outputs payload for completed jobs', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'COMPLETED', job_id: 'j-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'COMPLETED', job_id: 'j-1', pdb_file: 'ATOM' }),
        })

      const result = await getJob('j-1')

      expect(result).toEqual({ status: 'COMPLETED', job_id: 'j-1', pdb_file: 'ATOM' })
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'http://test-api.local/jobs/j-1/status',
        expect.anything(),
      )
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://test-api.local/jobs/j-1/outputs',
        expect.anything(),
      )
    })

    it('throws ApiError on invalid schema', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: true }),
      })

      await expect(getJob('j-1')).rejects.toThrow(/inválida/)
    })

    it('encodes jobId in URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'PENDING' }),
      })

      await getJob('job/special')
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.local/jobs/job%2Fspecial/status',
        expect.anything(),
      )
    })
  })

  describe('searchCatalogProteins', () => {
    it('builds the query string with filters and limit', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          {
            protein_id: 'p-1',
            protein_name: 'Ubiquitin',
            uniprot_id: 'P0CG47',
            pdb_id: '1UBQ',
            organism: 'Homo sapiens',
            length: 76,
            category: 'structural',
            description: 'Protein 1',
          },
          {
            protein_id: 'p-2',
            protein_name: 'Actin',
            uniprot_id: 'P60709',
            pdb_id: '1ATN',
            organism: 'Homo sapiens',
            length: 375,
            category: 'structural',
            description: 'Protein 2',
          },
          {
            protein_id: 'p-3',
            protein_name: 'Tubulin',
            uniprot_id: 'Q71U36',
            pdb_id: '1JFF',
            organism: 'Homo sapiens',
            length: 451,
            category: 'structural',
            description: 'Protein 3',
          },
        ]),
      })

      const result = await searchCatalogProteins({
        search: 'ubi',
        category: 'structural',
        minLength: 50,
        maxLength: 500,
        limit: 2,
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.local/proteins/?search=ubi&category=structural&min_length=50&max_length=500&limit=2',
        expect.anything(),
      )
      expect(result).toHaveLength(2)
      expect(result.map((item) => item.proteinId)).toEqual(['p-1', 'p-2'])
    })

    it('calls the base endpoint when no filters are provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const result = await searchCatalogProteins()

      expect(result).toEqual([])
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.local/proteins/',
        expect.anything(),
      )
    })
  })

  describe('pollJob', () => {
    it('returns immediately if job is COMPLETED', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'COMPLETED' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'COMPLETED', pdb_file: 'ATOM' }),
        })

      const result = await pollJob('j-1', { intervalMs: 10 })
      expect(result.status).toBe('COMPLETED')
    })

    it('polls until COMPLETED', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'PENDING' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'RUNNING' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'COMPLETED' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'COMPLETED', pdb_file: 'ATOM' }),
        })

      const result = await pollJob('j-1', { intervalMs: 10 })
      expect(result.status).toBe('COMPLETED')
      expect(global.fetch).toHaveBeenCalledTimes(4)
    })

    it('stops on FAILED status', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'PENDING' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'FAILED' }),
        })

      const result = await pollJob('j-1', { intervalMs: 10 })
      expect(result.status).toBe('FAILED')
    })

    it('stops on CANCELLED status', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'PENDING' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'CANCELLED' }),
        })

      const result = await pollJob('j-1', { intervalMs: 10 })
      expect(result.status).toBe('CANCELLED')
    })

    it('respects AbortSignal', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'PENDING' }),
      })

      const controller = new AbortController()
      controller.abort()

      await expect(pollJob('j-1', { signal: controller.signal, intervalMs: 10 }))
        .rejects.toThrow()
    })
  })
})
