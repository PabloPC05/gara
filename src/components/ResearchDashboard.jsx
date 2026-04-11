import React, { useMemo, useState } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  FolderPlus, 
  Trash2, 
  Search,
  Database,
  Clock,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  ArrowUpRight
} from 'lucide-react';
import { useFileSystemStore } from '../stores/useFileSystemStore';
import { useProteinStore } from '../stores/useProteinStore';
import { useUIStore } from '../stores/useUIStore';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const currentNodes = useMemo(() => 
    nodes.filter(n => n.parentId === currentFolderId)
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'folder' ? -1 : 1)),
  [nodes, currentFolderId]);

  const path = useMemo(() => getPath(currentFolderId), [currentFolderId, nodes]);

  const handleOpenFolder = (folderId) => setCurrentFolderId(folderId);

  const handleOpenFile = (file) => {
    if (file.data) {
      upsertProtein(file.data);
      setActiveProteinId(file.id);
      setCurrentView('viewer');
    }
  };

  const handleCreateFolder = () => {
    const name = prompt('Nombre de la carpeta de investigación:');
    if (name) addNode({ name, type: 'folder', parentId: currentFolderId });
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar permanentemente este recurso?')) deleteNode(id);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0b0d] text-slate-300 font-sans selection:bg-blue-500/30">
      {/* ── TOP NAV / BREADCRUMBS ── */}
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
                  onClick={() => handleOpenFolder(node.id)}
                  className={`hover:text-white transition-colors whitespace-nowrap truncate uppercase tracking-widest ${
                    i === path.length - 1 ? 'text-slate-100' : 'text-slate-500'
                  }`}
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
              className={`p-1 ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1 ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <ListIcon size={14} />
            </button>
          </div>

          <button 
            onClick={handleCreateFolder}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20"
          >
            <FolderPlus size={14} />
            New Project
          </button>
        </div>
      </header>

      {/* ── MAIN EXPLORER AREA ── */}
      <main className="flex-1 p-8 overflow-y-auto minimal-scrollbar">
        {currentNodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-dashed border-white/10 flex items-center justify-center mb-4 opacity-20">
              <Database size={24} className="text-slate-400" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">No data available in this directory</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4" 
              : "flex flex-col gap-1"
          }>
            {currentNodes.map(node => (
              <div 
                key={node.id}
                onDoubleClick={() => node.type === 'folder' ? handleOpenFolder(node.id) : handleOpenFile(node)}
                className={`group relative transition-all border ${
                  viewMode === 'grid'
                    ? "bg-[#111113] border-white/5 hover:border-blue-500/30 p-4 flex flex-col items-start gap-4"
                    : "flex items-center gap-4 px-4 py-2 bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"
                }`}
              >
                {/* Icon Section */}
                <div className={`relative flex items-center justify-center shrink-0 ${
                  viewMode === 'grid' ? "w-10 h-10" : "w-6 h-6"
                }`}>
                  {node.type === 'folder' ? (
                    <Folder size={viewMode === 'grid' ? 24 : 16} className="text-blue-500 fill-blue-500/10" />
                  ) : (
                    <div className="relative">
                      <File size={viewMode === 'grid' ? 24 : 16} className="text-slate-500" />
                      <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#111113]" />
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className={`flex flex-col min-w-0 ${viewMode === 'grid' ? "w-full" : "flex-1"}`}>
                  <span className={`font-bold truncate ${
                    viewMode === 'grid' ? "text-xs text-slate-200" : "text-[11px] text-slate-300"
                  }`}>
                    {node.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">
                      {node.type === 'folder' ? 'DIRECTORY' : 'PROTEIN_DATA'}
                    </span>
                    <span className="text-[9px] text-slate-700">·</span>
                    <span className="text-[9px] font-mono text-slate-600 italic">
                      {new Date(node.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Right Actions / Hover Overlay */}
                <div className={`flex items-center gap-1 ${
                  viewMode === 'grid' 
                    ? "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                    : "opacity-0 group-hover:opacity-100"
                }`}>
                  {node.type === 'file' && (
                    <button 
                      onClick={() => handleOpenFile(node)}
                      className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-none transition-colors"
                      title="Open in Viewer"
                    >
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleDelete(e, node.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 rounded-none transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Grid Overlay Detail */}
                {viewMode === 'grid' && node.type === 'file' && (
                   <div className="w-full h-[1px] bg-white/5 mt-auto" />
                )}
                {viewMode === 'grid' && node.type === 'file' && (
                   <div className="w-full flex justify-between items-center text-[9px] font-mono text-slate-700">
                      <span>{node.data?.length || '---'} AA</span>
                      <span className="text-emerald-500/50">READY</span>
                   </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER STATUS BAR ── */}
      <footer className="h-8 px-6 border-t border-white/5 bg-[#08080a] flex items-center justify-between text-[9px] font-mono text-slate-600 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SYSTEM_READY</span>
          </div>
          <span className="text-white/5">|</span>
          <span>{currentNodes.length} NODES_IN_BUFFER</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-slate-700">V1.0.4-STABLE</span>
          <span className="text-white/5">|</span>
          <span className="text-blue-500/50 font-black">BIOHACK_CORE</span>
        </div>
      </footer>
    </div>
  );
};

export default ResearchDashboard;
