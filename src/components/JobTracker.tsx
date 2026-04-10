import type { JobStatus, JobStatusResponse } from '../api/types';

interface JobTrackerProps {
  status: JobStatusResponse | null;
  currentStatus: JobStatus;
}

const STEPS: { status: JobStatus; label: string; icon: string }[] = [
  { status: 'PENDING', label: 'En cola', icon: '⏳' },
  { status: 'RUNNING', label: 'Procesando', icon: '⚙️' },
  { status: 'COMPLETED', label: 'Completado', icon: '✅' },
];

function getStepState(stepStatus: JobStatus, currentStatus: JobStatus): 'done' | 'active' | 'waiting' {
  const order: JobStatus[] = ['PENDING', 'RUNNING', 'COMPLETED'];
  const stepIdx = order.indexOf(stepStatus);
  const currentIdx = order.indexOf(currentStatus);

  if (currentStatus === 'FAILED' || currentStatus === 'CANCELLED') {
    return stepIdx <= 1 && currentIdx >= stepIdx ? 'done' : 'waiting';
  }
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'waiting';
}

export default function JobTracker({ status, currentStatus }: JobTrackerProps) {
  const isFailed = currentStatus === 'FAILED' || currentStatus === 'CANCELLED';

  return (
    <div className="glass-card animate-fade-in-up" style={{
      padding: 32,
      marginBottom: 24,
    }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        marginBottom: 8,
      }}>
        🖥️ Estado del Trabajo
      </h3>

      {status && (
        <p style={{
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
          marginBottom: 24,
        }}>
          Job ID: {status.job_id}
        </p>
      )}

      {/* Progress stepper */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 32,
      }}>
        {STEPS.map((step, i) => {
          const state = getStepState(step.status, currentStatus);
          return (
            <div key={step.status} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Step circle */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}>
                <div
                  className={state === 'active' ? 'animate-pulse-glow' : ''}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    border: state === 'done'
                      ? '2px solid var(--color-accent-emerald)'
                      : state === 'active'
                        ? '2px solid var(--color-accent-cyan)'
                        : '2px solid var(--color-border-secondary)',
                    background: state === 'done'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : state === 'active'
                        ? 'rgba(6, 182, 212, 0.15)'
                        : 'var(--color-bg-card)',
                    transition: 'all 0.5s ease',
                  }}
                >
                  {state === 'done' ? '✓' : step.icon}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: state === 'active'
                    ? 'var(--color-text-accent)'
                    : state === 'done'
                      ? 'var(--color-accent-emerald)'
                      : 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 80,
                  height: 2,
                  margin: '0 12px',
                  marginBottom: 28,
                  borderRadius: 1,
                  background: state === 'done'
                    ? 'var(--color-accent-emerald)'
                    : 'var(--color-border-secondary)',
                  transition: 'background 0.5s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {state === 'active' && (
                    <div className="animate-shimmer" style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, var(--color-accent-cyan), transparent)',
                      backgroundSize: '200% 100%',
                    }} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {isFailed && (
        <div style={{
          padding: 16,
          borderRadius: 12,
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          marginBottom: 16,
        }}>
          <p style={{ color: 'var(--color-accent-rose)', fontWeight: 600, fontSize: 14 }}>
            ❌ El trabajo ha fallado
          </p>
          {status?.error_message && (
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              marginTop: 6,
              fontFamily: 'var(--font-mono)',
            }}>
              {status.error_message}
            </p>
          )}
        </div>
      )}

      {/* Job metadata */}
      {status && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}>
          {([
            { label: 'GPUs', value: status.gpus, icon: '🎮' },
            { label: 'CPUs', value: status.cpus, icon: '🧠' },
            { label: 'Memoria', value: `${status.memory_gb} GB`, icon: '💾' },
            { label: 'Creado', value: new Date(status.created_at).toLocaleTimeString('es-ES'), icon: '🕐' },
          ]).map(({ label, value, icon }) => (
            <div key={label} style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-secondary)',
            }}>
              <div style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4,
              }}>
                {icon} {label}
              </div>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
