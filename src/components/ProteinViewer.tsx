import { useRef, useEffect, useCallback, useState } from 'react';

interface ProteinViewerProps {
  pdbData: string | null;
  plddtScores?: Record<string, number> | null;
}

// pLDDT color scale (AlphaFold convention)
const PLDDT_LEGEND = [
  { label: 'Muy alta (> 90)', color: '#0053d6', range: '> 90' },
  { label: 'Alta (70–90)', color: '#65cbf3', range: '70–90' },
  { label: 'Baja (50–70)', color: '#ffdb13', range: '50–70' },
  { label: 'Muy baja (≤ 50)', color: '#ff7d45', range: '≤ 50' },
];

export default function ProteinViewer({ pdbData }: ProteinViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cartoon' | 'stick' | 'sphere'>('cartoon');
  const [isSpinning, setIsSpinning] = useState(false);

  const initViewer = useCallback(async () => {
    if (!containerRef.current || !pdbData) return;

    try {
      setIsLoading(true);
      // @ts-ignore — 3Dmol.js doesn't have proper TS typings
      const $3Dmol = await import('3dmol');

      containerRef.current.innerHTML = '';

      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: '#0a0e17', // Match var(--color-bg-primary)
        antialias: true,
      });

      viewer.addModel(pdbData, 'pdb');

      // Color by B-factor
      viewer.setStyle({}, {
        cartoon: {
          colorfunc: (atom: any) => {
            const bfactor = atom.b;
            if (bfactor > 90) return '#0053d6';
            if (bfactor > 70) return '#65cbf3';
            if (bfactor > 50) return '#ffdb13';
            return '#ff7d45';
          },
        },
      });

      viewer.zoomTo();
      viewer.render();
      viewerRef.current = viewer;
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing 3Dmol viewer:', err);
      setIsLoading(false);
    }
  }, [pdbData]);

  useEffect(() => {
    initViewer();
  }, [initViewer]);

  const handleViewMode = (mode: 'cartoon' | 'stick' | 'sphere') => {
    setViewMode(mode);
    if (!viewerRef.current) return;

    const colorFunc = (atom: any) => {
      const b = atom.b;
      if (b > 90) return '#0053d6';
      if (b > 70) return '#65cbf3';
      if (b > 50) return '#ffdb13';
      return '#ff7d45';
    };

    viewerRef.current.setStyle({}, {
      [mode]: mode === 'cartoon'
        ? { colorfunc: colorFunc }
        : { colorscheme: { prop: 'b', gradient: 'rwb', min: 0, max: 100 } },
    });
    viewerRef.current.render();
  };

  const handleSpin = () => {
    if (!viewerRef.current) return;
    if (isSpinning) {
      viewerRef.current.spin(false);
    } else {
      viewerRef.current.spin('y', 0.01);
    }
    setIsSpinning(!isSpinning);
  };

  const handleReset = () => {
    if (!viewerRef.current) return;
    viewerRef.current.spin(false);
    setIsSpinning(false);
    viewerRef.current.zoomTo();
    viewerRef.current.render();
  };

  if (!pdbData) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3Dmol.js Wrapper container */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--color-bg-primary)',
          cursor: isSpinning ? 'default' : 'grab',
        }}
        onMouseDown={(e) => (e.currentTarget.style.cursor = 'grabbing')}
        onMouseUp={(e) => (e.currentTarget.style.cursor = 'grab')}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 14, 23, 0.8)',
          zIndex: 20,
          backdropFilter: 'blur(4px)',
        }}>
          <div className="animate-pulse-glow" style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '4px solid var(--color-accent-cyan)',
            borderTopColor: 'transparent',
            animation: 'spin-slow 1s linear infinite',
          }} />
        </div>
      )}

      {/* HUD - Top Controls */}
      <div className="animate-fade-in-up" style={{
        position: 'absolute',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'var(--color-bg-glass)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--color-border-secondary)',
        borderRadius: 100,
        padding: '6px',
        display: 'flex',
        gap: 6,
        boxShadow: 'var(--shadow-card)',
      }}>
        {(['cartoon', 'stick', 'sphere'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => handleViewMode(mode)}
            style={{
              padding: '6px 16px',
              borderRadius: 100,
              border: viewMode === mode ? '1px solid var(--color-accent-cyan)' : '1px solid transparent',
              background: viewMode === mode ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: viewMode === mode ? 'white' : 'var(--color-text-muted)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {mode}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--color-border-secondary)', margin: '0 4px' }} />
        <button onClick={handleSpin} style={{
          padding: '6px 16px',
          borderRadius: 100,
          border: '1px solid transparent',
          background: isSpinning ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: 'var(--color-text-primary)',
          fontSize: 13,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
          {isSpinning ? '⏸ Parar' : '↻ Girar'}
        </button>
        <button onClick={handleReset} style={{
          padding: '6px 16px',
          borderRadius: 100,
          border: '1px solid transparent',
          background: 'transparent',
          color: 'var(--color-text-primary)',
          fontSize: 13,
          cursor: 'pointer',
        }}>
          🏠 Reset
        </button>
      </div>

      {/* HUD - Bottom Legend */}
      <div className="animate-fade-in-up" style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        zIndex: 10,
        background: 'var(--color-bg-glass)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--color-border-secondary)',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Confianza AlphaFold2 (pLDDT)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PLDDT_LEGEND.map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
