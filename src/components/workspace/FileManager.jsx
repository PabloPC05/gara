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
import { useFileSystemStore } from '@/stores/useFileSystemStore'
import { useProteinStore } from '@/stores/useProteinStore'
import { parseStructureFile, readTextFile } from '@/lib/importStructure'

setChonkyDefaults({ iconComponent: ChonkyIconFA })

const UploadAction = defineFileAction({
  id: 'upload_file',
  button: {
    name: 'Subir archivo',
    toolbar: true,
    icon: ChonkyIconName.upload,
  },
})

function buildChonkyFileMap(nodes, currentFolderId) {
  const fileMap = {}
  for (const node of nodes) {
    if (node.type === 'folder') {
      fileMap[node.id] = {
        id: node.id,
        name: node.name,
        isDir: true,
        parentId: node.parentId === 'root' ? null : node.parentId,
        childrenIds: nodes.filter(n => n.parentId === node.id).map(n => n.id),
        modDate: new Date(node.createdAt),
      }
    } else {
      fileMap[node.id] = {
        id: node.id,
        name: node.name,
        isDir: false,
        parentId: node.parentId === 'root' ? null : node.parentId,
        ext: node.name.split('.').pop(),
        size: 0,
        modDate: new Date(node.createdAt),
      }
    }
  }
  return fileMap
}

export function FileManager() {
  const fileInputRef = useRef(null)

  const nodes             = useFileSystemStore((s) => s.nodes)
  const currentFolderId   = useFileSystemStore((s) => s.currentFolderId)
  const setCurrentFolderId = useFileSystemStore((s) => s.setCurrentFolderId)
  const addFolder         = useFileSystemStore((s) => s.addFolder)
  const deleteNode        = useFileSystemStore((s) => s.deleteNode)
  const uploadFileToWorkspace = useFileSystemStore((s) => s.uploadFileToWorkspace)
  const upsertProtein     = useProteinStore((s) => s.upsertProtein)
  const setActiveProteinId = useProteinStore((s) => s.setActiveProteinId)

  const chonkyFileMap = useMemo(() => buildChonkyFileMap(nodes, currentFolderId), [nodes, currentFolderId])

  const files = useMemo(() => {
    const folder = chonkyFileMap[currentFolderId]
    if (!folder?.childrenIds) {
      const root = chonkyFileMap['root']
      if (!root?.childrenIds) return []
      return root.childrenIds.map((id) => chonkyFileMap[id]).filter(Boolean)
    }
    return folder.childrenIds.map((id) => chonkyFileMap[id]).filter(Boolean)
  }, [chonkyFileMap, currentFolderId])

  const folderChain = useMemo(() => {
    const chain = []
    let curr = chonkyFileMap[currentFolderId]
    while (curr) {
      chain.unshift(curr)
      curr = curr.parentId ? chonkyFileMap[curr.parentId] : null
    }
    return chain
  }, [chonkyFileMap, currentFolderId])

  const handleFileAction = useCallback(
    (action) => {
      switch (action.id) {
        case ChonkyActions.OpenFiles.id: {
          const target =
            action.payload?.targetFile ?? action.payload?.files?.[0]
          if (target?.isDir) setCurrentFolderId(target.id)
          else if (target && !target.isDir) {
            const node = nodes.find(n => n.id === target.id)
            if (node?.data) {
              if (node.fileType === 'fasta') {
                upsertProtein(node.data)
                setActiveProteinId(node.data.id)
              } else if (node.fileType === 'session' && Array.isArray(node.data)) {
                useProteinStore.getState().replaceCatalog(node.data)
                setActiveProteinId(node.data[0]?.id)
              }
            }
          }
          break
        }
        case ChonkyActions.DeleteFiles.id: {
          const toDelete = action.state.selectedFilesForAction
          if (toDelete.length > 0) {
            toDelete.forEach((f) => deleteNode(f.id))
          }
          break
        }
        case ChonkyActions.CreateFolder.id: {
          const name = action.payload?.folderName?.trim()
          if (name) addFolder(name, currentFolderId)
          break
        }
        case UploadAction.id: {
          fileInputRef.current?.click()
          break
        }
        default:
          break
      }
    },
    [setCurrentFolderId, deleteNode, addFolder, currentFolderId, nodes, upsertProtein, setActiveProteinId],
  )

  const handleNativeUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0]
      if (!file) { e.target.value = ''; return }
      e.target.value = ''

      try {
        const text = await readTextFile(file)
        const name = file.name.toLowerCase()
        if (name.endsWith('.fasta') || name.endsWith('.fas') || name.endsWith('.fa') || name.endsWith('.seq')) {
          const lines = text.trim().split('\n')
          const header = lines[0].replace(/^>\s*/, '').trim()
          const sequence = lines.slice(1).join('').replace(/\s/g, '')
          const proteinData = { id: `fasta-${Date.now()}`, name: header || file.name, sequence }
          uploadFileToWorkspace(file, proteinData)
          upsertProtein({ ...proteinData, source: 'local', organism: 'Unknown', length: sequence.length, structureData: null, structureFormat: null, pdbData: null, cifData: null, uniprotId: null, pdbId: null, plddtMean: null, meanPae: null, paeMatrix: [], biological: null, _raw: {} })
          setActiveProteinId(proteinData.id)
        } else if (name.endsWith('.pdb') || name.endsWith('.cif') || name.endsWith('.mmcif')) {
          const protein = parseStructureFile(text, file.name)
          uploadFileToWorkspace(file, protein)
          upsertProtein(protein)
          setActiveProteinId(protein.id)
        }
      } catch (err) {
        console.error('Upload error:', err)
      }
    },
    [uploadFileToWorkspace, upsertProtein, setActiveProteinId],
  )

  return (
    <div
      className="flex flex-col w-full h-full overflow-hidden rounded-lg border"
      style={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".fasta,.pdb,.cif,.session,.txt"
        onChange={handleNativeUpload}
      />
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
        <FileNavbar />
        <FileToolbar />
        <FileList />
        <FileContextMenu />
      </FileBrowser>
    </div>
  )
}
