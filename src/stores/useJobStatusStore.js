import { create } from 'zustand'

export const JOB_PANEL_KEYS = {
  catalog: 'catalog',
  filesFasta: 'files-fasta',
  aminoBuilder: 'amino-builder',
}

export const ACTIVE_JOB_STATUSES = new Set(['PENDING', 'RUNNING'])
export const DISMISSIBLE_JOB_STATUSES = new Set(['FAILED', 'CANCELLED'])

export const useJobStatusStore = create((set) => ({
  panelsByKey: {},

  upsertJobPanel: (key, patch) =>
    set((state) => ({
      panelsByKey: {
        ...state.panelsByKey,
        [key]: {
          ...(state.panelsByKey[key] ?? {}),
          ...patch,
        },
      },
    })),

  clearJobPanel: (key) =>
    set((state) => {
      if (!(key in state.panelsByKey)) return state
      const nextPanels = { ...state.panelsByKey }
      delete nextPanels[key]
      return { panelsByKey: nextPanels }
    }),
}))

export function getJobPanel(key) {
  return useJobStatusStore.getState().panelsByKey[key] ?? null
}
