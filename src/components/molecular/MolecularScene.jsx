import MolecularViewer from '@/components/molecular/MolecularViewer'
import { useProteinStore } from '@/stores/useProteinStore'

/**
 * MolecularScene — Orquestador del layout del area de visualizacion 3D.
 *
 * - 0 proteinas seleccionadas -> estado vacio (el logo lo muestra ViewerCanvas internamente).
 * - 1 proteina seleccionada   -> visor unico a pantalla completa.
 * - >= 2 proteinas            -> split-screen 50/50 con dos visores Mol* completamente
 *                               independientes (camara, rotacion y zoom separados).
 *
 * Cada instancia de MolecularViewer crea su propio PluginContext de Mol*, por lo que
 * no hay sincronizacion accidental de camaras entre los dos paneles.
 *
 * Acepta props adicionales que se reenvian a cada MolecularViewer.
 */
export default function MolecularScene(props) {
  const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds)

  // -- Sin seleccion: estado vacio ------------------------------------------------
  // ViewerCanvas muestra el logo cuando hasSelection=false, asi que simplemente
  // renderizamos un MolecularViewer sin proteinId para aprovechar ese estado.
  if (selectedProteinIds.length === 0) {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <MolecularViewer {...props} proteinId={null} />
      </div>
    )
  }

  // -- Una proteina: visor unico a pantalla completa ------------------------------
  if (selectedProteinIds.length === 1) {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <MolecularViewer {...props} proteinId={selectedProteinIds[0]} />
      </div>
    )
  }

  // -- Dos o mas proteinas: split-screen 50/50 ------------------------------------
  // Solo se renderizan los dos primeros IDs aunque haya mas seleccionados.
  // min-w-0 y min-h-0 evitan que los visores desborden su celda del grid.
  return (
    <div className="grid grid-cols-2 w-full h-full overflow-hidden">
      {/* Panel izquierdo */}
      <div className="relative overflow-hidden min-w-0 min-h-0">
        <MolecularViewer {...props} proteinId={selectedProteinIds[0]} />
      </div>

      {/* Separador central */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300/60 z-20 pointer-events-none" />

      {/* Panel derecho */}
      <div className="relative overflow-hidden min-w-0 min-h-0">
        <MolecularViewer {...props} proteinId={selectedProteinIds[1]} />
      </div>
    </div>
  )
}
