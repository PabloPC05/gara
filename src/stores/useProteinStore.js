import { create } from 'zustand'

/**
 * Estado global compartido entre sidebar, visor 3D, drawer de detalles y
 * cliente API. El catálogo `proteinsById` es la fuente de verdad unificada:
 * tanto el modo mock como el modo real lo alimentan con `UnifiedProtein`.
 *
 * - `proteinsById`: catálogo disponible (por id estable).
 * - `selectedProteinIds`: IDs actualmente seleccionados (soporta multi-selección, max 2 para split-screen).
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

  /** Reemplaza todo el catálogo. Preserva los IDs seleccionados que sigan
   *  existiendo en el nuevo catálogo, manteniendo el orden original. */
  replaceCatalog: (proteins) => {
    const next = {}
    for (const p of proteins) {
      if (p?.id) next[p.id] = p
    }
    set((state) => {
      const nextSelection = state.selectedProteinIds.filter((id) => id in next)
      return {
        proteinsById: next,
        selectedProteinIds: nextSelection,
        activeProteinId: nextSelection.length > 0
          ? nextSelection[nextSelection.length - 1]
          : null,
        loadingById: {},
        errorById: {},
      }
    })
  },

  /** Elimina una proteína del catálogo y limpia su ID de la selección. */
  removeProtein: (id) =>
    set((state) => {
      const nextCatalog = omitKey(state.proteinsById, id)
      const nextSelection = state.selectedProteinIds.filter((pid) => pid !== id)
      return {
        proteinsById: nextCatalog,
        selectedProteinIds: nextSelection,
        activeProteinId:
          nextSelection.length > 0
            ? nextSelection[nextSelection.length - 1]
            : null,
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

  // ── Selección (multi-selección, max 2 para split-screen) ────────────

  /** Reemplaza la selección completa con un nuevo array de IDs.
   *  Filtra IDs inválidos, deduplica y aplica el límite de 2 (split-screen). */
  setSelectedProteinIds: (ids) => {
    const newIds = normalizeSelection(ids)
    set({
      selectedProteinIds: newIds,
      activeProteinId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
    })
  },

  /** Toggle de un ID dentro de la selección:
   *  - Si ya está → lo quita del array.
   *  - Si no está → lo añade al final (normalizeSelection respeta el límite de 2). */
  toggleProteinSelection: (id) => {
    if (typeof id !== 'string' || id.length === 0) return
    const { selectedProteinIds } = get()
    const isAlreadySelected = selectedProteinIds.includes(id)
    const nextIds = isAlreadySelected
      ? selectedProteinIds.filter((pid) => pid !== id)
      : normalizeSelection([...selectedProteinIds, id])
    set({
      selectedProteinIds: nextIds,
      activeProteinId: nextIds.length > 0 ? nextIds[nextIds.length - 1] : null,
    })
  },

  /** Selecciona un único ID, reemplazando cualquier selección previa.
   *  Mantiene compatibilidad con componentes que esperan selección simple. */
  setActiveProteinId: (id) => {
    if (typeof id !== 'string' || id.length === 0) {
      set({ selectedProteinIds: [], activeProteinId: null })
      return
    }
    set({ selectedProteinIds: [id], activeProteinId: id })
  },

  clearSelection: () => set({ selectedProteinIds: [], activeProteinId: null }),
}))

// ── Helpers ─────────────────────────────────────────────────────────

function omitKey(obj, key) {
  if (!(key in obj)) return obj
  const next = { ...obj }
  delete next[key]
  return next
}

/**
 * Filtra IDs inválidos, elimina duplicados preservando el orden de inserción,
 * y aplica el límite de 2 IDs (modo comparación split-screen).
 */
function normalizeSelection(ids) {
  const list = Array.isArray(ids) ? ids : [ids]
  const seen = new Set()
  const result = []
  for (const id of list) {
    if (typeof id === 'string' && id.length > 0 && !seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }
  return result.slice(0, 2)
}
