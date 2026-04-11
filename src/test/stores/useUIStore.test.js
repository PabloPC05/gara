import { useUIStore } from '@/stores/useUIStore'

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeTab: 'plus',
      sceneBackground: '#000000',
      viewerRepresentation: 'cartoon',
      viewerLighting: 'ao',
    })
  })

  describe('activeTab', () => {
    it('toggles tab off when same tab clicked', () => {
      useUIStore.getState().setActiveTab('plus')
      expect(useUIStore.getState().activeTab).toBeNull()
    })

    it('switches to a different tab', () => {
      useUIStore.getState().setActiveTab('files')
      expect(useUIStore.getState().activeTab).toBe('files')
    })

    it('toggles between tabs correctly', () => {
      useUIStore.getState().setActiveTab('files')
      useUIStore.getState().setActiveTab('search')

      expect(useUIStore.getState().activeTab).toBe('search')
    })
  })

  describe('sceneBackground', () => {
    it('sets a new background color', () => {
      useUIStore.getState().setSceneBackground('#ffffff')
      expect(useUIStore.getState().sceneBackground).toBe('#ffffff')
    })
  })

  describe('viewerRepresentation', () => {
    it('changes representation', () => {
      useUIStore.getState().setViewerRepresentation('gaussian-surface')
      expect(useUIStore.getState().viewerRepresentation).toBe('gaussian-surface')
    })
  })

  describe('viewerLighting', () => {
    it('changes lighting preset', () => {
      useUIStore.getState().setViewerLighting('studio')
      expect(useUIStore.getState().viewerLighting).toBe('studio')
    })
  })
})
