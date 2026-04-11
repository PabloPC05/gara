import { useProteinStore } from '@/stores/useProteinStore'

const mockProtein = (id = 'test-1') => ({
  id,
  name: 'Test Protein',
  uniprotId: 'P00001',
  pdbId: '1TST',
  length: 100,
  organism: 'Homo sapiens',
  plddtMean: 85.0,
  meanPae: 4.2,
  biological: null,
  pdbData: null,
  source: 'mock',
  _raw: {},
})

const mockProtein2 = () => mockProtein('test-2')

describe('useProteinStore', () => {
  beforeEach(() => {
    useProteinStore.setState({
      proteinsById: {},
      selectedProteinIds: [],
      activeProteinId: null,
      loadingById: {},
      errorById: {},
    })
  })

  describe('upsertProtein', () => {
    it('adds a new protein to the catalog', () => {
      const protein = mockProtein()
      useProteinStore.getState().upsertProtein(protein)

      const state = useProteinStore.getState()
      expect(state.proteinsById['test-1']).toEqual(protein)
    })

    it('updates an existing protein', () => {
      useProteinStore.getState().upsertProtein(mockProtein())
      useProteinStore.getState().upsertProtein({ ...mockProtein(), name: 'Updated' })

      expect(useProteinStore.getState().proteinsById['test-1'].name).toBe('Updated')
    })

    it('ignores entries without id', () => {
      useProteinStore.getState().upsertProtein({ name: 'No ID' })
      expect(Object.keys(useProteinStore.getState().proteinsById)).toHaveLength(0)
    })

    it('clears loading and error state for the upserted protein', () => {
      useProteinStore.getState().setProteinLoading('test-1')
      useProteinStore.getState().setProteinError('test-1', 'some error')
      useProteinStore.getState().upsertProtein(mockProtein())

      const state = useProteinStore.getState()
      expect(state.loadingById['test-1']).toBeUndefined()
      expect(state.errorById['test-1']).toBeUndefined()
    })
  })

  describe('replaceCatalog', () => {
    it('replaces the entire catalog', () => {
      useProteinStore.getState().upsertProtein(mockProtein())
      useProteinStore.getState().replaceCatalog([mockProtein2()])

      const state = useProteinStore.getState()
      expect(Object.keys(state.proteinsById)).toEqual(['test-2'])
    })

    it('filters out entries without id', () => {
      useProteinStore.getState().replaceCatalog([
        mockProtein(),
        { name: 'No ID' },
        mockProtein2(),
      ])

      expect(Object.keys(useProteinStore.getState().proteinsById)).toHaveLength(2)
    })

    it('resets loading and error state', () => {
      useProteinStore.getState().setProteinLoading('x')
      useProteinStore.getState().setProteinError('y', 'err')
      useProteinStore.getState().replaceCatalog([mockProtein()])

      const state = useProteinStore.getState()
      expect(state.loadingById).toEqual({})
      expect(state.errorById).toEqual({})
    })
  })

  describe('removeProtein', () => {
    it('removes protein from catalog and selection', () => {
      const p1 = mockProtein()
      const p2 = mockProtein2()
      useProteinStore.getState().replaceCatalog([p1, p2])
      useProteinStore.getState().setSelectedProteinIds(['test-1', 'test-2'])

      useProteinStore.getState().removeProtein('test-1')

      const state = useProteinStore.getState()
      expect(state.proteinsById['test-1']).toBeUndefined()
      expect(state.selectedProteinIds).toEqual(['test-2'])
      expect(state.activeProteinId).toBe('test-2')
    })

    it('sets activeProteinId to null when selection becomes empty', () => {
      useProteinStore.getState().upsertProtein(mockProtein())
      useProteinStore.getState().setActiveProteinId('test-1')

      useProteinStore.getState().removeProtein('test-1')

      const state = useProteinStore.getState()
      expect(state.selectedProteinIds).toEqual([])
      expect(state.activeProteinId).toBeNull()
    })
  })

  describe('selection', () => {
    it('setSelectedProteinIds sets both selected and active', () => {
      useProteinStore.getState().setSelectedProteinIds(['a', 'b', 'c'])

      const state = useProteinStore.getState()
      expect(state.selectedProteinIds).toEqual(['a', 'b', 'c'])
      expect(state.activeProteinId).toBe('c')
    })

    it('setSelectedProteinIds wraps single id into array', () => {
      useProteinStore.getState().setSelectedProteinIds('single')

      expect(useProteinStore.getState().selectedProteinIds).toEqual(['single'])
    })

    it('toggleProteinSelection adds when not present', () => {
      useProteinStore.getState().setSelectedProteinIds(['a'])
      useProteinStore.getState().toggleProteinSelection('b')

      expect(useProteinStore.getState().selectedProteinIds).toEqual(['a', 'b'])
      expect(useProteinStore.getState().activeProteinId).toBe('b')
    })

    it('toggleProteinSelection removes when present', () => {
      useProteinStore.getState().setSelectedProteinIds(['a', 'b'])
      useProteinStore.getState().toggleProteinSelection('a')

      expect(useProteinStore.getState().selectedProteinIds).toEqual(['b'])
      expect(useProteinStore.getState().activeProteinId).toBe('b')
    })

    it('setActiveProteinId replaces selection with single id', () => {
      useProteinStore.getState().setSelectedProteinIds(['a', 'b'])
      useProteinStore.getState().setActiveProteinId('c')

      expect(useProteinStore.getState().selectedProteinIds).toEqual(['c'])
      expect(useProteinStore.getState().activeProteinId).toBe('c')
    })

    it('clearSelection resets everything', () => {
      useProteinStore.getState().setSelectedProteinIds(['a', 'b'])
      useProteinStore.getState().clearSelection()

      const state = useProteinStore.getState()
      expect(state.selectedProteinIds).toEqual([])
      expect(state.activeProteinId).toBeNull()
    })
  })

  describe('loading and error state', () => {
    it('setProteinLoading marks a protein as loading', () => {
      useProteinStore.getState().setProteinLoading('job-1')

      expect(useProteinStore.getState().loadingById['job-1']).toBe(true)
    })

    it('setProteinLoading clears previous error for that protein', () => {
      useProteinStore.getState().setProteinError('job-1', 'err')
      useProteinStore.getState().setProteinLoading('job-1')

      expect(useProteinStore.getState().errorById['job-1']).toBeUndefined()
    })

    it('setProteinError stores error and clears loading', () => {
      useProteinStore.getState().setProteinLoading('job-1')
      useProteinStore.getState().setProteinError('job-1', 'Network error')

      const state = useProteinStore.getState()
      expect(state.loadingById['job-1']).toBeUndefined()
      expect(state.errorById['job-1']).toBe('Network error')
    })
  })
})
