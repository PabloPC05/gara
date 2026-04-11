import React, { useMemo, useState } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  FolderPlus, 
  Trash2, 
  Search,
  Database,
  LayoutGrid,
  List as ListIcon,
  ArrowUpRight
} from 'lucide-react';

// Estados y utilidades
import { useFileSystemStore } from '../stores/useFileSystemStore';
import { useProteinStore } from '../stores/useProteinStore';
import { useUIStore } from '../stores/useUIStore';
import { cn } from '../lib/utils'; // <-- Añadida la importación de cn

// Componentes UI (Asegúrate de que las rutas coinciden con tu proyecto)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

// ── SUBCOMPONENTES ─────────────────────────────────────────────────────────

const DashboardHeader = ({ path, viewMode, setViewMode, onOpenFolder, onCreateFolder }) => (
  <header className="h-14 px-6 border-b border-white/5 flex items-center justify-between bg-[#0b0b0d]/80 backdrop-blur-md z-10 flex-shrink-0">
    <div className="flex items-center gap-4 overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-none text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex-shrink-0">
        <Database size={12} />
        <span>FS_ROOT</span>
      </div>
      
      <nav className="flex items-center gap-1 text-[11px] font-medium overflow-hidden">
        {path.map((node, i) => (
          <React.Fragment key={node.id}>
            {i > 0 && <ChevronRight size={12} className="text-slate-700 flex-shrink-0" />}
            <button 
              onClick={() => onOpenFolder(node.id)}
              className={cn(
                "hover:text-white transition-colors whitespace-nowrap truncate uppercase tracking-widest",
                i === path.length - 1 ? 'text-slate-100' : 'text-slate-500'
              )}
            >
              {node.name}
            </button>
          </React.Fragment>
        ))}
      </nav>
    </div>

    <div className="flex items-center gap-4">
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
        <input 
          type="text" 
          placeholder="QUERY DATABASE..." 
          className="pl-8 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-none text-[10px] font-mono text-slate-400 focus:outline-none focus:border-blue-500/40 w-48 placeholder:text-slate-700 uppercase tracking-tighter"
        />
      </div>
      
      <div className="flex items-center bg-white/5 rounded-none border border-white/10 p-0.5">
        <button 
          onClick={() => setViewMode('grid')}
          className={cn(
            "p-1 transition-colors",
            viewMode === 'grid' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <LayoutGrid size={14} />
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={cn(
            "p-1 transition-colors",
            viewMode === 'list' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <ListIcon size={14} />
        </button>
      </div>

      <button 
        onClick={onCreateFolder}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20"
      >
        <FolderPlus size={14} />
        New Project
      </button>
    </div>
  </header>
);

const ExplorerNode = ({ node, viewMode, onOpenFolder, onOpenFile, onDelete }) => {
  const isGrid = viewMode === 'grid';
  const isFolder = node.type === 'folder';

  return (
    <div 
      onDoubleClick={() => isFolder ? onOpenFolder(node.id) : onOpenFile(node)}
      className={cn(
        "group relative transition-all border",
        isGrid
          ? "bg-[#111113] border-white/5 hover:border-blue-500/30 p-4 flex flex-col items-start gap-4"
          : "flex items-center gap-4 px-4 py-2 bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"
      )}
    >
      {/* Icon Section */}
      <div className={cn(
        "relative flex items-center justify-center shrink-0", 
        isGrid ? "w-10 h-10" : "w-6 h-6"
      )}>
        {isFolder ? (
          <Folder size={isGrid ? 24 : 16} className="text-blue-500 fill-blue-500/10" />
        ) : (
          <div className="relative">
            <File size={isGrid ? 24 : 16} className="text-slate-500" />
            <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#111113]" />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className={cn(
        "flex flex-col min-w-0", 
        isGrid ? "w-full" : "flex-1"
      )}>
        <span className={cn(
          "font-bold truncate", 
          isGrid ? "text-xs text-slate-200" : "text-[11px] text-slate-300"
        )}>
          {node.name}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">
            {isFolder ? 'DIRECTORY' : 'PROTEIN_DATA'}
          </span>
          <span className="text-[9px] text-slate-700">·</span>
          <span className="text-[9px] font-mono text-slate-600 italic">
            {new Date(node.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex items-center gap-1 opacity-0 group-hover:opacity-100",
        isGrid && "absolute top-2 right-2 transition-opacity"
      )}>
        {!isFolder && (
          <button 
            onClick={() => onOpenFile(node)}
            className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-none transition-colors"
            title="Open in Viewer"
          >
            <ArrowUpRight size={14} />
          </button>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="p-1.5 hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 rounded-none transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Grid Overlay Detail */}
      {isGrid && !isFolder && (
        <>
          <div className="w-full h-[1px] bg-white/5 mt-auto" />
          <div className="w-full flex justify-between items-center text-[9px] font-mono text-slate-700">
            <span>{node.data?.length || '---'} AA</span>
            <span className="text-emerald-500/50">READY</span>
          </div>
        </>
      )}
    </div>
  );
};

const DashboardFooter = ({ nodeCount }) => (
  <footer className="h-8 px-6 border-t border-white/5 bg-[#08080a] flex items-center justify-between text-[9px] font-mono text-slate-600 uppercase tracking-widest">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>SYSTEM_READY</span>
      </div>
      <span className="text-white/5">|</span>
      <span>{nodeCount} NODES_IN_BUFFER</span>
    </div>
    
    <div className="flex items-center gap-4">
      <span className="text-slate-700">V1.0.4-STABLE</span>
      <span className="text-white/5">|</span>
      <span className="text-blue-500/50 font-black">BIOHACK_CORE</span>
    </div>
  </footer>
);

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────

const ResearchDashboard = () => {
  const { 
    currentFolderId, 
    setCurrentFolderId, 
    nodes, 
    addNode, 
    deleteNode, 
    getPath 
  } = useFileSystemStore();

  const { upsertProtein, setActiveProteinId } = useProteinStore();
  const { setCurrentView } = useUIStore();
  
  // Estados de interfaz
  const [viewMode, setViewMode] = useState('grid');
  
  // Estados para modales
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [nodeToDelete, setNodeToDelete] = useState(null);

  // Computados
  const currentNodes = useMemo(() => 
    nodes.filter(n => n.parentId === currentFolderId)
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'folder' ? -1 : 1)),
  [nodes, currentFolderId]);

  const path = useMemo(() => getPath(currentFolderId), [currentFolderId, nodes, getPath]);

  // ── Handlers de Navegación ──
  const handleOpenFolder = (folderId) => setCurrentFolderId(folderId);

  const handleOpenFile = (file) => {
    if (file.data) {
      upsertProtein(file.data);
      setActiveProteinId(file.id);
      setCurrentView('viewer');
    }
  };

  // ── Lógica de Creación (Modal) ──
  const handleConfirmCreateFolder = () => {
    if (newFolderName.trim()) {
      addNode({ name: newFolderName.trim(), type: 'folder', parentId: currentFolderId });
      setNewFolderName('');
      setIsFolderModalOpen(false);
    }
  };

  // ── Lógica de Borrado (Modal) ──
  const handleConfirmDelete = () => {
    if (nodeToDelete) {
      deleteNode(nodeToDelete);
      setNodeToDelete(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0b0d] text-slate-300 font-sans selection:bg-blue-500/30">
      
      <DashboardHeader 
        path={path}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenFolder={handleOpenFolder}
        onCreateFolder={() => setIsFolderModalOpen(true)}
      />

      <main className="flex-1 p-8 overflow-y-auto minimal-scrollbar">
        {currentNodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-dashed border-white/10 flex items-center justify-center mb-4 opacity-20">
              <Database size={24} className="text-slate-400" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">No data available in this directory</p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4" 
              : "flex flex-col gap-1"
          )}>
            {currentNodes.map(node => (
              <ExplorerNode 
                key={node.id} 
                node={node} 
                viewMode={viewMode}
                onOpenFolder={handleOpenFolder}
                onOpenFile={handleOpenFile}
                onDelete={(id) => setNodeToDelete(id)}
              />
            ))}
          </div>
        )}
      </main>

      <DashboardFooter nodeCount={currentNodes.length} />

      {/* ── MODALES (Dialogs) ── */}

      {/* Modal Nueva Carpeta */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="bg-[#111113] border-white/10 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Carpeta de Investigación</DialogTitle>
            <DialogDescription className="text-slate-500">
              Introduce un nombre para agrupar tus proteínas y datos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ej. Análisis Mieloma..."
              className="bg-black/50 border-white/10 text-slate-200 focus-visible:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                 if (e.key === 'Enter') handleConfirmCreateFolder();
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              className="text-slate-400 hover:text-slate-200 hover:bg-white/5"
              onClick={() => setIsFolderModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-500 text-white" 
              onClick={handleConfirmCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Crear Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Borrado */}
      <Dialog open={!!nodeToDelete} onOpenChange={(open) => !open && setNodeToDelete(null)}>
        <DialogContent className="bg-[#111113] border-white/10 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-500 flex items-center gap-2">
              <Trash2 size={18} />
              ¿Eliminar permanentemente?
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">
              Esta acción no se puede deshacer. El nodo seleccionado y todo su contenido se borrará de la base de datos local.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              className="text-slate-400 hover:text-slate-200 hover:bg-white/5"
              onClick={() => setNodeToDelete(null)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              className="bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-600/30 transition-colors" 
              onClick={handleConfirmDelete}
            >
              Sí, eliminar recurso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ResearchDashboard;