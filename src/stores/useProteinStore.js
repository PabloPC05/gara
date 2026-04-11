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
    set((state) => {
      const nextSelection = state.activeProteinId && next[state.activeProteinId]
        ? [state.activeProteinId]
        : []
      return {
        proteinsById: next,
        selectedProteinIds: nextSelection,
        activeProteinId: nextSelection[0] ?? null,
        loadingById: {},
        errorById: {},
      }
    })
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
    const newIds = normalizeSelection(ids)
    set({ selectedProteinIds: newIds, activeProteinId: newIds[0] ?? null })
  },

  toggleProteinSelection: (id) => {
    const { activeProteinId } = get()
    const newIds = activeProteinId === id ? [] : normalizeSelection(id)
    set({ selectedProteinIds: newIds, activeProteinId: newIds[0] ?? null })
  },

  setActiveProteinId: (id) => {
    const nextSelection = normalizeSelection(id)
    set({ selectedProteinIds: nextSelection, activeProteinId: nextSelection[0] ?? null })
  },

  clearSelection: () => set({ selectedProteinIds: [], activeProteinId: null }),
}))

function omitKey(obj, key) {
  if (!(key in obj)) return obj
  const next = { ...obj }
  delete next[key]
  return next
}

// Política single-selection: solo se mantiene el primer ID válido de la lista.
function normalizeSelection(ids) {
  const list = Array.isArray(ids) ? ids : [ids]
  const firstValidId = list.find((id) => typeof id === 'string' && id.length > 0)
  return firstValidId ? [firstValidId] : []
}
