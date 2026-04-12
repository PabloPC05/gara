import { act, render, screen, waitFor, cleanup } from '@testing-library/react'

import { __resetInitialCatalogCacheForTests, SearchSection } from '@/components/sidebar/SearchSection'
import { JOB_PANEL_KEYS, useJobStatusStore } from '@/stores/useJobStatusStore'
import { useProteinStore } from '@/stores/useProteinStore'

const mockSearchCatalogProteins = vi.fn()
const mockGetCatalogProteinDetail = vi.fn()
const mockSubmitJob = vi.fn()
const mockPollJob = vi.fn()
const mockApiToUnified = vi.fn()

vi.mock('@/lib/apiClient', () => ({
  ApiError: class ApiError extends Error {},
  searchCatalogProteins: (...args) => mockSearchCatalogProteins(...args),
  getCatalogProteinDetail: (...args) => mockGetCatalogProteinDetail(...args),
  submitJob: (...args) => mockSubmitJob(...args),
  pollJob: (...args) => mockPollJob(...args),
}))

vi.mock('@/lib/proteinAdapter', () => ({
  apiToUnified: (...args) => mockApiToUnified(...args),
}))

describe('SearchSection catalog job lifecycle', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    __resetInitialCatalogCacheForTests()
    mockSearchCatalogProteins.mockReset()
    mockGetCatalogProteinDetail.mockReset()
    mockSubmitJob.mockReset()
    mockPollJob.mockReset()
    mockApiToUnified.mockReset()
    useJobStatusStore.setState({ panelsByKey: {} })
    useProteinStore.setState({
      selectedProteinIds: [],
      activeProteinId: null,
      proteinsById: {},
      loadingById: {},
      errorById: {},
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps status in the store across remounts using the real loader flow', async () => {
    let resolvePoll

    mockSearchCatalogProteins.mockResolvedValue([
      {
        proteinId: 'p-1',
        proteinName: 'Ubiquitin',
        organism: 'Homo sapiens',
        uniprotId: 'P0CG47',
        pdbId: '1UBQ',
        length: 76,
        category: 'structural',
        description: 'Small regulatory protein',
      },
    ])
    mockGetCatalogProteinDetail.mockResolvedValue({
      proteinId: 'p-1',
      proteinName: 'Ubiquitin',
      organism: 'Homo sapiens',
      fastaReady: '>test\nAAAA',
    })
    mockSubmitJob.mockResolvedValue({ jobId: 'job-1' })
    mockPollJob.mockImplementation((_, { onStatusChange } = {}) => new Promise((resolve) => {
      onStatusChange?.('RUNNING')
      resolvePoll = resolve
    }))
    mockApiToUnified.mockReturnValue({ id: 'loaded-1' })

    const { unmount } = render(<SearchSection />)

    expect(await screen.findByText('Ubiquitin')).toBeInTheDocument()
    await act(async () => {
      screen.getByRole('button', { name: /ubiquitin/i }).click()
      await Promise.resolve()
    })

    expect(screen.getByText('RUNNING')).toBeInTheDocument()
    expect(useJobStatusStore.getState().panelsByKey[JOB_PANEL_KEYS.catalog]?.status).toBe('RUNNING')

    unmount()
    render(<SearchSection />)

    expect(screen.getByText('RUNNING')).toBeInTheDocument()
    expect(useJobStatusStore.getState().panelsByKey[JOB_PANEL_KEYS.catalog]?.status).toBe('RUNNING')

    await act(async () => {
      resolvePoll?.({ status: 'COMPLETED', jobId: 'job-1' })
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(useJobStatusStore.getState().panelsByKey[JOB_PANEL_KEYS.catalog]).toBeUndefined()
    })
  })
})
