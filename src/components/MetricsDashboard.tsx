import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { BiologicalDataOutput, ConfidenceData, ProteinMetadata, StructuralDataOutput } from '../api/types';
import PaeHeatmap from './PaeHeatmap';

interface MetricsDashboardProps {
  biologicalData: BiologicalDataOutput;
  proteinMetadata: ProteinMetadata | null;
  structuralData: StructuralDataOutput;
}

/* ─── pLDDT per-residue chart ─── */
function PlddtChart({ confidence }: { confidence: ConfidenceData }) {
  const plddtArray = confidence.plddt_per_residue;

  if (!plddtArray.length) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Sin datos pLDDT por residuo disponibles
      </div>
    );
  }

  const data = plddtArray.map((val: number, i: number) => ({
    residue: i + 1,
    plddt: val,
  }));

  const getColor = (val: number) => {
    if (val > 90) return '#0053d6';
    if (val > 70) return '#65cbf3';
    if (val > 50) return '#ffdb13';
    return '#ff7d45';
  };

  return (
    <div className="glass-card animate-fade-in-up" style={{ padding: 20 }}>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        marginBottom: 16,
      }}>
        📊 pLDDT por Residuo
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="plddtGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="residue"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={{ stroke: '#2e303a' }}
            tickLine={false}
            label={{ value: 'Nº Residuo', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94a3b8' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={{ stroke: '#2e303a' }}
            tickLine={false}
            label={{ value: 'pLDDT', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#94a3b8' }}
          />
          <Tooltip
            contentStyle={{
              background: '#1a2332',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: 10,
              fontSize: 12,
              color: '#f1f5f9',
            }}
            formatter={(val: any) => [
              <span key="v" style={{ color: getColor(Number(val)) }}>{Number(val).toFixed(1)}</span>,
              'pLDDT',
            ]}
            labelFormatter={(label) => `Residuo ${label}`}
          />
          <ReferenceLine y={90} stroke="#0053d6" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={70} stroke="#65cbf3" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={50} stroke="#ffdb13" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Area
            type="monotone"
            dataKey="plddt"
            stroke="#06b6d4"
            fill="url(#plddtGradient)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, stroke: '#06b6d4', fill: '#0a0e17' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── PAE Heatmap wrapper for glass-card context ─── */
function PaeHeatmapWrapper({ confidence }: { confidence: ConfidenceData }) {
  const paeMatrix = confidence.pae_matrix;

  if (!paeMatrix.length) {
    return (
      <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Sin datos PAE disponibles
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in-up" style={{ padding: 20 }}>
      <PaeHeatmap paeMatrix={paeMatrix} meanPae={confidence.mean_pae} />
    </div>
  );
}

/* ─── Metric Card ─── */
function MetricCard({ label, value, icon, status, unit }: {
  label: string;
  value: string | number;
  icon: string;
  status?: 'good' | 'warn' | 'bad' | 'neutral';
  unit?: string;
}) {
  const statusColors = {
    good: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' },
    warn: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
    bad: { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.3)', text: '#f43f5e' },
    neutral: { bg: 'var(--color-bg-card)', border: 'var(--color-border-secondary)', text: 'var(--color-text-primary)' },
  };
  const c = statusColors[status || 'neutral'];

  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      background: c.bg,
      border: `1px solid ${c.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{icon} {label}</span>
      <span style={{
        fontSize: 22,
        fontWeight: 700,
        color: c.text,
        fontFamily: 'var(--font-mono)',
      }}>
        {value}{unit && <span style={{ fontSize: 13, fontWeight: 400 }}> {unit}</span>}
      </span>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function MetricsDashboard({ biologicalData, proteinMetadata, structuralData }: MetricsDashboardProps) {
  const bio = biologicalData;
  const ss = bio.secondary_structure_prediction;
  const seq = bio.sequence_properties;

  const solubilityStatus = bio.solubility_score >= 70 ? 'good' : bio.solubility_score >= 40 ? 'warn' : 'bad';
  const stabilityStatus = bio.instability_index < 40 ? 'good' : 'warn';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Protein Identity */}
      {proteinMetadata && proteinMetadata.protein_name && (
        <div className="glass-card animate-fade-in-up" style={{ padding: 20 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 12,
          }}>
            🏷️ Proteína Identificada
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Nombre</span>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-accent)' }}>
                {proteinMetadata.protein_name}
              </p>
            </div>
            {proteinMetadata.organism && (
              <div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Organismo</span>
                <p style={{ fontSize: 14, color: 'var(--color-text-primary)', fontStyle: 'italic' }}>
                  {proteinMetadata.organism}
                </p>
              </div>
            )}
            {proteinMetadata.uniprot_id && (
              <div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>UniProt</span>
                <p style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                  {proteinMetadata.uniprot_id}
                </p>
              </div>
            )}
            {proteinMetadata.plddt_average != null && (
              <div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>pLDDT Promedio</span>
                <p style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: proteinMetadata.plddt_average > 90 ? '#0053d6'
                    : proteinMetadata.plddt_average > 70 ? '#65cbf3'
                    : proteinMetadata.plddt_average > 50 ? '#ffdb13'
                    : '#ff7d45',
                }}>
                  {proteinMetadata.plddt_average.toFixed(1)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        <MetricCard
          label="Solubilidad"
          value={bio.solubility_score.toFixed(1)}
          unit="%"
          icon="💧"
          status={solubilityStatus}
        />
        <MetricCard
          label="Índice de Inestabilidad"
          value={bio.instability_index.toFixed(1)}
          icon="⚗️"
          status={stabilityStatus}
        />
        {bio.stability_status && (
          <MetricCard
            label="Estado"
            value={bio.stability_status}
            icon="🛡️"
            status={bio.stability_status.toLowerCase().includes('stable') ? 'good' : 'warn'}
          />
        )}
        {seq && (
          <MetricCard
            label="Peso Molecular"
            value={seq.molecular_weight_kda.toFixed(1)}
            unit="kDa"
            icon="⚖️"
            status="neutral"
          />
        )}
      </div>

      {/* pLDDT chart */}
      <PlddtChart confidence={structuralData.confidence} />

      {/* PAE Heatmap */}
      <PaeHeatmapWrapper confidence={structuralData.confidence} />

      {/* Secondary structure */}
      {ss && (
        <div className="glass-card animate-fade-in-up" style={{ padding: 20 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 16,
          }}>
            🧱 Estructura Secundaria
          </h3>
          <div style={{ display: 'flex', gap: 4, borderRadius: 10, overflow: 'hidden', height: 28 }}>
            <div style={{
              width: `${ss.helix_percent}%`,
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: 'white',
              minWidth: ss.helix_percent > 8 ? 'auto' : 0,
            }}>
              {ss.helix_percent > 8 ? `α ${ss.helix_percent.toFixed(0)}%` : ''}
            </div>
            <div style={{
              width: `${ss.strand_percent}%`,
              background: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: 'white',
              minWidth: ss.strand_percent > 8 ? 'auto' : 0,
            }}>
              {ss.strand_percent > 8 ? `β ${ss.strand_percent.toFixed(0)}%` : ''}
            </div>
            <div style={{
              width: `${ss.coil_percent}%`,
              background: 'linear-gradient(135deg, #64748b, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: 'white',
              minWidth: ss.coil_percent > 8 ? 'auto' : 0,
            }}>
              {ss.coil_percent > 8 ? `Coil ${ss.coil_percent.toFixed(0)}%` : ''}
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: 20,
            marginTop: 10,
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}>
            <span>🟣 α-Hélice: {ss.helix_percent.toFixed(1)}%</span>
            <span>🔵 β-Lámina: {ss.strand_percent.toFixed(1)}%</span>
            <span>⚪ Coil: {ss.coil_percent.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Alerts */}
      {(bio.toxicity_alerts.length > 0 || bio.allergenicity_alerts.length > 0) && (
        <div className="glass-card animate-fade-in-up" style={{ padding: 20 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 12,
          }}>
            ⚠️ Alertas de Seguridad
          </h3>
          {bio.toxicity_alerts.length > 0 && (
            <div style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              marginBottom: 8,
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent-rose)', marginBottom: 4 }}>
                ☠️ Toxicidad
              </p>
              {bio.toxicity_alerts.map((alert, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>• {alert}</p>
              ))}
            </div>
          )}
          {bio.allergenicity_alerts.length > 0 && (
            <div style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent-amber)', marginBottom: 4 }}>
                🤧 Alergenicidad
              </p>
              {bio.allergenicity_alerts.map((alert, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>• {alert}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sequence properties */}
      {seq && (
        <div className="glass-card animate-fade-in-up" style={{ padding: 20 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 16,
          }}>
            🔢 Propiedades de la Secuencia
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}>
            {([
              { label: 'Longitud', value: seq.length, unit: 'aa' },
              { label: 'Peso Molecular', value: seq.molecular_weight_kda.toFixed(1), unit: 'kDa' },
              { label: 'Cargas +', value: seq.positive_charges, unit: '' },
              { label: 'Cargas −', value: seq.negative_charges, unit: '' },
              { label: 'Cisteínas', value: seq.cysteine_residues, unit: '' },
              { label: 'Aromáticos', value: seq.aromatic_residues, unit: '' },
            ]).map(({ label, value, unit }) => (
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
                  {label}
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {value} {unit && <span style={{ fontSize: 12, opacity: 0.7 }}>{unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
