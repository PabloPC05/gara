import { useState, useCallback } from 'react';
import './index.css';
import FastaForm from './components/FastaForm';
import type { ResourceConfig } from './components/FastaForm';
import JobTracker from './components/JobTracker';
import ProteinViewer from './components/ProteinViewer';
import MetricsDashboard from './components/MetricsDashboard';
import ExplanationPanel from './components/ExplanationPanel';
import { submitJob, pollJobStatus, getJobOutputs } from './api/cesgaApi';
import type { JobStatusResponse, JobOutputsResponse, JobStatus } from './api/types';

type AppState = 'idle' | 'submitting' | 'polling' | 'results' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [currentStatus, setCurrentStatus] = useState<JobStatus>('PENDING');
  const [outputs, setOutputs] = useState<JobOutputsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (
    fastaSequence: string,
    filename: string,
    config: ResourceConfig,
  ) => {
    setError(null);
    setOutputs(null);
    setJobStatus(null);
    setAppState('submitting');

    try {
      // 1. Submit job
      const submitRes = await submitJob({
        fasta_sequence: fastaSequence,
        fasta_filename: filename,
        gpus: config.gpus,
        cpus: config.cpus,
        memory_gb: config.memory_gb,
        max_runtime_seconds: config.max_runtime_seconds,
      });

      setCurrentStatus('PENDING');
      setAppState('polling');

      // 2. Poll until completed
      const finalStatus = await pollJobStatus(submitRes.job_id, {
        intervalMs: 2500,
        onStatusChange: (s) => {
          setJobStatus(s);
          setCurrentStatus(s.status);
        },
      });

      if (finalStatus.status === 'FAILED' || finalStatus.status === 'CANCELLED') {
        setAppState('error');
        setError(finalStatus.error_message || 'El trabajo ha fallado.');
        return;
      }

      // 3. Fetch outputs
      const jobOutputs = await getJobOutputs(finalStatus.job_id);
      setOutputs(jobOutputs);
      setAppState('results');
    } catch (err: any) {
      console.error('Error en el flujo de trabajo:', err);
      setAppState('error');
      setError(err?.message || 'Error inesperado al procesar el trabajo.');
    }
  }, []);

  const handleReset = () => {
    setAppState('idle');
    setJobStatus(null);
    setOutputs(null);
    setError(null);
    setCurrentStatus('PENDING');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      
      {/* ─── Global Top Bar ─── */}
      <header style={{
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border-secondary)',
        background: 'var(--color-bg-secondary)',
        flexShrink: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-violet))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}>
            🧬
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: 0 }}>
              LocalFold Workstation
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {appState !== 'idle' && (
            <button onClick={handleReset} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
              + Nuevo Análisis
            </button>
          )}
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            CESGA Finis Terrae III
          </span>
        </div>
      </header>

      {/* ─── Main IDE Layout ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* ─── Left Sidebar (Input & Job Tracking) ─── */}
        <aside className="scroll-panel" style={{
          width: 400,
          flexShrink: 0,
          borderRight: '1px solid var(--color-border-secondary)',
          background: 'var(--color-bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          boxShadow: '10px 0 30px rgba(0,0,0,0.4)',
        }}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Hero / Information (Only visible if not running) */}
            {appState === 'idle' && (
              <div className="animate-fade-in-up" style={{ paddingBottom: 16, borderBottom: '1px solid var(--color-border-secondary)' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 100,
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  fontSize: 11,
                  color: 'var(--color-text-accent)',
                  fontWeight: 600,
                  marginBottom: 16,
                }}>
                  🏆 BioHack 2026
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, color: 'white', marginBottom: 12 }}>
                  Predicción 3D de Estructuras Proteicas
                </h2>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Introduce tu secuencia FASTA y visualízala en 3D usando el poder de AlphaFold2 en el CESGA.
                </p>
              </div>
            )}

            {/* Fasta Form (Hidden if polling or results) */}
            {(appState === 'idle' || appState === 'submitting') && (
              <FastaForm
                onSubmit={handleSubmit}
                isSubmitting={appState === 'submitting'}
              />
            )}

            {/* Job Tracker */}
            {(appState === 'polling' || appState === 'results' || appState === 'error') && (
              <JobTracker
                status={jobStatus}
                currentStatus={currentStatus}
              />
            )}

            {/* Error Message */}
            {appState === 'error' && error && (
              <div className="animate-fade-in-up" style={{
                padding: 16,
                borderRadius: 12,
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
              }}>
                <p style={{ color: 'var(--color-accent-rose)', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                  ⚠️ Error en el procesamiento
                </p>
                <p style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>{error}</p>
                <button onClick={handleReset} className="btn-secondary" style={{ marginTop: 16, width: '100%' }}>
                  🔄 Reintentar
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ─── Center Main (3D Viewer) ─── */}
        <main style={{
          flex: 1,
          position: 'relative',
          background: 'var(--color-bg-primary)',
          overflow: 'hidden',
        }}>
          {appState === 'results' && outputs ? (
            <ProteinViewer pdbData={outputs.structural_data.pdb_file} />
          ) : (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--color-text-muted)'
            }}>
              {appState === 'polling' ? (
                <>
                   <div className="animate-pulse-glow" style={{
                      width: 80, height: 80, borderRadius: '50%',
                      border: '4px solid var(--color-border-secondary)',
                      borderTopColor: 'var(--color-accent-cyan)',
                      animation: 'spin-slow 1s linear infinite',
                      marginBottom: 24
                   }} />
                   <h2 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>Simulando en CESGA...</h2>
                   <p style={{ marginTop: 8, fontSize: 14 }}>Calculando pliegues multidimensionales de la secuencia</p>
                </>
              ) : (
                <>
                   <div style={{ fontSize: 64, marginBottom: 24, opacity: 0.3 }}>🧊</div>
                   <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-border-secondary)' }}>Mol* Engine Ready</h2>
                   <p style={{ marginTop: 8, fontSize: 15 }}>Envía un trabajo para iniciar la visualización en pantalla completa.</p>
                </>
              )}
            </div>
          )}
        </main>

        {/* ─── Right Sidebar (Metrics Dashboard) ─── */}
        {appState === 'results' && outputs && (
          <aside className="scroll-panel" style={{
            width: 440,
            flexShrink: 0,
            borderLeft: '1px solid var(--color-border-secondary)',
            background: 'var(--color-bg-secondary)',
            zIndex: 10,
            boxShadow: '-10px 0 30px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <ExplanationPanel outputs={outputs} />
              <MetricsDashboard
                biologicalData={outputs.biological_data}
                proteinMetadata={outputs.protein_metadata}
                structuralData={outputs.structural_data}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
