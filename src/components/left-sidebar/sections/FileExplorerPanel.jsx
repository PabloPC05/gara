import React, { useState, useRef, useCallback } from "react";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Database,
  FlaskConical,
  Layers,
  Trash2,
  Upload,
  FolderPlus,
  FileJson,
  MoreHorizontal,
} from "lucide-react";
import { useFileSystemStore } from "../../../stores/useFileSystemStore";
import { useProteinStore } from "../../../stores/useProteinStore";
import { parseStructureFile, readTextFile } from "../../../lib/importStructure";

export function FileExplorerPanel() {
  const nodes = useFileSystemStore((s) => s.nodes);
  const addFolder = useFileSystemStore((s) => s.addFolder);
  const addFileNode = useFileSystemStore((s) => s.addFileNode);
  const deleteNode = useFileSystemStore((s) => s.deleteNode);
  const upsertProtein = useProteinStore((s) => s.upsertProtein);
  const setActiveProteinId = useProteinStore((s) => s.setActiveProteinId);
  const replaceCatalog = useProteinStore((s) => s.replaceCatalog);

  const [expanded, setExpanded] = useState({ root: true, samples: true });
  const [contextMenu, setContextMenu] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef(null);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNodeClick = (node) => {
    if (node.type === "folder") {
      toggleExpand(node.id);
      return;
    }
    if (node.fileType === "fasta" && node.data) {
      upsertProtein(node.data);
      setActiveProteinId(node.data.id);
    } else if (node.fileType === "session" && Array.isArray(node.data)) {
      replaceCatalog(node.data);
      setActiveProteinId(node.data[0]?.id);
    } else if (node.fileType === "structure" && node.data) {
      upsertProtein(node.data);
      setActiveProteinId(node.data.id);
    }
  };

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleDeleteNode = (node) => {
    if (node.id === "root") return;
    if (window.confirm(`¿Eliminar "${node.name}" del workspace?`)) {
      deleteNode(node.id);
    }
    closeContextMenu();
  };

  const handleFileSelected = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) {
        e.target.value = "";
        return;
      }
      e.target.value = "";

      try {
        const text = await readTextFile(file);
        const name = file.name.toLowerCase();
        if (
          name.endsWith(".pdb") ||
          name.endsWith(".cif") ||
          name.endsWith(".mmcif")
        ) {
          const protein = parseStructureFile(text, file.name);
          addFileNode(file.name, "structure", protein);
          upsertProtein(protein);
          setActiveProteinId(protein.id);
        } else if (
          name.endsWith(".fasta") ||
          name.endsWith(".fas") ||
          name.endsWith(".fa") ||
          name.endsWith(".seq")
        ) {
          const lines = text.trim().split("\n");
          const header = lines[0].replace(/^>\s*/, "").trim();
          const sequence = lines.slice(1).join("").replace(/\s/g, "");
          const proteinData = {
            id: `fasta-${Date.now()}`,
            name: header || file.name,
            sequence,
          };
          addFileNode(file.name, "fasta", proteinData);
          upsertProtein({
            ...proteinData,
            source: "local",
            organism: "Unknown",
            length: sequence.length,
            structureData: null,
            structureFormat: null,
            pdbData: null,
            cifData: null,
            uniprotId: null,
            pdbId: null,
            plddtMean: null,
            meanPae: null,
            paeMatrix: [],
            biological: null,
            _raw: {},
          });
          setActiveProteinId(proteinData.id);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    },
    [addFileNode, upsertProtein, setActiveProteinId],
  );

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), "root");
      setNewFolderName("");
      setCreatingFolder(false);
    }
  };

  const countItems = () => {
    return nodes.filter((n) => n.parentId !== null).length;
  };

  const renderTree = (parentId = null, level = 0) => {
    const children = nodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return (a.name || "").localeCompare(b.name || "");
      });

    if (children.length === 0 && level > 0) return null;

    return children.map((node) => {
      const isExpanded = expanded[node.id];

      return (
        <div key={node.id}>
          <div
            onClick={() => handleNodeClick(node)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            className="group flex cursor-pointer items-center gap-1.5 px-2 py-[5px] transition-colors hover:bg-slate-100"
            style={{ paddingLeft: `${level * 14 + 8}px` }}
          >
            {node.type === "folder" ? (
              isExpanded ? (
                <ChevronDown size={12} className="shrink-0 text-slate-400" />
              ) : (
                <ChevronRight size={12} className="shrink-0 text-slate-400" />
              )
            ) : (
              <span className="w-3 shrink-0" />
            )}

            {node.type === "folder" ? (
              <Folder
                size={13}
                className="shrink-0 fill-blue-500/10 text-blue-500"
              />
            ) : node.fileType === "session" ? (
              <Layers size={13} className="shrink-0 text-emerald-500" />
            ) : node.fileType === "structure" ? (
              <FlaskConical size={13} className="shrink-0 text-violet-500" />
            ) : (
              <FileJson size={13} className="shrink-0 text-amber-500" />
            )}

            <span
              className={`min-w-0 flex-1 truncate text-[11px] ${
                node.type === "file"
                  ? "text-slate-700"
                  : "font-semibold text-slate-600"
              }`}
            >
              {node.name}
            </span>

            {node.fileType === "session" && (
              <span className="shrink-0 border border-emerald-200 bg-emerald-50 px-1 py-px font-mono text-[7px] text-emerald-600">
                SES
              </span>
            )}
            {node.fileType === "structure" && (
              <span className="shrink-0 border border-violet-200 bg-violet-50 px-1 py-px font-mono text-[7px] text-violet-600">
                3D
              </span>
            )}
            {node.fileType === "fasta" && (
              <span className="shrink-0 border border-amber-200 bg-amber-50 px-1 py-px font-mono text-[7px] text-amber-600">
                FA
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, node);
              }}
              className="shrink-0 text-slate-300 opacity-0 transition-opacity hover:text-slate-500 group-hover:opacity-100"
            >
              <MoreHorizontal size={12} />
            </button>
          </div>

          {node.type === "folder" &&
            isExpanded &&
            renderTree(node.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div
      className="flex h-full select-none flex-col"
      onClick={closeContextMenu}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Database size={12} className="text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </span>
          <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-[8px] text-slate-400">
            {countItems()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <button
          onClick={() => setCreatingFolder(true)}
          className="flex items-center gap-1 rounded-sm px-2 py-1 text-[9px] text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800"
          title="Nueva carpeta"
        >
          <FolderPlus size={11} />
          <span>Carpeta</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 rounded-sm px-2 py-1 text-[9px] text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800"
          title="Subir archivo"
        >
          <Upload size={11} />
          <span>Subir</span>
        </button>
      </div>

      {creatingFolder && (
        <div className="flex items-center gap-1.5 border-b border-blue-200 bg-blue-50 px-3 py-1.5">
          <Folder size={12} className="shrink-0 text-blue-500" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") {
                setCreatingFolder(false);
                setNewFolderName("");
              }
            }}
            placeholder="Nombre de carpeta..."
            className="flex-1 bg-transparent text-[11px] text-slate-700 placeholder-slate-400 outline-none"
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            className="text-[9px] font-medium text-blue-600 hover:text-blue-800"
          >
            OK
          </button>
          <button
            onClick={() => {
              setCreatingFolder(false);
              setNewFolderName("");
            }}
            className="text-[9px] text-slate-400 hover:text-slate-600"
          >
            X
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".fasta,.fas,.fa,.seq,.pdb,.cif,.mmcif,.txt,.session"
        onChange={handleFileSelected}
      />

      <div className="minimal-scrollbar flex-1 overflow-y-auto py-1">
        {renderTree(null, 0)}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-3">
        <p className="text-[8px] uppercase leading-relaxed tracking-widest text-slate-400">
          Clic para cargar · Clic derecho para opciones · Arrastra archivos al
          visor
        </p>
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[200]"
            onClick={closeContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              closeContextMenu();
            }}
          />
          <div
            className="fixed z-[201] min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.node?.type === "folder" && (
              <>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    closeContextMenu();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Upload size={11} className="text-slate-400" />
                  Subir archivo aquí
                </button>
                <button
                  onClick={() => {
                    setCreatingFolder(true);
                    closeContextMenu();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <FolderPlus size={11} className="text-slate-400" />
                  Nueva subcarpeta
                </button>
                {contextMenu.node.id !== "root" && (
                  <>
                    <div className="my-1 h-px bg-slate-100" />
                    <button
                      onClick={() => handleDeleteNode(contextMenu.node)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={11} />
                      Eliminar carpeta
                    </button>
                  </>
                )}
              </>
            )}
            {contextMenu.node?.type === "file" && (
              <>
                <button
                  onClick={() => {
                    handleNodeClick(contextMenu.node);
                    closeContextMenu();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <FlaskConical size={11} className="text-slate-400" />
                  Abrir / Cargar
                </button>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  onClick={() => handleDeleteNode(contextMenu.node)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={11} />
                  Eliminar archivo
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
