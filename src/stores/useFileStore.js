import { create } from 'zustand'

// ─── Firebase (activar cuando se conecte al backend) ──────────────────────────
// import { db } from '../config/firebase'
// import { uploadJobFile } from '../lib/firebaseStorage'
// import {
//   collection, doc,
//   getDocs, addDoc, deleteDoc,
//   query, where, orderBy,
//   serverTimestamp,
// } from 'firebase/firestore'
// import { getStorage, ref, deleteObject } from 'firebase/storage'
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapa plano de archivos en la estructura que Chonky espera.
 * Los directorios tienen `childrenIds` con los IDs de sus hijos directos.
 *
 * Campos Chonky:
 *   id        — string  — identificador único
 *   name      — string  — nombre visible
 *   isDir     — boolean — es carpeta
 *   ext       — string  — extensión (archivos)
 *   size      — number  — bytes
 *   modDate   — Date    — fecha de modificación
 *   parentId  — string  — padre (campo propio, no de Chonky)
 *   color     — string  — color del icono de carpeta
 */
const INITIAL_FILE_MAP = {
  root: {
    id: 'root',
    name: 'Mis Archivos',
    isDir: true,
    childrenIds: ['folder-proteins', 'folder-sessions', 'folder-reports'],
    childrenCount: 3,
  },

  'folder-proteins': {
    id: 'folder-proteins',
    name: 'Proteínas',
    isDir: true,
    parentId: 'root',
    color: '#0ea5e9',
    childrenIds: ['file-hba', 'file-titin', 'file-insulin'],
    childrenCount: 3,
  },
  'folder-sessions': {
    id: 'folder-sessions',
    name: 'Sesiones',
    isDir: true,
    parentId: 'root',
    color: '#8b5cf6',
    childrenIds: ['file-session-oxygen', 'file-session-muscle'],
    childrenCount: 2,
  },
  'folder-reports': {
    id: 'folder-reports',
    name: 'Reportes',
    isDir: true,
    parentId: 'root',
    color: '#10b981',
    childrenIds: [],
    childrenCount: 0,
  },

  'file-hba': {
    id: 'file-hba',
    name: 'hemoglobin_alpha.fasta',
    ext: 'fasta',
    parentId: 'folder-proteins',
    size: 280,
    modDate: new Date('2025-02-15'),
  },
  'file-titin': {
    id: 'file-titin',
    name: 'titin_fragment.fasta',
    ext: 'fasta',
    parentId: 'folder-proteins',
    size: 340,
    modDate: new Date('2025-03-01'),
  },
  'file-insulin': {
    id: 'file-insulin',
    name: 'insulin_human.fasta',
    ext: 'fasta',
    parentId: 'folder-proteins',
    size: 120,
    modDate: new Date('2025-01-20'),
  },
  'file-session-oxygen': {
    id: 'file-session-oxygen',
    name: 'oxigen_transport.session',
    ext: 'session',
    parentId: 'folder-sessions',
    size: 2048,
    modDate: new Date('2025-02-28'),
  },
  'file-session-muscle': {
    id: 'file-session-muscle',
    name: 'muscle_proteins.session',
    ext: 'session',
    parentId: 'folder-sessions',
    size: 3072,
    modDate: new Date('2025-03-05'),
  },
}

export const useFileStore = create((set, get) => ({
  fileMap: INITIAL_FILE_MAP,
  currentFolderId: 'root',

  // ── Navegación ──────────────────────────────────────────────────────────────
  navigateTo: (folderId) => {
    if (get().fileMap[folderId]?.isDir) {
      set({ currentFolderId: folderId })
    }
  },

  // ── Subir archivo ───────────────────────────────────────────────────────────
  uploadFile: async (file) => {
    const { currentFolderId } = get()
    const newId = `file-${Date.now()}`

    // TODO Firebase Storage: subir el binario
    // const userId = auth.currentUser?.uid
    // const storagePath = `users/${userId}/files/${newId}_${file.name}`
    // const downloadURL = await uploadJobFile(file, storagePath)

    // TODO Firestore: persistir metadatos
    // await addDoc(collection(db, 'users', userId, 'files'), {
    //   id: newId,
    //   name: file.name,
    //   ext: file.name.split('.').pop(),
    //   size: file.size,
    //   parentId: currentFolderId,
    //   storagePath,
    //   downloadURL,
    //   createdAt: serverTimestamp(),
    // })

    const newFile = {
      id: newId,
      name: file.name,
      ext: file.name.split('.').pop(),
      parentId: currentFolderId,
      size: file.size,
      modDate: new Date(),
    }

    set((state) => {
      const parent = state.fileMap[currentFolderId]
      return {
        fileMap: {
          ...state.fileMap,
          [newId]: newFile,
          [currentFolderId]: {
            ...parent,
            childrenIds: [...(parent.childrenIds ?? []), newId],
            childrenCount: (parent.childrenCount ?? 0) + 1,
          },
        },
      }
    })

    return newId
  },

  // ── Crear carpeta ───────────────────────────────────────────────────────────
  createFolder: async (name) => {
    const { currentFolderId } = get()
    const newId = `folder-${Date.now()}`

    // TODO Firestore: crear documento de carpeta
    // const userId = auth.currentUser?.uid
    // await addDoc(collection(db, 'users', userId, 'files'), {
    //   id: newId,
    //   name,
    //   isDir: true,
    //   parentId: currentFolderId,
    //   createdAt: serverTimestamp(),
    // })

    const newFolder = {
      id: newId,
      name,
      isDir: true,
      parentId: currentFolderId,
      color: '#64748b',
      childrenIds: [],
      childrenCount: 0,
      modDate: new Date(),
    }

    set((state) => {
      const parent = state.fileMap[currentFolderId]
      return {
        fileMap: {
          ...state.fileMap,
          [newId]: newFolder,
          [currentFolderId]: {
            ...parent,
            childrenIds: [...(parent.childrenIds ?? []), newId],
            childrenCount: (parent.childrenCount ?? 0) + 1,
          },
        },
      }
    })
  },

  // ── Eliminar archivos / carpetas ────────────────────────────────────────────
  deleteFiles: async (fileIds) => {
    // TODO Firestore: borrar documentos de metadatos
    // const userId = auth.currentUser?.uid
    // for (const fileId of fileIds) {
    //   await deleteDoc(doc(db, 'users', userId, 'files', fileId))
    // }

    // TODO Firebase Storage: borrar binarios de los archivos (no carpetas)
    // const storage = getStorage()
    // for (const fileId of fileIds) {
    //   const file = get().fileMap[fileId]
    //   if (!file?.isDir && file?.storagePath) {
    //     await deleteObject(ref(storage, file.storagePath))
    //   }
    // }

    set((state) => {
      const newMap = { ...state.fileMap }

      for (const fileId of fileIds) {
        const file = newMap[fileId]
        if (!file) continue

        // Limpiar referencia en el padre
        const parent = newMap[file.parentId]
        if (parent) {
          newMap[file.parentId] = {
            ...parent,
            childrenIds: parent.childrenIds.filter((id) => id !== fileId),
            childrenCount: Math.max(0, (parent.childrenCount ?? 1) - 1),
          }
        }

        delete newMap[fileId]
      }

      return { fileMap: newMap }
    })
  },

  // ── Carga inicial desde Firestore (activar con Firebase) ───────────────────
  // loadFiles: async (userId) => {
  //   const q = query(
  //     collection(db, 'users', userId, 'files'),
  //     orderBy('createdAt', 'desc')
  //   )
  //   const snapshot = await getDocs(q)
  //   const files = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  //
  //   const newMap = { root: INITIAL_FILE_MAP.root }
  //   for (const file of files) {
  //     newMap[file.id] = file
  //   }
  //   set({ fileMap: newMap })
  // },
}))
