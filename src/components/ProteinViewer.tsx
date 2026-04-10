import { useRef, useEffect, useCallback, useState } from 'react';

interface ProteinViewerProps {
  pdbData: string | null;
  plddtScores?: Record<string, number> | null;
}

// pLDDT color scale (AlphaFold convention)
const PLDDT_LEGEND = [
  { label: 'Muy alta (pLDDT > 90)', color: '#0053d6', range: '> 90' },
  { label: 'Alta (70 < pLDDT ≤ 90)', color: '#65cbf3', range: '70–90' },
  { label: 'Baja (50 < pLDDT ≤ 70)', color: '#ffdb13', range: '50–70' },
  { label: 'Muy baja (pLDDT ≤ 50)', color: '#ff7d45', range: '≤ 50' },
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
      // @ts-ignore — 3Dmol.js doesn't have proper TS typings
      const $3Dmol = await import('3dmol');

      // Clear previous
      containerRef.current.innerHTML = '';

      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: '#0a0e17',
        antialias: true,
      });

      viewer.addModel(pdbData, 'pdb');

      // Color by B-factor (pLDDT is stored in B-factor column)
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
      viewerRef.current.spin('y');
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

  if (!pdbData) {
    return (
      <div className="glass-card" style={{
        padding: 40,
        textAlign: 'center',
        color: 'var(--color-text-muted)',
      }}>
        <p style={{ fontSize: 48, marginBottom: 12 }}>🔬</p>
        <p>Esperando datos estructurales...</p>
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in-up" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          margin: 0,
        }}>
          🧬 Visor 3D de Estructura Proteica
        </h3>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['cartoon', 'stick', 'sphere'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewMode(mode)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: viewMode === mode
                  ? '1px solid var(--color-accent-cyan)'
                  : '1px solid var(--color-border-secondary)',
                background: viewMode === mode
                  ? 'rgba(6, 182, 212, 0.15)'
                  : 'transparent',
                color: viewMode === mode
                  ? 'var(--color-text-accent)'
                  : 'var(--color-text-muted)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                textTransform: 'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
          <button onClick={handleSpin} className="btn-secondary" style={{
            padding: '5px 12px',
            fontSize: 12,
            borderRadius: 8,
          }}>
            {isSpinning ? '⏸ Parar' : '🔄 Girar'}
          </button>
          <button onClick={handleReset} className="btn-secondary" style={{
            padding: '5px 12px',
            fontSize: 12,
            borderRadius: 8,
          }}>
            ↩ Reset
          </button>
        </div>
      </div>

      {/* 3D Viewer */}
      <div style={{ position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-primary)',
            zIndex: 10,
          }}>
            <div className="animate-pulse-glow" style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: '3px solid var(--color-accent-cyan)',
              borderTopColor: 'transparent',
              animation: 'spin-slow 1s linear infinite',
            }} />
          </div>
        )}
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: 450,
            background: 'var(--color-bg-primary)',
          }}
        />
      </div>

      {/* pLDDT Legend */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--color-border-secondary)',
        background: 'rgba(0, 0, 0, 0.2)',
      }}>
        <p style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Escala de confianza pLDDT (AlphaFold2)
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {PLDDT_LEGEND.map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: color,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
