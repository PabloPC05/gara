import { create } from 'zustand';

/**
 * Store de análisis molecular.
 * Gestiona el modo activo (distancias / puentes de hidrógeno),
 * los loci pendientes para la medición en curso y un trigger de limpieza.
 */
const useAnalysisStore = create((set) => ({
  /** @type {null | 'distance' | 'hbonds'} */
  mode: null,

  /**
   * Loci acumulados para la medición de distancia en curso.
   * Cuando llega el segundo, MolecularViewer dibuja la línea y se vacía.
   * @type {import('molstar/lib/mol-model/structure').StructureElement.Loci[]}
   */
  pendingLoci: [],

  /**
   * Incrementarlo dispara la limpieza total en MolecularViewer
   * (borra medidas de distancia y representaciones de interacciones).
   */
  clearTrigger: 0,

  /** Activa/desactiva un modo; salir del mismo modo lo desactiva. */
  toggleMode: (mode) =>
    set((s) => ({ mode: s.mode === mode ? null : mode, pendingLoci: [] })),

  /** Añade un loci a la lista de pendientes (max 2 antes de dibujar). */
  addPendingLocus: (loci) =>
    set((s) => ({ pendingLoci: [...s.pendingLoci, loci] })),

  /** Vacía la lista de pendientes sin cambiar el modo. */
  clearPendingLoci: () => set({ pendingLoci: [] }),

  /** Limpia todo: sale del modo activo y señaliza a MolecularViewer que borre. */
  clearAll: () =>
    set((s) => ({ mode: null, pendingLoci: [], clearTrigger: s.clearTrigger + 1 })),
}));

export default useAnalysisStore;
