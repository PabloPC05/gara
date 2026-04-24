import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Database, 
  FlaskConical, 
  Layers,
  FileJson,
  Layout
} from 'lucide-react';
import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { useProteinStore } from '../../stores/useProteinStore';
import { useUIStore } from '../../stores/useUIStore';

/**
 * Explorador de Archivos Estilo VS Code
 */
export function ProjectExplorer() {
  const { nodes, setCurrentFolderId } = useFileSystemStore();
  const { upsertProtein, replaceCatalog, setActiveProteinId } = useProteinStore();
  const { setCurrentView } = useUIStore();
  const [expanded, setExpanded] = useState({ root: true, samples: true });

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNodeClick = (node) => {
    if (node.type === 'folder') {
      toggleExpand(node.id);
      setCurrentFolderId(node.id);
    } else {
      // Si es un archivo individual (.fasta)
      if (node.fileType === 'fasta') {
        upsertProtein(node.data);
        setActiveProteinId(node.data.id);
        setCurrentView('viewer');
      } 
      // Si es una sesión completa (.session)
      else if (node.fileType === 'session') {
        if (Array.isArray(node.data)) {
          // Reemplazar todo el catálogo con las proteínas de la sesión
          replaceCatalog(node.data);
          // Activar la primera proteína de la lista
          setActiveProteinId(node.data[0].id);
          setCurrentView('viewer');
        }
      }
    }
  };

  const renderTree = (parentId = null, level = 0) => {
    const children = nodes.filter(n => n.parentId === parentId)
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'folder' ? -1 : 1));
    
    return children.map(node => {
      const isExpanded = expanded[node.id];
      const hasChildren = nodes.some(n => n.parentId === node.id);

      return (
        <div key={node.id}>
          <div 
            onClick={() => handleNodeClick(node)}
            className="group flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-white/10"
            style={{ paddingLeft: `${(level * 12) + 8}px` }}
          >
            {node.type === 'folder' && (
              isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />
            )}
            
            {node.type === 'folder' ? (
              <Folder size={14} className="text-blue-400 fill-blue-400/10" />
            ) : node.fileType === 'session' ? (
              <Layers size={14} className="text-emerald-400" />
            ) : (
              <FlaskConical size={14} className="text-amber-400" />
            )}
            
            <span className={`text-[11px] truncate uppercase tracking-tighter ${
              node.type === 'file' ? 'text-slate-300' : 'text-slate-400 font-bold'
            }`}>
              {node.name}
            </span>
            
            {node.fileType === 'session' && (
              <span className="ml-auto text-[8px] bg-emerald-500/10 text-emerald-500 px-1 py-0.5 font-mono">
                SESSION
              </span>
            )}
          </div>
          
          {node.type === 'folder' && isExpanded && renderTree(node.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#111113] select-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0b0b0d]">
        <div className="flex items-center gap-2">
          <Database size={12} className="text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Explorer</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 minimal-scrollbar">
        {renderTree(null, 0)}
      </div>

      <div className="mt-auto p-4 border-t border-white/5 bg-black/20">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-600">WORKSPACE_CORE</span>
            <span className="text-[9px] font-mono text-emerald-500/50">v2.1</span>
          </div>
          <div className="h-[1px] bg-white/5" />
          <p className="text-[9px] text-slate-500 leading-relaxed uppercase tracking-widest">
            Haz clic en un archivo <span className="text-amber-400">.fasta</span> para cargarlo o en una <span className="text-emerald-400">.session</span> para restaurar un entorno completo.
          </p>
        </div>
      </div>
    </div>
  );
}
