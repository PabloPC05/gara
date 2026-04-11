import { create } from 'zustand'

export const useUIStore = create((set) => ({
  activeTab: 'plus', // 'plus' | 'files' | 'search' | null
  setActiveTab: (tab) => set((state) => ({
    activeTab: state.activeTab === tab ? null : tab
  })),
  sceneBackground: '#000000', // Default dark background
  setSceneBackground: (color) => set({ sceneBackground: color }),

  // Viewer representation ('cartoon' | 'gaussian-surface' | 'spacefill' | 'ball-and-stick')
  viewerRepresentation: 'cartoon',
  setViewerRepresentation: (repr) => set({ viewerRepresentation: repr }),

  // Viewer lighting preset ('ao' | 'flat' | 'studio')
  viewerLighting: 'ao',
  setViewerLighting: (lighting) => set({ viewerLighting: lighting }),
}))
