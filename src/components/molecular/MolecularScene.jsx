import MolecularViewer from '@/components/molecular/MolecularViewer'

/**
 * Contenedor del visor 3D. Renderiza directamente MolecularViewer (Mol*)
 * que lee `proteinsById` del store global y sincroniza con las entradas del sidebar.
 */
export default function MolecularScene(props) {
  return <MolecularViewer {...props} />
}
