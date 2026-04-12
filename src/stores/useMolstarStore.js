import { create } from 'zustand'

export const useMolstarStore = create((set) => ({
  pluginRef: null,
  setPluginRef: (ref) => set({ pluginRef: ref }),
}))
