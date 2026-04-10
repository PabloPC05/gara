import { useEffect, useRef } from 'react';
import * as $3Dmol from '3dmol';

export default function MolecularViewer({ pdbId = '1ubq', data = null }) {
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    // Initialize viewer
    const config = { backgroundColor: 'white' };
    const viewer = $3Dmol.createViewer(viewerRef.current, config);
    viewerInstance.current = viewer;

    if (data) {
      // Use provided PDB data
      viewer.addModel(data, "pdb");
      viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
      viewer.zoomTo();
      viewer.render();
    } else if (pdbId) {
      // Fetch from RCSB
      fetch(`https://files.rcsb.org/download/${pdbId}.pdb`)
        .then(response => response.text())
        .then(pdbData => {
          viewer.addModel(pdbData, "pdb");
          viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
          viewer.zoomTo();
          viewer.render();
          
          // Add some animation
          let angle = 0;
          const animate = () => {
            if (!viewerInstance.current) return;
            angle += 0.01;
            viewer.rotate(0.5, 'y');
            viewer.render();
            requestAnimationFrame(animate);
          };
          animate();
        })
        .catch(err => console.error("Error loading PDB:", err));
    }

    return () => {
      viewerInstance.current = null;
    };
  }, [pdbId, data]);

  return (
    <div className="card flex flex-col h-full min-h-[600px] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2rem]">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="shrink-0 py-6 px-8 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base uppercase tracking-widest">Estructura 3D</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualización en tiempo real con 3Dmol.js</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
             PDB: {pdbId.toUpperCase()}
           </span>
        </div>
      </div>

      {/* ── Zona del visor ──────────────────────────────────────── */}
      <div className="relative flex-1 bg-white overflow-hidden">
        <div 
          ref={viewerRef} 
          className="w-full h-full relative"
          style={{ height: '500px', width: '100%' }}
        />
        
        {/* Overlays */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
           <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-lg">
              <div className="flex flex-col gap-3">
                 {[
                   { color: '#0053D6', label: 'Muy alta (>90)' },
                   { color: '#65CBF3', label: 'Alta (70–90)' },
                   { color: '#FFDB13', label: 'Baja (50–70)' },
                   { color: '#FF7D45', label: 'Muy baja (<50)' },
                 ].map(item => (
                   <div key={item.label} className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: item.color }}></div>
                     <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{item.label}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="px-8 py-5 bg-slate-50/50 shrink-0 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-6">
           <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
             Capturar Imagen
           </button>
           <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
             Exportar PDB
           </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Renderizador Activo
        </div>
      </div>
    </div>
  );
}
