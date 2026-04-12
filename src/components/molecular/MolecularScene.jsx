import MolecularViewer from '@/components/molecular/MolecularViewer'
import { useProteinStore } from '@/stores/useProteinStore'

/**
 * MolecularScene — Orquestador del layout del área de visualización 3D.
 *
 * - 0 proteínas seleccionadas → estado vacío (el logo lo muestra ViewerCanvas internamente).
 * - 1 proteína seleccionada   → visor único a pantalla completa.
 * - ≥ 2 proteínas             → split-screen 50/50 con dos visores Mol* completamente
 *                               independientes (cámara, rotación y zoom separados).
 *
 * Cada instancia de MolecularViewer crea su propio PluginContext de Mol*, por lo que
 * no hay sincronización accidental de cámaras entre los dos paneles.
 */
export default function MolecularScene() {
  const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds)

  // ── Sin selección: estado vacío ─────────────────────────────────────────────
  // ViewerCanvas muestra el logo cuando hasSelection=false, así que simplemente
  // renderizamos un MolecularViewer sin proteinId para aprovechar ese estado.
  if (selectedProteinIds.length === 0) {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <MolecularViewer proteinId={null} />
      </div>
    )
  }

  // ── Una proteína: visor único a pantalla completa ───────────────────────────
  if (selectedProteinIds.length === 1) {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <MolecularViewer proteinId={selectedProteinIds[0]} />
      </div>
    )
  }

  // ── Dos o más proteínas: split-screen 50/50 ─────────────────────────────────
  // Solo se renderizan los dos primeros IDs aunque haya más seleccionados.
  // min-w-0 y min-h-0 evitan que los visores desborden su celda del grid.
  return (
    <div className="grid grid-cols-2 w-full h-full overflow-hidden">
      {/* Panel izquierdo */}
      <div className="relative overflow-hidden min-w-0 min-h-0">
        <MolecularViewer proteinId={selectedProteinIds[0]} />
      </div>

      {/* Separador central */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300/60 z-20 pointer-events-none" />

      {/* Panel derecho */}
      <div className="relative overflow-hidden min-w-0 min-h-0">
        <MolecularViewer proteinId={selectedProteinIds[1]} />
      </div>
    </div>
  )
}
