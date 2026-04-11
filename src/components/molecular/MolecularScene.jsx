import MolecularUniverseMock from './MolecularUniverseMock'
import MolecularViewer from './MolecularViewer'
import { USE_MOCK } from '../../lib/appConfig'

/**
 * Gate de modo. En desarrollo sin backend (`VITE_USE_MOCK=true`, default)
 * se renderiza el universo mock con hélices prefabricadas. Cuando la API
 * está disponible, se pasa al viewer real que lee `proteinsById` del store.
 */
export default function MolecularScene(props) {
  const Component = USE_MOCK ? MolecularUniverseMock : MolecularViewer
  return <Component {...props} />
}
