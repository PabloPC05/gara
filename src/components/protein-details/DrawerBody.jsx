import { useState } from 'react'
import {
  TriangleAlert,
  BookOpen,
  Database,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  Link2,
  Terminal,
} from 'lucide-react'
import PaeHeatmap from '@/components/PaeHeatmap'

/* ─────────────── utilidades numéricas ─────────────── */

const intFmt = new Intl.NumberFormat('es-ES')
const num2Fmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })
const num3Fmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 })

const safeFilename = (name) =>
  (name || 'protein').replace(/[^a-z0-9_-]+/gi, '_').toLowerCase()

const downloadBlob = (content, filename, mime) => {
  if (!content) return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const pubmedUrl = (term) =>
  `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(term)}`

// MW puede venir en Da o en kDa según la fuente — si es < 1000 asumimos kDa.
const toDalton = (mw) => {
  if (mw == null) return null
  return mw < 1000 ? mw * 1000 : mw
}

/* ─────────────── normalizador de shape ─────────────── */

function normalizeProtein(protein) {
  if (!protein) return null

  const raw = protein._raw ?? {}
  const meta = raw.protein_metadata ?? {}
  const bioRaw = raw.biological_data ?? {}
  const seqProps = raw.sequence_properties ?? raw.biological_data?.sequence_properties ?? {}
  const conf = raw.structural_data?.confidence ?? {}
  const bioUnified = protein.biological ?? null

  const pick = (...values) => {
    for (const v of values) {
      if (v != null && v !== '') return v
    }
    return null
  }

  const mwDa = toDalton(
    pick(
      protein.molecular_weight,
      bioUnified?.molecularWeight,
      seqProps.molecular_weight_kda != null ? seqProps.molecular_weight_kda * 1000 : null,
    ),
  )

  const toxicity =
    bioUnified?.toxicityAlerts ??
    bioRaw.toxicity_alerts ??
    (bioUnified?.toxicityAlert ? [bioUnified.toxicityLabel || 'Alerta'] : [])

  return {
    name: pick(protein.protein_name, protein.name, meta.protein_name),
    organism: pick(protein.organism, meta.organism),
    length: pick(protein.length, seqProps.length),
    description: pick(protein.description, meta.description),
    tags: Array.isArray(protein.tags) ? protein.tags : [],
    proteinId: pick(protein.protein_id, protein.id),
    uniprotId: pick(protein.uniprot_id, protein.uniprotId, meta.uniprot_id),
    pdbId: pick(protein.pdb_id, protein.pdbId, meta.pdb_id),
    category: pick(protein.category),
    modelType: pick(meta.model_type),
    jobId: pick(raw.job_id, protein.jobId),
    dataSource: pick(meta.data_source),

    function: pick(protein.function),
    cellularLocation: pick(protein.cellular_location),
    activity: pick(protein.activity),

    mwDa,
    isoelectricPoint: pick(protein.isoelectric_point, bioUnified?.isoelectricPoint),
    positiveCharges: pick(bioUnified?.positiveCharges, seqProps.positive_charges),
    negativeCharges: pick(bioUnified?.negativeCharges, seqProps.negative_charges),
    cysteines: pick(bioUnified?.cysteineResidues, seqProps.cysteine_residues),
    halfLife: pick(bioUnified?.halfLife),
    extinctionCoefficient: pick(bioUnified?.extinctionCoefficient),

    plddtMean: pick(protein.plddtMean, conf.plddt_mean),
    meanPae: pick(protein.meanPae, conf.mean_pae),
    paeMatrix: Array.isArray(conf.pae_matrix) ? conf.pae_matrix : [],

    solubilityScore: pick(bioUnified?.solubility, bioRaw.solubility_score),
    solubilityLabel: pick(bioUnified?.solubilityLabel, bioRaw.solubility_prediction),
    instabilityIndex: pick(bioUnified?.instabilityIndex, bioRaw.instability_index),
    instabilityLabel: pick(bioUnified?.instabilityLabel, bioRaw.stability_status),
    toxicityAlerts: Array.isArray(toxicity) ? toxicity : [],
    allergenicityAlerts: Array.isArray(bioRaw.allergenicity_alerts)
      ? bioRaw.allergenicity_alerts
      : [],

    knownStructures: Array.isArray(protein.known_structures) ? protein.known_structures : [],
    sequence: pick(protein.sequence),
    fastaReady: pick(protein.fasta_ready),
  }
}

/* ─────────────── primitivas de layout ─────────────── */

function Section({ title, aside, children }) {
  return (
    <section className="py-2.5 first:pt-4">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <h3 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {title}
        </h3>
        {aside && (
          <span className="font-mono text-[9px] tabular-nums text-slate-400">{aside}</span>
        )}
      </div>
      {children}
    </section>
  )
}

/* Fila de una sola columna (para valores con etiqueta larga o con sub) */
function Row({ label, sub, value, unit, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <dt className="flex min-w-0 flex-col leading-tight">
        <span className="text-[11px] text-slate-600">{label}</span>
        {sub && <span className="font-mono text-[9px] text-slate-400">{sub}</span>}
      </dt>
      <dd className="flex items-baseline gap-1 whitespace-nowrap">
        <span className={`font-mono text-[12px] font-semibold tabular-nums ${tone || 'text-slate-800'}`}>
          {value}
        </span>
        {unit && <span className="font-mono text-[9px] text-slate-400">{unit}</span>}
      </dd>
    </div>
  )
}

/* Celda compacta para grid 2-col */
function Cell({ label, value, unit, sub, tone }) {
  return (
    <div className="flex flex-col gap-0.5 py-1">
      <dt className="text-[9px] font-medium uppercase tracking-wider text-slate-400 leading-none">
        {label}
      </dt>
      <dd className={`font-mono text-[11px] font-semibold tabular-nums leading-tight ${tone || 'text-slate-800'}`}>
        {value}
        {unit && <span className="ml-0.5 text-[9px] font-normal text-slate-400">{unit}</span>}
        {sub && <span className="ml-1 text-[9px] font-normal text-slate-400 normal-case">{sub}</span>}
      </dd>
    </div>
  )
}

function ProseField({ label, children }) {
  return (
    <div>
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-[11px] leading-snug text-slate-700">{children}</dd>
    </div>
  )
}

/* ─────────────── 1. Identidad ─────────────── */

function IdentityPanel({ v }) {
  const links = [
    v.uniprotId && { label: 'UniProt', href: `https://www.uniprot.org/uniprot/${v.uniprotId}`, icon: Database },
    v.pdbId && { label: 'RCSB', href: `https://www.rcsb.org/structure/${v.pdbId}`, icon: Link2 },
    v.uniprotId && { label: 'AlphaFold', href: `https://alphafold.ebi.ac.uk/entry/${v.uniprotId}`, icon: ExternalLink },
    v.name && { label: 'PubMed', href: pubmedUrl(`${v.name} structure`), icon: BookOpen },
  ].filter(Boolean)

  return (
    <header className="pt-6 pb-3">
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Ficha proteína
      </span>
      <h2 className="mt-0.5 text-base font-bold leading-tight tracking-tight text-slate-900">
        {v.name ?? 'Proteína sin identificar'}
      </h2>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500">
        {v.organism && <span className="italic">{v.organism}</span>}
        {v.organism && v.length != null && <span className="text-slate-300">·</span>}
        {v.length != null && (
          <span className="font-mono tabular-nums">{intFmt.format(v.length)} aa</span>
        )}
        {v.dataSource && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">{v.dataSource}</span>
          </>
        )}
      </div>

      {v.description && (
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
          {v.description}
        </p>
      )}

      {v.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {v.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded border border-slate-200 bg-slate-50/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* IDs compactos en línea */}
      {(v.proteinId || v.uniprotId || v.pdbId || v.modelType || v.jobId) && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[9px] text-slate-400">
          {v.proteinId && (
            <span>id <span className="text-slate-600">{v.proteinId}</span></span>
          )}
          {v.uniprotId && (
            <span>uniprot <span className="text-slate-600">{v.uniprotId}</span></span>
          )}
          {v.pdbId && (
            <span>pdb <span className="text-slate-600">{v.pdbId}</span></span>
          )}
          {v.modelType && (
            <span>model <span className="text-slate-600">{v.modelType}</span></span>
          )}
          {v.jobId && (
            <span title={v.jobId}>job <span className="text-slate-600">{v.jobId.slice(0, 12)}{v.jobId.length > 12 ? '…' : ''}</span></span>
          )}
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {links.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              <Icon className="h-2.5 w-2.5" strokeWidth={2} />
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}

/* ─────────────── 2. Función biológica ─────────────── */

function FunctionSection({ v }) {
  if (!v.function && !v.cellularLocation && !v.activity) return null

  return (
    <Section title="Función biológica">
      <dl className="flex flex-col gap-1.5">
        {v.function && <ProseField label="Función">{v.function}</ProseField>}
        {v.cellularLocation && (
          <ProseField label="Localización celular">{v.cellularLocation}</ProseField>
        )}
        {v.activity && <ProseField label="Actividad">{v.activity}</ProseField>}
      </dl>
    </Section>
  )
}

/* ─────────────── 3. Propiedades físico-químicas ─────────────── */

function PhysicalProps({ v }) {
  const mwKda = v.mwDa != null ? v.mwDa / 1000 : null
  const avgRes = v.length > 0 && v.mwDa != null ? v.mwDa / v.length : null
  const pI = v.isoelectricPoint
  const pINote = pI == null ? null : pI > 7.4 ? 'básica' : pI < 6.6 ? 'ácida' : 'neutra'
  const pITone = pI == null ? null : pI > 7.4 ? 'text-blue-700' : pI < 6.6 ? 'text-rose-700' : 'text-slate-800'
  const net =
    v.positiveCharges != null && v.negativeCharges != null
      ? v.positiveCharges - v.negativeCharges
      : null
  const netTone = net == null ? 'text-slate-800' : net > 0 ? 'text-blue-700' : net < 0 ? 'text-rose-700' : 'text-slate-800'

  const hasAny =
    v.length != null || mwKda != null || pI != null ||
    v.positiveCharges != null || v.negativeCharges != null ||
    v.cysteines != null || v.halfLife != null || v.extinctionCoefficient != null

  if (!hasAny) return null

  return (
    <Section title="Propiedades físico-químicas">
      <dl className="flex flex-col divide-y divide-slate-100 border-y border-slate-100">
        {v.length != null && (
          <Cell label="Longitud" value={intFmt.format(v.length)} unit="aa" />
        )}
        {mwKda != null && (
          <Cell
            label="Peso molecular"
            value={num2Fmt.format(mwKda)}
            unit="kDa"
            sub={`${intFmt.format(Math.round(v.mwDa))} Da`}
          />
        )}
        {avgRes != null && (
          <Cell label="Masa/residuo" value={num2Fmt.format(avgRes)} unit="Da/aa" />
        )}
        {pI != null && (
          <Cell
            label="Punto isoel."
            value={num2Fmt.format(pI)}
            unit="pI"
            sub={pINote}
            tone={pITone}
          />
        )}
        {v.positiveCharges != null && (
          <Cell
            label="Cargas (+)"
            value={intFmt.format(v.positiveCharges)}
            sub="Lys+Arg"
            tone="text-blue-700"
          />
        )}
        {v.negativeCharges != null && (
          <Cell
            label="Cargas (−)"
            value={intFmt.format(v.negativeCharges)}
            sub="Asp+Glu"
            tone="text-rose-700"
          />
        )}
        {net != null && (
          <Cell
            label="Carga neta"
            value={`${net > 0 ? '+' : ''}${net}`}
            unit="e⁻"
            sub={v.length > 0 ? `${num3Fmt.format(net / v.length)} e⁻/aa` : null}
            tone={netTone}
          />
        )}
        {v.cysteines != null && (
          <Cell
            label="Cisteínas"
            value={intFmt.format(v.cysteines)}
            sub={Math.floor(v.cysteines / 2) > 0 ? `máx. ${Math.floor(v.cysteines / 2)} S–S` : null}
          />
        )}
        {v.halfLife && (
          <Cell label="Vida media" value={v.halfLife} />
        )}
        {v.extinctionCoefficient != null && (
          <Cell
            label="ε₂₈₀"
            value={intFmt.format(v.extinctionCoefficient)}
            unit="M⁻¹·cm⁻¹"
          />
        )}
      </dl>
    </Section>
  )
}

/* ─────────────── 4. Confianza estructural ─────────────── */

const plddtBand = (val) => {
  if (val == null) return null
  if (val > 90) return { hex: '#0053D6', label: 'Muy alta' }
  if (val >= 70) return { hex: '#65CBF3', label: 'Alta' }
  if (val >= 50) return { hex: '#E7CB30', label: 'Moderada' }
  return { hex: '#FF7D45', label: 'Baja' }
}

function StructuralConfidence({ v }) {
  if (v.plddtMean == null && v.meanPae == null) return null
  const band = plddtBand(v.plddtMean)

  return (
    <Section title="Confianza estructural">
      <div className="flex flex-col gap-4">
        {v.plddtMean != null && band && (
          <div className="flex flex-1 items-center gap-1.5">
            <span className="h-5 w-1 rounded-sm shrink-0" style={{ backgroundColor: band.hex }} />
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] text-slate-400">pLDDT</span>
              <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-900">
                {num2Fmt.format(v.plddtMean)}
                <span className="ml-1 text-[9px] font-normal text-slate-400">{band.label}</span>
              </span>
            </div>
          </div>
        )}
        {v.meanPae != null && (
          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-[9px] text-slate-400">PAE medio</span>
            <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-800">
              {num2Fmt.format(v.meanPae)}
              <span className="ml-0.5 text-[9px] font-normal text-slate-400">Å</span>
            </span>
          </div>
        )}
      </div>
    </Section>
  )
}

/* ─────────────── 5. PAE Heatmap ─────────────── */

function PaeHeatmapSection({ v }) {
  if (!v.paeMatrix || v.paeMatrix.length === 0) return null

  return (
    <Section title="Mapa de error PAE">
      <PaeHeatmap paeMatrix={v.paeMatrix} meanPae={v.meanPae} compact />
    </Section>
  )
}

/* ─────────────── 6. Viabilidad biológica ─────────────── */

function BioViability({ v }) {
  const hasMetrics = v.solubilityScore != null || v.instabilityIndex != null
  const hasAlerts = v.toxicityAlerts.length > 0 || v.allergenicityAlerts.length > 0

  if (!hasMetrics && !hasAlerts) return null

  const solTone =
    v.solubilityScore == null ? 'text-slate-700'
    : v.solubilityScore > 50 ? 'text-emerald-700'
    : v.solubilityScore < 30 ? 'text-rose-700'
    : 'text-amber-700'

  const stabTone =
    v.instabilityIndex == null ? 'text-slate-700'
    : v.instabilityIndex < 40 ? 'text-emerald-700'
    : 'text-rose-700'

  return (
    <Section title="Viabilidad biológica">
      {hasMetrics && (
        <dl className="flex flex-col divide-y divide-slate-100 border-y border-slate-100">
          {v.solubilityScore != null && (
            <Cell
              label="Solubilidad"
              value={num2Fmt.format(v.solubilityScore)}
              unit="/100"
              sub={v.solubilityLabel ?? null}
              tone={solTone}
            />
          )}
          {v.instabilityIndex != null && (
            <Cell
              label="Inestabilidad"
              value={num2Fmt.format(v.instabilityIndex)}
              unit="II"
              sub={v.instabilityLabel ?? null}
              tone={stabTone}
            />
          )}
        </dl>
      )}
      <div className="mt-1.5 flex flex-col gap-0.5">
        <AlertRow label="Toxicidad" alerts={v.toxicityAlerts} />
        <AlertRow label="Alergenicidad" alerts={v.allergenicityAlerts} />
      </div>
    </Section>
  )
}

function AlertRow({ label, alerts }) {
  const hasAlerts = Array.isArray(alerts) && alerts.length > 0

  if (!hasAlerts) {
    return (
      <div className="flex items-baseline justify-between py-0.5">
        <span className="text-[11px] text-slate-600">{label}</span>
        <span className="font-mono text-[10px] text-emerald-700">sin alertas</span>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <span className="flex items-center gap-1 text-[11px] text-slate-600">
        <TriangleAlert className="h-3 w-3 text-amber-600" strokeWidth={2} />
        {label}
      </span>
      <div className="flex flex-wrap justify-end gap-1">
        {alerts.map((alert, i) => (
          <span
            key={i}
            className="inline-flex rounded border border-amber-300 bg-amber-50/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
          >
            {alert}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────── 6. Estructuras experimentales ─────────────── */

function KnownStructures({ v }) {
  if (v.knownStructures.length === 0) return null

  return (
    <Section
      title="Estructuras experimentales"
      aside={`${v.knownStructures.length} ${v.knownStructures.length === 1 ? 'entrada' : 'entradas'}`}
    >
      <ul className="flex flex-col divide-y divide-slate-100">
        {v.knownStructures.map((s, i) => (
          <li key={`${s?.pdb_id ?? i}`} className="flex flex-col gap-0.5 py-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                {s?.pdb_id ? (
                  <a
                    href={`https://www.rcsb.org/structure/${s.pdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    {s.pdb_id}
                  </a>
                ) : (
                  <span className="font-mono text-[11px] text-slate-400">—</span>
                )}
                {s?.method && <span className="text-[10px] text-slate-500">{s.method}</span>}
              </div>
              {s?.resolution != null && (
                <span className="font-mono text-[10px] tabular-nums text-slate-600">
                  {num2Fmt.format(s.resolution)} Å
                </span>
              )}
            </div>
            {s?.publication && (
              <a
                href={pubmedUrl(s.publication)}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[10px] text-slate-500 hover:text-slate-800 hover:underline"
                title={s.publication}
              >
                {s.publication}
              </a>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─────────────── 7. Secuencia + estructura química ─────────────── */

function SequenceSection({ v }) {
  const sequence = (v.sequence ?? '').replace(/\s+/g, '').toUpperCase()
  const [showChem, setShowChem] = useState(false)

  if (!sequence) return null

  const blockSize = 10
  const blocksPerRow = 6
  const rowSize = blockSize * blocksPerRow
  const rows = []
  for (let i = 0; i < sequence.length; i += rowSize) {
    const chunk = sequence.slice(i, i + rowSize)
    const blocks = []
    for (let j = 0; j < chunk.length; j += blockSize) {
      blocks.push(chunk.slice(j, j + blockSize))
    }
    rows.push({ start: i + 1, blocks })
  }

  const handleDownload = () => {
    const content =
      v.fastaReady ??
      `>${v.name ?? 'protein'}\n${sequence.replace(/(.{60})/g, '$1\n')}\n`
    downloadBlob(content, `${safeFilename(v.name)}.fasta`, 'text/plain')
  }

  return (
    <Section title="Secuencia" aside={`${intFmt.format(sequence.length)} aa`}>
      <div className="minimal-scrollbar max-h-32 overflow-y-auto rounded border border-slate-200 bg-slate-50/40 p-2 font-mono text-[10px] leading-[1.6] text-slate-700">
        {rows.map((row) => (
          <div key={row.start} className="flex gap-2 whitespace-nowrap">
            <span className="w-10 shrink-0 text-right tabular-nums text-slate-400">
              {row.start}
            </span>
            <span>
              {row.blocks.map((b, idx) => (
                <span key={idx} className="mr-2">{b}</span>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setShowChem((x) => !x)}
          className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          <FlaskConical className="h-3 w-3" strokeWidth={2} />
          {showChem ? 'Ocultar estructura química' : 'Ver estructura química'}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          <Download className="h-3 w-3" strokeWidth={2} />
          FASTA
        </button>
      </div>

      {showChem && <ChemicalBackbone sequence={sequence} />}
    </Section>
  )
}

/* ─────────────── 8. Visor de backbone peptídico (SVG) ─────────────── */

const RES_WIDTH = 92
const CHAIN_HEIGHT = 116
const MAX_RENDERED_RESIDUES = 600

function ChemicalBackbone({ sequence }) {
  const residues = sequence.slice(0, MAX_RENDERED_RESIDUES)
  const width = residues.length * RES_WIDTH + 60
  const y = 62

  return (
    <div className="mt-2 overflow-hidden rounded border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500">
        <span>
          Esqueleto peptídico — {intFmt.format(residues.length)}{' '}
          {residues.length === 1 ? 'residuo' : 'residuos'}
          {residues.length < sequence.length && (
            <span className="ml-1 text-slate-400">
              (de {intFmt.format(sequence.length)}, truncado)
            </span>
          )}
        </span>
      </div>

      <div className="minimal-scrollbar overflow-x-auto">
        <svg
          width={width}
          height={CHAIN_HEIGHT}
          viewBox={`0 0 ${width} ${CHAIN_HEIGHT}`}
          className="block"
        >
          {residues.split('').map((letter, i) => {
            const baseX = 30 + i * RES_WIDTH
            const xN = baseX
            const xCA = baseX + 30
            const xC = baseX + 60
            const isFirst = i === 0
            const isLast = i === residues.length - 1

            return (
              <g key={i}>
                {isFirst && (
                  <text x={xN - 18} y={y + 3} fontSize="10" fill="#475569" fontFamily="ui-monospace, monospace">H₂N</text>
                )}
                <circle cx={xN} cy={y} r="7" fill="#dbeafe" stroke="#1e40af" strokeWidth="1" />
                <text x={xN} y={y + 3} fontSize="8" textAnchor="middle" fill="#1e40af" fontFamily="ui-monospace, monospace">N</text>
                {!isFirst && (
                  <text x={xN} y={y - 11} fontSize="7" textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">H</text>
                )}
                <line x1={xN + 7} y1={y} x2={xCA - 9} y2={y} stroke="#475569" strokeWidth="1.5" />
                <text x={xCA} y={y - 30} fontSize="8" textAnchor="middle" fill="#94a3b8" fontFamily="ui-monospace, monospace">{i + 1}</text>
                <text x={xCA} y={y - 18} fontSize="12" textAnchor="middle" fill="#0f172a" fontWeight="700" fontFamily="ui-monospace, monospace">{letter}</text>
                <circle cx={xCA} cy={y} r="9" fill="#f1f5f9" stroke="#334155" strokeWidth="1.5" />
                <text x={xCA} y={y + 3} fontSize="8" textAnchor="middle" fill="#0f172a" fontFamily="ui-monospace, monospace">Cα</text>
                <line x1={xCA} y1={y + 9} x2={xCA} y2={y + 22} stroke="#94a3b8" strokeWidth="1" />
                <text x={xCA} y={y + 33} fontSize="8" textAnchor="middle" fill="#94a3b8" fontFamily="ui-monospace, monospace">R</text>
                <line x1={xCA + 9} y1={y} x2={xC - 7} y2={y} stroke="#475569" strokeWidth="1.5" />
                <circle cx={xC} cy={y} r="7" fill="#fee2e2" stroke="#b91c1c" strokeWidth="1" />
                <text x={xC} y={y + 3} fontSize="8" textAnchor="middle" fill="#b91c1c" fontFamily="ui-monospace, monospace">C</text>
                <line x1={xC - 2} y1={y - 7} x2={xC - 2} y2={y - 18} stroke="#b91c1c" strokeWidth="1.3" />
                <line x1={xC + 2} y1={y - 7} x2={xC + 2} y2={y - 18} stroke="#b91c1c" strokeWidth="1.3" />
                <text x={xC} y={y - 22} fontSize="8" textAnchor="middle" fill="#b91c1c" fontFamily="ui-monospace, monospace">O</text>
                {!isLast && (
                  <line x1={xC + 7} y1={y} x2={xC + RES_WIDTH - 30 - 7} y2={y} stroke="#f59e0b" strokeWidth="2.5" />
                )}
                {isLast && (
                  <>
                    <line x1={xC + 7} y1={y} x2={xC + 20} y2={y} stroke="#475569" strokeWidth="1.5" />
                    <text x={xC + 24} y={y + 3} fontSize="10" fill="#475569" fontFamily="ui-monospace, monospace">OH</text>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 px-2 py-1 font-mono text-[9px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-amber-500" />
          enlace peptídico
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border border-blue-800 bg-blue-100" />
          N
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-slate-600 bg-slate-100" />
          Cα
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border border-red-800 bg-red-100" />
          C=O
        </span>
        <span className="ml-auto text-slate-400">R = cadena lateral</span>
      </div>
    </div>
  )
}

/* ─────────────── Barra de acciones (descarga) ─────────────── */

function ActionBar({ protein }) {
  const pdbFile = protein?._raw?.structural_data?.pdb_file ?? protein?.pdbData
  const logs = protein?._raw?.logs ?? protein?.logs ?? ''
  const hasPdb = !!pdbFile
  const hasLogs = !!logs
  const [showLogs, setShowLogs] = useState(false)

  const handleDownloadPdb = () => {
    if (!pdbFile) return
    const name =
      protein?._raw?.protein_metadata?.protein_name ?? protein?.name ?? 'protein'
    downloadBlob(pdbFile, `${safeFilename(name)}.pdb`, 'chemical/x-pdb')
  }

  return (
    <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasPdb}
          onClick={handleDownloadPdb}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
        >
          <Download className="h-3 w-3" strokeWidth={2.5} />
          Descargar PDB
        </button>
        <button
          type="button"
          disabled={!hasLogs}
          onClick={() => setShowLogs((x) => !x)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-50 hover:border-slate-300 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
        >
          <Terminal className="h-3 w-3" strokeWidth={2.5} />
          {showLogs ? 'Ocultar logs' : 'Ver logs'}
        </button>
      </div>

      {showLogs && hasLogs && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-900 p-3 max-h-40 overflow-y-auto">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="h-3 w-3 text-slate-500" strokeWidth={2} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Logs HPC
            </span>
          </div>
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-emerald-400 font-mono">
            {logs}
          </pre>
        </div>
      )}
    </div>
  )
}

/* ─────────────── Componente principal ─────────────── */

export function DrawerBody({ protein }) {
  const v = normalizeProtein(protein)
  if (!v) return null

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="minimal-scrollbar flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-100 px-5 pb-4">
          <IdentityPanel v={v} />
          <FunctionSection v={v} />
          <PhysicalProps v={v} />
          <StructuralConfidence v={v} />
          <PaeHeatmapSection v={v} />
          <BioViability v={v} />
          <KnownStructures v={v} />
          <SequenceSection v={v} />
        </div>
      </div>
      <ActionBar protein={protein} />
    </div>
  )
}
