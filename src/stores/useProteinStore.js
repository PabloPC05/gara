import { create } from 'zustand'

/**
 * Estado global compartido entre el sidebar y el visor 3D.
 *
 * - `selectedProteinIds`: Array de IDs de las proteínas seleccionadas.
 * - `activeProteinId`: El último ID seleccionado (para compatibilidad).
 */
export const useProteinStore = create((set, get) => ({
  selectedProteinIds: [],
  activeProteinId: null,

  // Setter directo (ej. para click simple que limpia el resto)
  setSelectedProteinIds: (ids) => {
    const newIds = Array.isArray(ids) ? ids : [ids]
    set({
      selectedProteinIds: newIds,
      activeProteinId: newIds.length > 0 ? newIds[newIds.length - 1] : null
    })
  },

  // Añadir/Quitar (para Shift + Click)
  toggleProteinSelection: (id) => {
    const { selectedProteinIds } = get()
    let newIds
    if (selectedProteinIds.includes(id)) {
      newIds = selectedProteinIds.filter(pid => pid !== id)
    } else {
      newIds = [...selectedProteinIds, id]
    }
    set({
      selectedProteinIds: newIds,
      activeProteinId: newIds.length > 0 ? newIds[newIds.length - 1] : null
    })
  },

  setActiveProteinId: (id) => {
    set({
      selectedProteinIds: [id],
      activeProteinId: id
    })
  },

  clearSelection: () => set({ selectedProteinIds: [], activeProteinId: null }),
}))
