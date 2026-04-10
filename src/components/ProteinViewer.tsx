import { useRef, useEffect, useCallback } from 'react';
import 'pdbe-molstar/build/pdbe-molstar.css';

interface ProteinViewerProps {
  pdbData: string | null;
  plddtScores?: Record<string, number> | null;
}

export default function ProteinViewer({ pdbData }: ProteinViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  const initViewer = useCallback(async () => {
    if (!containerRef.current || !pdbData) return;

    try {
      // Import molstar plugin (it typically binds as a class we can instantiate)
      // @ts-ignore
      const PDBeMolstarPlugin = (await import('pdbe-molstar/build/pdbe-molstar-plugin.js')).default || window.PDBeMolstarPlugin;
      
      let pluginInstance = viewerRef.current;
      
      if (!pluginInstance) {
        pluginInstance = new PDBeMolstarPlugin();
        viewerRef.current = pluginInstance;
      }

      // Convert the raw pdb string into a data URL so Mol* can load it correctly
      const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(pdbData)}`;

      const options = {
        customData: {
          url: dataUrl,
          format: 'pdb',
        },
        alphafoldView: true,
        bgColor: { r: 10, g: 14, b: 23 }, // Matches var(--color-bg-primary)
        hideControls: false,              // Show the full Mol* UI
        hideLog: true,                    // Hide the verbose log initially
      };

      pluginInstance.render(containerRef.current, options);
    } catch (err) {
      console.error('Error initializing Mol* viewer:', err);
    }
  }, [pdbData]);

  useEffect(() => {
    initViewer();
  }, [initViewer]);

  if (!pdbData) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 
        PDBe Molstar automatically generates its own highly-detailed, 
        AlphaFold-style HUD inside this container. It needs absolute 
        positioning to fill the area correctly.
      */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--color-bg-primary)',
        }}
      >
        <div
          ref={containerRef}
          className="viewerSection"
          style={{ width: '100%', height: '100%', position: 'relative' }}
        />
      </div>
    </div>
  );
}
