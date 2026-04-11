import { create } from 'zustand'

/**
 * Estado global compartido entre sidebar, visor 3D, drawer de detalles y
 * cliente API. El catálogo `proteinsById` es la fuente de verdad unificada:
 * tanto el modo mock como el modo real lo alimentan con `UnifiedProtein`.
 *
 * - `proteinsById`: catálogo disponible (por id estable).
 * - `selectedProteinIds`: IDs actualmente seleccionados por el usuario.
 * - `activeProteinId`: último ID seleccionado (compat con consumidores single).
 * - `loadingById` / `errorById`: estado del ciclo de carga contra la API real.
 */
export const useProteinStore = create((set, get) => ({
  proteinsById: {},
  selectedProteinIds: [],
  activeProteinId: null,
  loadingById: {},
  errorById: {},

  // ── Catálogo ────────────────────────────────────────────────────────

  upsertProtein: (protein) => {
    if (!protein?.id) return
    set((state) => ({
      proteinsById: { ...state.proteinsById, [protein.id]: protein },
      loadingById: omitKey(state.loadingById, protein.id),
      errorById: omitKey(state.errorById, protein.id),
    }))
  },

  replaceCatalog: (proteins) => {
    const next = {}
    for (const p of proteins) {
      if (p?.id) next[p.id] = p
    }
    set({ proteinsById: next, loadingById: {}, errorById: {} })
  },

  removeProtein: (id) =>
    set((state) => {
      const nextCatalog = omitKey(state.proteinsById, id)
      const nextSelection = state.selectedProteinIds.filter((pid) => pid !== id)
      return {
        proteinsById: nextCatalog,
        selectedProteinIds: nextSelection,
        activeProteinId:
          nextSelection.length > 0 ? nextSelection[nextSelection.length - 1] : null,
        loadingById: omitKey(state.loadingById, id),
        errorById: omitKey(state.errorById, id),
      }
    }),

  // ── Estado de carga ─────────────────────────────────────────────────

  setProteinLoading: (id) =>
    set((state) => ({
      loadingById: { ...state.loadingById, [id]: true },
      errorById: omitKey(state.errorById, id),
    })),

  setProteinError: (id, message) =>
    set((state) => ({
      loadingById: omitKey(state.loadingById, id),
      errorById: { ...state.errorById, [id]: message },
    })),

  // ── Selección ───────────────────────────────────────────────────────

  setSelectedProteinIds: (ids) => {
    const newIds = Array.isArray(ids) ? ids : [ids]
    set({
      selectedProteinIds: newIds,
      activeProteinId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
    })
  },

  toggleProteinSelection: (id) => {
    const { selectedProteinIds } = get()
    const newIds = selectedProteinIds.includes(id)
      ? selectedProteinIds.filter((pid) => pid !== id)
      : [...selectedProteinIds, id]
    set({
      selectedProteinIds: newIds,
      activeProteinId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
    })
  },

  setActiveProteinId: (id) => {
    set({ selectedProteinIds: [id], activeProteinId: id })
  },

  clearSelection: () => set({ selectedProteinIds: [], activeProteinId: null }),
}))

function omitKey(obj, key) {
  if (!(key in obj)) return obj
  const next = { ...obj }
  delete next[key]
  return next
}
