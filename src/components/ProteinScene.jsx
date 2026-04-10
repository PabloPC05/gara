import { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export default function ProteinScene() {
  const containerRef = useRef(null);
  const viewerInstance = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = $3Dmol.createViewer(containerRef.current, {
      backgroundColor: 'white',
      id: 'background-viewer'
    });
    viewerInstance.current = viewer;

    const pdbs = ['1ubq', '1crn', '6lu7', '1tna', '7ahl'];
    
    pdbs.forEach((pdb, index) => {
      fetch(`https://files.rcsb.org/download/${pdb}.pdb`)
        .then(response => response.text())
        .then(data => {
          const model = viewer.addModel(data, "pdb");
          const offset = {
            x: (Math.random() - 0.5) * 80,
            y: (Math.random() - 0.5) * 80,
            z: (Math.random() - 0.5) * 60 - 30
          };
          model.translate(offset.x, offset.y, offset.z);
          viewer.setStyle({model: index}, {
            cartoon: { 
              color: index % 2 === 0 ? '#3b82f6' : '#10b981',
              opacity: 0.8,
              thickness: 1.2
            }
          });
          viewer.zoomTo();
          viewer.render();
        })
        .catch(err => console.error("Error loading bg PDB:", err));
    });

    const animate = () => {
      if (!viewerInstance.current) return;
      viewer.rotate(0.08, 'y');
      viewer.rotate(0.03, 'x');
      viewer.render();
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      viewerInstance.current = null;
    };
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setIsMenuOpen(true);
  };

  return (
    <div 
      className="absolute inset-0 z-0 bg-white cursor-move"
      onContextMenu={handleContextMenu}
    >
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Context Menu Triggering via DropdownMenu */}
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div 
            style={{ 
              position: 'fixed', 
              left: menuPosition.x, 
              top: menuPosition.y, 
              width: 1, 
              height: 1, 
              visibility: 'hidden' 
            }} 
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>Acciones de Escena</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Centrar Vista
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Captura de Pantalla
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Añadir Proteína</DropdownMenuItem>
            <DropdownMenuItem>Limpiar Espacio</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            Reiniciar Motor
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="absolute top-20 left-[280px] pointer-events-none">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Explorador Proteico</h1>
        <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px] mt-2">
          Interacción 3D en tiempo real / Espacio Infinito
        </p>
      </div>

      <div className="absolute bottom-8 right-8 pointer-events-none flex flex-col items-end gap-2">
        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-100 shadow-sm flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controles:</span>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Click Derecho: Menú</span>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Arrastrar: Rotar</span>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-20" 
        style={{ 
          backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', 
          backgroundSize: '60px 60px',
        }} 
      />
    </div>
  );
}
