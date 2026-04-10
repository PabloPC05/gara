import React, { useEffect, useRef, useState } from 'react';

/**
 * MolecularUniverse - Expert Component for 3D Bio-Visualization
 * Using 3Dmol.js from Global Window Reference
 */
export default function MolecularUniverse({ proteins = [], background = '#000000' }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [status, setStatus] = useState('Initializing Engine...');

  useEffect(() => {
    // 1. Wait for 3Dmol to be ready in the global scope
    const initViewer = () => {
      if (!window.$3Dmol || !containerRef.current) return;

      // Ensure we don't duplicate viewers
      if (viewerRef.current) {
        viewerRef.current.clear();
      } else {
        viewerRef.current = window.$3Dmol.createViewer(containerRef.current, {
          backgroundColor: background,
        });
      }

      const viewer = viewerRef.current;
      let count = 0;

      setStatus(`Loading ${proteins.length} proteins...`);

      proteins.forEach((prot) => {
        const { pdbId, x, y, z } = prot;
        
        // Use 3Dmol's internal downloader which is more robust for its internal state
        window.$3Dmol.download(`pdb:${pdbId}`, viewer, {
          onanim: (m) => {
            m.translate(x, y, z);
            m.setStyle({}, { cartoon: { color: 'spectrum', shadow: false } });
            count++;
            
            // Force re-render and zoom on first and last load
            if (count === 1 || count === proteins.length) {
              viewer.zoomTo();
              viewer.render();
              setStatus('Universe Active');
            }
          }
        }, (err) => {
          console.error("3Dmol Error:", err);
          setStatus("Error Loading PDBs");
        });
      });
    };

    // Check if 3Dmol is already there, otherwise wait a bit
    if (window.$3Dmol) {
      initViewer();
    } else {
      const interval = setInterval(() => {
        if (window.$3Dmol) {
          clearInterval(interval);
          initViewer();
        }
      }, 500);
      return () => clearInterval(interval);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.clear();
      }
    };
  }, [proteins, background]);

  return (
    <div className="w-full h-full relative bg-black">
      <div ref={containerRef} className="w-full h-full" style={{ position: 'absolute' }} />
      <div className="absolute top-20 left-10 z-20 pointer-events-none flex flex-col gap-2">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{status}</span>
        </div>
      </div>
    </div>
  );
}
