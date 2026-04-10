import { useState, useCallback } from 'react';
import './index.css';
import FastaForm from './components/FastaForm';
import type { ResourceConfig } from './components/FastaForm';
import JobTracker from './components/JobTracker';
import ProteinViewer from './components/ProteinViewer';
import MetricsDashboard from './components/MetricsDashboard';
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
        intervalMs: 3000,
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
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ─── Header ─── */}
      <header style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border-secondary)',
        background: 'var(--color-bg-glass)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-violet))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}>
            🧬
          </div>
          <div>
            <h1 style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0,
            }}>
              LocalFold
            </h1>
            <p style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              margin: 0,
            }}>
              Powered by CESGA Finis Terrae III
            </p>
          </div>
        </div>

        {appState !== 'idle' && (
          <button onClick={handleReset} className="btn-secondary" style={{
            padding: '6px 16px',
            fontSize: 13,
          }}>
            ← Nuevo análisis
          </button>
        )}
      </header>

      {/* ─── Main Content ─── */}
      <main style={{
        flex: 1,
        maxWidth: 1100,
        width: '100%',
        margin: '0 auto',
        padding: '32px 20px 60px',
      }}>
        {/* Hero section — only when idle */}
        {appState === 'idle' && (
          <div className="animate-fade-in-up" style={{
            textAlign: 'center',
            marginBottom: 40,
          }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 100,
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              fontSize: 12,
              color: 'var(--color-text-accent)',
              fontWeight: 500,
              marginBottom: 20,
            }}>
              🏆 BioHack — Cátedra Camelia · Hackathon 2026
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: 16,
              color: 'var(--color-text-primary)',
            }}>
              Predice la estructura 3D<br />
              <span style={{
                background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-violet))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                de cualquier proteína
              </span>
            </h2>
            <p style={{
              fontSize: 16,
              color: 'var(--color-text-secondary)',
              maxWidth: 560,
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Envía tu secuencia FASTA y deja que <strong style={{ color: 'var(--color-text-accent)' }}>AlphaFold2</strong>
              {' '}en el supercomputador del CESGA prediga su estructura tridimensional con métricas de confianza.
            </p>
          </div>
        )}

        {/* FASTA Form — visible when idle or submitting */}
        {(appState === 'idle' || appState === 'submitting') && (
          <div className="glass-card" style={{ padding: '28px 24px' }}>
            <FastaForm
              onSubmit={handleSubmit}
              isSubmitting={appState === 'submitting'}
            />
          </div>
        )}

        {/* Job Tracker — visible during polling and results */}
        {(appState === 'polling' || appState === 'results' || appState === 'error') && (
          <JobTracker
            status={jobStatus}
            currentStatus={currentStatus}
          />
        )}

        {/* Error state */}
        {appState === 'error' && error && (
          <div className="glass-card animate-fade-in-up" style={{
            padding: 24,
            textAlign: 'center',
            marginTop: 20,
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
            <p style={{ color: 'var(--color-accent-rose)', fontWeight: 600, fontSize: 16 }}>
              {error}
            </p>
            <button onClick={handleReset} className="btn-primary" style={{ marginTop: 20 }}>
              🔄 Intentar de nuevo
            </button>
          </div>
        )}

        {/* Results — 3D viewer and metrics */}
        {appState === 'results' && outputs && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gap: 24,
            }}>
              {/* 3D Viewer */}
              <ProteinViewer
                pdbData={outputs.structural_data.pdb_file}
                plddtScores={outputs.structural_data.confidence as any}
              />

              {/* Metrics Dashboard */}
              <MetricsDashboard
                biologicalData={outputs.biological_data}
                proteinMetadata={outputs.protein_metadata}
                structuralData={outputs.structural_data}
              />
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer style={{
        padding: '20px 24px',
        borderTop: '1px solid var(--color-border-secondary)',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--color-text-muted)',
      }}>
        <p>
          LocalFold · BioHack 2026 · Impulsado por{' '}
          <a
            href="https://www.cesga.es"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--color-text-accent)', textDecoration: 'none' }}
          >
            CESGA Finis Terrae III
          </a>
          {' '}y AlphaFold2
        </p>
      </footer>
    </div>
  );
}
