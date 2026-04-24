import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * FileSystem Store - Estilo VS Code
 * Soporta archivos .fasta (una proteina) y .session (conjunto de proteinas)
 */
export const useFileSystemStore = create(
  persist(
    (set, get) => ({
      nodes: [
        {
          id: "root",
          name: "BIOHACK_PROJECTS",
          type: "folder",
          parentId: null,
          createdAt: Date.now(),
        },
        {
          id: "samples",
          name: "examples",
          type: "folder",
          parentId: "root",
          createdAt: Date.now(),
        },

        {
          id: "session-1",
          name: "oxigen_transport.session",
          type: "file",
          fileType: "session",
          parentId: "samples",
          createdAt: Date.now(),
          data: [
            {
              id: "hba",
              name: "Hemoglobina (Alpha)",
              sequence:
                "MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR",
            },
            {
              id: "mb",
              name: "Mioglobina",
              sequence:
                "MGLSDGEWQLVLNVWGKVEADIPGHGQEVLIRLFKGHPETLEKFDKFKHLKSEDEMKASEDLKKHGATVLTALGGILKKKGHHEAEIKPLAQSHATKHKIPVKYLEFISECIIQVLQSKHPGDFGADAQGAMNKALELFRKDMASNYKELGFQG",
            },
          ],
        },

        {
          id: "fasta-ins",
          name: "insulin_human.fasta",
          type: "file",
          fileType: "fasta",
          parentId: "samples",
          createdAt: Date.now(),
          data: {
            id: "ins",
            name: "Insulina Humana",
            sequence: "GIVEQCCTSICSLYQLENYCNFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
          },
        },

        {
          id: "session-musculo",
          name: "muscle_proteins.session",
          type: "file",
          fileType: "session",
          parentId: "root",
          createdAt: Date.now(),
          data: [
            {
              id: "hba-2",
              name: "Hemoglobina",
              sequence:
                "MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR",
            },
            {
              id: "titin",
              name: "Titin (Fragmento)",
              sequence:
                "MTTQAPTFTQPLQSVVVLEGSTATFEAHISGFPVPEVSWFRDGQVISTSTLPGVQISFSDGRAKLTIPAVTKANSGRYSLKATNGSGQATSTAELLVKAETAPPNFVQRLQSMTVRQGSQVRLQVRVTGIPTPVVKFYRDGAEIQSSLDFQISQEGDLYS",
            },
          ],
        },
      ],
      currentFolderId: "root",

      setCurrentFolderId: (id) => set({ currentFolderId: id }),

      addSession: (name, proteins) => {
        const { currentFolderId, nodes } = get();
        const newSession = {
          id: `session-${Date.now()}`,
          name: name.endsWith(".session") ? name : `${name}.session`,
          type: "file",
          fileType: "session",
          parentId: currentFolderId,
          createdAt: Date.now(),
          data: proteins.map((p) => ({
            id: p.id,
            name: p.name,
            sequence: p.sequence || p.fasta,
            metadata: p.metadata || {},
          })),
        };
        set({ nodes: [...nodes, newSession] });
        return newSession;
      },

      addNode: (node) =>
        set((state) => ({
          nodes: [
            ...state.nodes,
            {
              ...node,
              id: node.id || Math.random().toString(36).substr(2, 9),
              createdAt: Date.now(),
            },
          ],
        })),

      addFolder: (name, parentId) => {
        const { nodes } = get();
        const id = `folder-${Date.now()}`;
        const folder = {
          id,
          name,
          type: "folder",
          parentId: parentId || get().currentFolderId,
          createdAt: Date.now(),
        };
        set({ nodes: [...nodes, folder] });
        return id;
      },

      addFileNode: (name, fileType, data, parentId) => {
        const { nodes } = get();
        const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const file = {
          id,
          name,
          type: "file",
          fileType,
          parentId: parentId || get().currentFolderId,
          createdAt: Date.now(),
          data,
        };
        set({ nodes: [...nodes, file] });
        return id;
      },

      deleteNode: (id) =>
        set((state) => {
          const childIds = state.nodes
            .filter((n) => n.parentId === id)
            .map((n) => n.id);
          const allToDelete = [id, ...childIds];
          return {
            nodes: state.nodes.filter((n) => !allToDelete.includes(n.id)),
          };
        }),

      renameNode: (id, newName) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, name: newName } : n,
          ),
        })),

      getChildren: (parentId) =>
        get().nodes.filter((n) => n.parentId === parentId),

      getPath: (id) => {
        const path = [];
        let curr = get().nodes.find((n) => n.id === id);
        while (curr) {
          path.unshift(curr);
          curr = get().nodes.find((n) => n.id === curr.parentId);
        }
        return path;
      },

      uploadFileToWorkspace: (file, proteinData) => {
        const name = file.name;
        const ext = name.split(".").pop().toLowerCase();
        let fileType = "fasta";
        if (ext === "pdb" || ext === "cif" || ext === "mmcif")
          fileType = "structure";
        else if (ext === "session") fileType = "session";
        return get().addFileNode(name, fileType, proteinData);
      },
    }),
    { name: "biohack-workspace-v2" },
  ),
);
