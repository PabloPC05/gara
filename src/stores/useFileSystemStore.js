import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * FileSystem Store - Estilo VS Code
 * Soporta archivos .fasta (una proteína) y .session (conjunto de proteínas)
 */
export const useFileSystemStore = create(
  persist(
    (set, get) => ({
      nodes: [
        { id: 'root', name: 'BIOHACK_PROJECTS', type: 'folder', parentId: null, createdAt: Date.now() },
        { id: 'samples', name: 'examples', type: 'folder', parentId: 'root', createdAt: Date.now() },
        
        // Sesión de ejemplo: Proteínas de transporte de Oxígeno
        { 
          id: 'session-1', 
          name: 'oxigen_transport.session', 
          type: 'file', 
          fileType: 'session',
          parentId: 'samples', 
          createdAt: Date.now(),
          data: [
            { id: 'hba', name: 'Hemoglobina (Alpha)', sequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR' },
            { id: 'mb', name: 'Mioglobina', sequence: 'MGLSDGEWQLVLNVWGKVEADIPGHGQEVLIRLFKGHPETLEKFDKFKHLKSEDEMKASEDLKKHGATVLTALGGILKKKGHHEAEIKPLAQSHATKHKIPVKYLEFISECIIQVLQSKHPGDFGADAQGAMNKALELFRKDMASNYKELGFQG' }
          ]
        },

        // Archivo FASTA individual
        { 
          id: 'fasta-ins', 
          name: 'insulin_human.fasta', 
          type: 'file', 
          fileType: 'fasta',
          parentId: 'samples', 
          createdAt: Date.now(),
          data: { id: 'ins', name: 'Insulina Humana', sequence: 'GIVEQCCTSICSLYQLENYCNFVNQHLCGSHLVEALYLVCGERGFFYTPKT' }
        },

        // Tu ejemplo: Hemoglobina y Quintina (Titina)
        { 
          id: 'session-musculo', 
          name: 'muscle_proteins.session', 
          type: 'file', 
          fileType: 'session',
          parentId: 'root', 
          createdAt: Date.now(),
          data: [
            { id: 'hba-2', name: 'Hemoglobina', sequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR' },
            { id: 'titin', name: 'Titin (Fragmento)', sequence: 'MTTQAPTFTQPLQSVVVLEGSTATFEAHISGFPVPEVSWFRDGQVISTSTLPGVQISFSDGRAKLTIPAVTKANSGRYSLKATNGSGQATSTAELLVKAETAPPNFVQRLQSMTVRQGSQVRLQVRVTGIPTPVVKFYRDGAEIQSSLDFQISQEGDLYS' }
          ]
        }
      ],
      currentFolderId: 'root',

      setCurrentFolderId: (id) => set({ currentFolderId: id }),
      
      // Añadir una nueva sesión basada en las proteínas actuales
      addSession: (name, proteins) => {
        const { currentFolderId, nodes } = get();
        const newSession = {
          id: `session-${Date.now()}`,
          name: name.endsWith('.session') ? name : `${name}.session`,
          type: 'file',
          fileType: 'session',
          parentId: currentFolderId,
          createdAt: Date.now(),
          data: proteins.map(p => ({
            id: p.id,
            name: p.name,
            sequence: p.sequence || p.fasta,
            // Guardamos metadatos adicionales si existen para reconstruir mejor
            metadata: p.metadata || {}
          }))
        };
        set({ nodes: [...nodes, newSession] });
        return newSession;
      },

      addNode: (node) => set((state) => ({ 
        nodes: [...state.nodes, { ...node, id: node.id || Math.random().toString(36).substr(2, 9), createdAt: Date.now() }] 
      })),

      deleteNode: (id) => set((state) => ({
        nodes: state.nodes.filter(n => n.id !== id)
      })),

      getChildren: (parentId) => get().nodes.filter(n => n.parentId === parentId),
      
      getPath: (id) => {
        const path = [];
        let curr = get().nodes.find(n => n.id === id);
        while (curr) {
          path.unshift(curr);
          curr = get().nodes.find(n => n.id === curr.parentId);
        }
        return path;
      }
    }),
    { name: 'biohack-workspace-v2' }
  )
);
