import { useCallback, useMemo, useRef } from 'react'
import {
  FileBrowser,
  FileNavbar,
  FileToolbar,
  FileList,
  FileContextMenu,
  ChonkyActions,
  defineFileAction,
  ChonkyIconName,
  setChonkyDefaults,
} from 'chonky'
import { ChonkyIconFA } from 'chonky-icon-fontawesome'
import { useFileStore } from '@/stores/useFileStore'

// Registrar iconos FontAwesome una sola vez (a nivel de módulo, no dentro del componente)
setChonkyDefaults({ iconComponent: ChonkyIconFA })

// ── Acción personalizada: subir archivo ──────────────────────────────────────
const UploadAction = defineFileAction({
  id: 'upload_file',
  button: {
    name: 'Subir archivo',
    toolbar: true,
    icon: ChonkyIconName.upload,
  },
})

/**
 * FileManager — Explorador de archivos basado en Chonky.
 *
 * Integra:
 *  - Navegación por carpetas (doble clic)
 *  - Subida de archivos locales (.fasta, .pdb, .cif, .session)
 *  - Creación de carpetas
 *  - Eliminación de archivos/carpetas seleccionados
 *
 * Los datos provienen de useFileStore (mock). Para producción,
 * descomentar las llamadas Firebase dentro del store.
 */
export function FileManager() {
  const fileInputRef = useRef(null)

  const fileMap         = useFileStore((s) => s.fileMap)
  const currentFolderId = useFileStore((s) => s.currentFolderId)
  const navigateTo      = useFileStore((s) => s.navigateTo)
  const uploadFile      = useFileStore((s) => s.uploadFile)
  const createFolder    = useFileStore((s) => s.createFolder)
  const deleteFiles     = useFileStore((s) => s.deleteFiles)

  // Archivos del directorio actual (memoizados para evitar re-renders de Chonky)
  const files = useMemo(() => {
    const folder = fileMap[currentFolderId]
    if (!folder?.childrenIds) return []
    return folder.childrenIds.map((id) => fileMap[id] ?? null)
  }, [fileMap, currentFolderId])

  // Cadena de breadcrumb desde root hasta la carpeta actual
  const folderChain = useMemo(() => {
    const chain = []
    let curr = fileMap[currentFolderId]
    while (curr) {
      chain.unshift(curr)
      curr = curr.parentId ? fileMap[curr.parentId] : null
    }
    return chain
  }, [fileMap, currentFolderId])

  // ── Manejador central de acciones Chonky ────────────────────────────────────
  const handleFileAction = useCallback(
    (action) => {
      switch (action.id) {
        // Abrir / navegar
        case ChonkyActions.OpenFiles.id: {
          const target =
            action.payload?.targetFile ?? action.payload?.files?.[0]
          if (target?.isDir) navigateTo(target.id)
          break
        }

        // Eliminar seleccionados (tecla Supr o botón Delete en toolbar)
        case ChonkyActions.DeleteFiles.id: {
          const toDelete = action.state.selectedFilesForAction
          if (toDelete.length > 0) {
            deleteFiles(toDelete.map((f) => f.id))
          }
          break
        }

        // Crear carpeta (Chonky abre un prompt nativo y pasa folderName)
        case ChonkyActions.CreateFolder.id: {
          const name = action.payload?.folderName?.trim()
          if (name) createFolder(name)
          break
        }

        // Subir archivo — abre el <input type="file"> nativo
        case UploadAction.id: {
          fileInputRef.current?.click()
          break
        }

        default:
          break
      }
    },
    [navigateTo, deleteFiles, createFolder],
  )

  // Input nativo: cuando el usuario elige un archivo lo pasa al store
  const handleNativeUpload = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (file) uploadFile(file)
      // Resetear para que el mismo archivo pueda subirse de nuevo
      e.target.value = ''
    },
    [uploadFile],
  )

  return (
    <div
      className="flex flex-col w-full h-full overflow-hidden rounded-lg border"
      style={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
    >
      {/* Input de sistema oculto para la subida de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".fasta,.pdb,.cif,.session,.txt"
        onChange={handleNativeUpload}
      />

      {/*
        FileBrowser darkMode activa el tema oscuro de MUI que usa Chonky.
        El fondo exterior (#18181b / #27272a) lo aplica el div padre con Tailwind.
      */}
      <FileBrowser
        files={files}
        folderChain={folderChain}
        fileActions={[
          UploadAction,
          ChonkyActions.CreateFolder,
          ChonkyActions.DeleteFiles,
        ]}
        onFileAction={handleFileAction}
        darkMode
        defaultFileViewActionId={ChonkyActions.EnableListView.id}
      >
        {/* Breadcrumb de navegación */}
        <FileNavbar />

        {/* Barra de herramientas: vistas, búsqueda, acciones */}
        <FileToolbar />

        {/* Lista / grid de archivos */}
        <FileList />

        {/* Menú contextual al hacer clic derecho */}
        <FileContextMenu />
      </FileBrowser>
    </div>
  )
}
