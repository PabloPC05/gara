import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'

import { __resetInitialCatalogCacheForTests, SearchSection } from '@/components/sidebar/SearchSection'
import { JOB_PANEL_KEYS, useJobStatusStore } from '@/stores/useJobStatusStore'

const mockSearchCatalogProteins = vi.fn()
const mockLoadCatalogProtein = vi.fn()

vi.mock('@/lib/catalogProteinLoader', () => ({
  loadCatalogProtein: (...args) => mockLoadCatalogProtein(...args),
}))

vi.mock('@/lib/apiClient', () => ({
  searchCatalogProteins: (...args) => mockSearchCatalogProteins(...args),
}))

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

describe('SearchSection', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    __resetInitialCatalogCacheForTests()
    mockSearchCatalogProteins.mockReset()
    mockLoadCatalogProtein.mockReset()
    useJobStatusStore.setState({ panelsByKey: {} })
  })

  afterEach(() => {
    cleanup()
  })

  it('caches the initial catalog list and reuses it after remount', async () => {
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

    const { unmount } = render(<SearchSection />)

    await waitFor(() => {
      expect(mockSearchCatalogProteins).toHaveBeenCalledWith({
        limit: 10,
      })
    })

    expect(await screen.findByText('Ubiquitin')).toBeInTheDocument()

    expect(mockSearchCatalogProteins).toHaveBeenCalledTimes(1)
    expect(
      JSON.parse(window.sessionStorage.getItem('catalog:initial-results:v1')),
    ).toEqual([
      expect.objectContaining({ proteinId: 'p-1', proteinName: 'Ubiquitin' }),
    ])

    unmount()
    mockSearchCatalogProteins.mockClear()

    render(<SearchSection />)

    expect(screen.getByText('Ubiquitin')).toBeInTheDocument()

    await act(async () => {
      await wait(400)
    })

    expect(mockSearchCatalogProteins).not.toHaveBeenCalled()
  })

  it('keeps showing the job panel after remount while the catalog load is still in progress', async () => {
    let resolveLoad
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
    mockLoadCatalogProtein.mockImplementation((proteinId) => new Promise((resolve) => {
      useJobStatusStore.getState().upsertJobPanel(JOB_PANEL_KEYS.catalog, {
        status: 'RUNNING',
        error: null,
        subjectId: proteinId,
        jobId: 'job-1',
      })
      resolveLoad = () => {
        useJobStatusStore.getState().clearJobPanel(JOB_PANEL_KEYS.catalog)
        resolve('protein-1')
      }
    }))

    const { unmount } = render(<SearchSection />)

    expect(await screen.findByText('Ubiquitin')).toBeInTheDocument()
    await act(async () => {
      screen.getByRole('button', { name: /ubiquitin/i }).click()
      await Promise.resolve()
    })

    expect(screen.getByText('RUNNING')).toBeInTheDocument()

    unmount()
    render(<SearchSection />)

    expect(screen.getByText('RUNNING')).toBeInTheDocument()

    await act(async () => {
      resolveLoad?.()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(screen.queryByText('RUNNING')).not.toBeInTheDocument()
    })
  })

  it('keeps FAILED visible after remount until dismissed', async () => {
    let rejectLoad
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
    mockLoadCatalogProtein.mockImplementation((proteinId) => new Promise((_, reject) => {
      useJobStatusStore.getState().upsertJobPanel(JOB_PANEL_KEYS.catalog, {
        status: 'RUNNING',
        error: null,
        subjectId: proteinId,
        jobId: 'job-1',
      })
      rejectLoad = (error) => {
        useJobStatusStore.getState().upsertJobPanel(JOB_PANEL_KEYS.catalog, {
          status: 'FAILED',
          error: error.message,
          subjectId: null,
          jobId: 'job-1',
        })
        reject(error)
      }
    }))

    const { unmount } = render(<SearchSection />)

    expect(await screen.findByText('Ubiquitin')).toBeInTheDocument()
    await act(async () => {
      screen.getByRole('button', { name: /ubiquitin/i }).click()
      await Promise.resolve()
    })

    unmount()
    render(<SearchSection />)

    await act(async () => {
      rejectLoad?.(new Error('Boom'))
      await Promise.resolve()
    })

    expect(await screen.findByText('FAILED')).toBeInTheDocument()
    expect(screen.getByText('Boom')).toBeInTheDocument()

    await act(async () => {
      screen.getByRole('button', { name: /descartar/i }).click()
    })

    await waitFor(() => {
      expect(screen.queryByText('FAILED')).not.toBeInTheDocument()
    })
  })

  it('uses filtered API results while filters are active and restores the initial list when cleared', async () => {
    mockSearchCatalogProteins
      .mockResolvedValueOnce([
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
      .mockResolvedValueOnce([
        {
          proteinId: 'p-2',
          proteinName: 'Hemoglobin',
          organism: 'Homo sapiens',
          uniprotId: 'P69905',
          pdbId: '4HHB',
          length: 142,
          category: 'transporter',
          description: 'Oxygen transport protein',
        },
      ])

    render(<SearchSection />)

    expect(await screen.findByText('Ubiquitin')).toBeInTheDocument()

    fireEvent.change(
      screen.getByPlaceholderText(/search proteins by name, organism or tag/i),
      { target: { value: 'hemo' } },
    )

    await waitFor(() => {
      expect(mockSearchCatalogProteins).toHaveBeenCalledWith({
        search: 'hemo',
        category: '',
        minLength: '',
        maxLength: '',
      })
    })

    expect(await screen.findByText('Hemoglobin')).toBeInTheDocument()

    await act(async () => {
      screen.getByRole('button', { name: /clear filters/i }).click()
      await Promise.resolve()
    })

    expect(screen.getByText('Ubiquitin')).toBeInTheDocument()
    expect(screen.queryByText('Hemoglobin')).not.toBeInTheDocument()

    await act(async () => {
      await wait(400)
    })

    expect(mockSearchCatalogProteins).toHaveBeenCalledTimes(2)
  })
})
