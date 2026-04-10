import { useState, useEffect } from 'react';
import { getProteinSamples } from '../api/cesgaApi';
import type { ProteinSample } from '../api/types';

interface FastaFormProps {
  onSubmit: (fastaSequence: string, filename: string, config: ResourceConfig) => void;
  isSubmitting: boolean;
}

export interface ResourceConfig {
  gpus: number;
  cpus: number;
  memory_gb: number;
  max_runtime_seconds: number;
}

const DEFAULT_CONFIG: ResourceConfig = {
  gpus: 1,
  cpus: 8,
  memory_gb: 32,
  max_runtime_seconds: 3600,
};

export default function FastaForm({ onSubmit, isSubmitting }: FastaFormProps) {
  const [fastaInput, setFastaInput] = useState('');
  const [filename, setFilename] = useState('protein_seq.fasta');
  const [samples, setSamples] = useState<ProteinSample[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<ResourceConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setLoadingSamples(true);
    getProteinSamples()
      .then(setSamples)
      .catch(console.error)
      .finally(() => setLoadingSamples(false));
  }, []);

  const handleSampleSelect = (sample: ProteinSample) => {
    setFastaInput(sample.fasta);
    setFilename(`${sample.protein_name.toLowerCase().replace(/\s+/g, '_')}.fasta`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastaInput.trim()) return;
    onSubmit(fastaInput.trim(), filename, config);
  };

  const isValid = fastaInput.trim().length > 0 && fastaInput.includes('>');

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      {/* Sample proteins ribbon */}
      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          🧬 Proteínas de ejemplo — haz clic para cargar
        </label>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {loadingSamples ? (
            <div className="animate-shimmer" style={{
              height: 38,
              width: 200,
              borderRadius: 10,
              background: 'var(--color-bg-card)',
            }} />
          ) : (
            samples.map((s) => (
              <button
                key={s.uniprot_id}
                type="button"
                onClick={() => handleSampleSelect(s)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: fastaInput === s.fasta
                    ? '1px solid var(--color-accent-cyan)'
                    : '1px solid var(--color-border-secondary)',
                  background: fastaInput === s.fasta
                    ? 'rgba(6, 182, 212, 0.15)'
                    : 'var(--color-bg-card)',
                  color: fastaInput === s.fasta
                    ? 'var(--color-text-accent)'
                    : 'var(--color-text-secondary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {s.protein_name}
                <span style={{
                  marginLeft: 6,
                  fontSize: 11,
                  opacity: 0.6,
                }}>
                  ({s.sequence_length} aa)
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* FASTA textarea */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 8,
          }}>
            Secuencia FASTA
          </label>
          <textarea
            id="fasta-input"
            value={fastaInput}
            onChange={(e) => setFastaInput(e.target.value)}
            placeholder={`>sp|P0CG47|UBQ_HUMAN Ubiquitin\nMQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQR...`}
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: 160,
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--color-border-primary)',
              background: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-cyan)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-primary)'}
          />
          {fastaInput && !isValid && (
            <p style={{ color: 'var(--color-accent-rose)', fontSize: 12, marginTop: 6 }}>
              ⚠️ La secuencia FASTA debe comenzar con "&gt;" seguido de un encabezado
            </p>
          )}
        </div>

        {/* Filename */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 8,
          }}>
            Nombre del archivo
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--color-border-primary)',
              background: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        {/* Advanced config toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-accent)',
            fontSize: 13,
            cursor: 'pointer',
            marginBottom: 16,
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
          }}
        >
          {showAdvanced ? '▾' : '▸'} Configuración de recursos (avanzado)
        </button>

        {showAdvanced && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 20,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid var(--color-border-secondary)',
          }}>
            {([
              { label: 'GPUs', key: 'gpus' as const, min: 0, max: 4 },
              { label: 'CPUs', key: 'cpus' as const, min: 1, max: 64 },
              { label: 'Memoria (GB)', key: 'memory_gb' as const, min: 1, max: 256 },
              { label: 'Tiempo máx (s)', key: 'max_runtime_seconds' as const, min: 60, max: 86400 },
            ]).map(({ label, key, min, max }) => (
              <div key={key}>
                <label style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {label}
                </label>
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={config[key]}
                  onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border-secondary)',
                    background: 'var(--color-bg-input)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="btn-primary"
          style={{ width: '100%', padding: '14px 28px', fontSize: 16 }}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin-slow" style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                border: '2px solid transparent',
                borderTopColor: 'currentColor',
                borderRadius: '50%',
                animation: 'spin-slow 1s linear infinite',
              }} />
              Enviando al supercomputador...
            </>
          ) : (
            <>🚀 Enviar al CESGA Finis Terrae III</>
          )}
        </button>
      </form>
    </div>
  );
}
