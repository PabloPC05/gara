import { create } from 'zustand'

export const useUIStore = create((set) => ({
  activeTab: 'plus', // 'plus' | 'files' | 'search' | null
  setActiveTab: (tab) => set((state) => ({
    activeTab: state.activeTab === tab ? null : tab
  })),
}))
