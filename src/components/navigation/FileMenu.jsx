import React from 'react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from "../ui/menubar"
import { useFileSystemStore } from '../../stores/useFileSystemStore'
import { useProteinStore } from '../../stores/useProteinStore'

export function FileMenu() {
  const { nodes, deleteNode, addSession } = useFileSystemStore();
  const { proteinsById, upsertProtein, replaceCatalog, setActiveProteinId, clearSelection } = useProteinStore();

  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer flex justify-between items-center"
  const labelClass = "px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500"
  const separatorClass = "bg-white/10 mx-1 my-1"
  const contentClass = "w-[360px] bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5"
  const subContentClass = "w-[320px] bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5"

  const handleSaveSession = () => {
    const currentProteins = Object.values(proteinsById);
    if (currentProteins.length === 0) {
      alert("No hay proteínas activas para guardar en la sesión.");
      return;
    }

    const sessionName = prompt("Nombre de la sesión:", `Sesión ${new Date().toLocaleDateString()}`);
    if (sessionName) {
      addSession(sessionName, currentProteins);
      alert(`Sesión "${sessionName}" guardada en el Workspace.`);
    }
  };

  const handleNodeClick = (node) => {
    if (node.type === 'file') {
      if (node.fileType === 'fasta') {
        upsertProtein(node.data);
        setActiveProteinId(node.data.id);
      } else if (node.fileType === 'session') {
        if (Array.isArray(node.data)) {
          replaceCatalog(node.data);
          setActiveProteinId(node.data[0].id);
        }
      }
    }
  };

  const handleDeleteNode = (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar este elemento del Workspace?')) {
      deleteNode(id);
    }
  };

  // Renderiza nodos de forma recursiva para el menú
  const renderMenuNodes = (parentId = 'root') => {
    const children = nodes.filter(n => n.parentId === parentId)
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'folder' ? -1 : 1));

    if (children.length === 0) {
      return <MenubarItem disabled className={`${itemClass} opacity-50 italic`}>Carpeta vacía</MenubarItem>
    }

    return children.map(node => {
      if (node.type === 'folder') {
        return (
          <MenubarSub key={node.id}>
            <MenubarSubTrigger className={itemClass}>
              <span>{node.name}</span>
            </MenubarSubTrigger>
            <MenubarSubContent className={subContentClass}>
              {renderMenuNodes(node.id)}
            </MenubarSubContent>
          </MenubarSub>
        )
      }

      return (
        <MenubarItem 
          key={node.id} 
          className={itemClass}
          onClick={() => handleNodeClick(node)}
        >
          <div className="flex flex-col leading-tight">
            <span className="text-[12px]">{node.name}</span>
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-tighter">
              {node.fileType === 'session' ? 'Session Package' : 'FASTA Data'}
            </span>
          </div>
          <button 
            className="text-slate-500 hover:text-red-400 px-2 py-1 text-[10px]"
            onClick={(e) => handleDeleteNode(e, node.id)}
          >
            Eliminar
          </button>
        </MenubarItem>
      )
    });
  };

  return (
    <MenubarMenu>
      <MenubarTrigger>Archivo</MenubarTrigger>
      <MenubarContent className={contentClass}>
        
        <MenubarLabel className={labelClass}>Espacio de Trabajo</MenubarLabel>
        <MenubarItem className={itemClass} onClick={clearSelection}>
          <span>Nueva Área de Trabajo (Limpiar)</span>
        </MenubarItem>
        <MenubarItem className={itemClass} onClick={handleSaveSession}>
          <span>Guardar Sesión Actual (.session)</span>
        </MenubarItem>
        
        <MenubarSeparator className={separatorClass} />

        <MenubarLabel className={labelClass}>Proyectos y Sesiones (Workspace)</MenubarLabel>
        <MenubarSub>
          <MenubarSubTrigger className={itemClass}>
            <span>Explorar Workspace...</span>
          </MenubarSubTrigger>
          <MenubarSubContent className={subContentClass}>
             <MenubarLabel className={labelClass}>Directorio Raíz</MenubarLabel>
             {renderMenuNodes('root')}
          </MenubarSubContent>
        </MenubarSub>

        <MenubarSeparator className={separatorClass} />

        <MenubarLabel className={labelClass}>Importar Estructura</MenubarLabel>
        <MenubarItem className={itemClass}>
          <span>Cargar Archivo Local (.pdb, .cif)</span>
        </MenubarItem>
        <MenubarItem className={itemClass}>
          <span>Obtener de RCSB PDB (por ID)</span>
        </MenubarItem>

        <MenubarSeparator className={separatorClass} />

        <MenubarLabel className={labelClass}>Exportar Datos</MenubarLabel>
        <MenubarItem className={itemClass}>Exportar Coordenadas (.pdb)</MenubarItem>
        <MenubarItem className={itemClass}>Exportar Secuencia (FASTA)</MenubarItem>
        
        <MenubarSeparator className={separatorClass} />

        <MenubarLabel className={labelClass}>Colaboración</MenubarLabel>
        <MenubarItem className={itemClass}>Generar Enlace de Compartición</MenubarItem>
        <MenubarItem className={itemClass}>Invitar a Sesión en Vivo</MenubarItem>

      </MenubarContent>
    </MenubarMenu>
  )
}
