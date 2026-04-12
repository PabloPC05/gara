import { useState } from 'react'
import {
  TriangleAlert, BookOpen, Database, Download, ExternalLink,
  FileText, FlaskConical, Link2, Terminal,
} from 'lucide-react'
import PaeHeatmap from '@/components/PaeHeatmap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ExportDriveButton from '../ExportDriveButton'
import { normalizeProtein } from './normalizeProtein'
import { intFmt, num2Fmt, num3Fmt, safeFilename, downloadBlob, pubmedUrl } from './formatters'

/* ── Layout primitives ── */

function Section({ title, aside, children }) {
  return (
    <section style={{ maxWidth: '100%', overflow: 'hidden', paddingTop: 16, paddingBottom: 16 }}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</h3>
        {aside && <span className="font-mono text-[9px] tabular-nums text-slate-400">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Cell({ label, value, unit, sub, tone }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 overflow-hidden">
      <dt className="text-[9px] font-medium uppercase tracking-wider text-slate-400 leading-none">{label}</dt>
      <dd className={`font-mono text-[11px] font-semibold tabular-nums leading-tight ${tone || 'text-slate-800'} truncate`}>
        {value}
        {unit && <span className="ml-0.5 text-[9px] font-normal text-slate-400">{unit}</span>}
        {sub && <span className="ml-1 text-[9px] font-normal text-slate-400 normal-case">{sub}</span>}
      </dd>
    </div>
  )
}

function ProseField({ label, children }) {
  return (
    <div className="overflow-hidden">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-[11px] leading-snug text-slate-700 break-words">{children}</dd>
    </div>
  )
}

/* ── 1. Identity ── */

function IdentityPanel({ v }) {
  const links = [
    v.uniprotId && { label: 'UniProt', href: `https://www.uniprot.org/uniprot/${v.uniprotId}`, icon: Database },
    v.pdbId && { label: 'RCSB', href: `https://www.rcsb.org/structure/${v.pdbId}`, icon: Link2 },
    v.uniprotId && { label: 'AlphaFold', href: `https://alphafold.ebi.ac.uk/entry/${v.uniprotId}`, icon: ExternalLink },
    v.name && { label: 'PubMed', href: pubmedUrl(`${v.name} structure`), icon: BookOpen },
  ].filter(Boolean)

  return (
    <header style={{ maxWidth: '100%', overflow: 'hidden', paddingTop: 24, paddingBottom: 12 }}>
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ficha proteína</span>
      <h2 className="mt-0.5 text-base font-bold leading-tight tracking-tight text-slate-900 truncate">{v.name ?? 'Proteína sin identificar'}</h2>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500">
        {v.organism && <span className="italic">{v.organism}</span>}
        {v.organism && v.length != null && <span className="text-slate-300">·</span>}
        {v.length != null && <span className="font-mono tabular-nums">{intFmt.format(v.length)} aa</span>}
        {v.dataSource && <><span className="text-slate-300">·</span><span className="text-slate-400">{v.dataSource}</span></>}
      </div>
      {v.description && <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">{v.description}</p>}
      {v.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {v.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-none border border-slate-200 bg-slate-50/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 font-sans">{tag}</Badge>
          ))}
        </div>
      )}
      {(v.proteinId || v.uniprotId || v.pdbId || v.modelType || v.jobId) && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[9px] text-slate-400">
          {v.proteinId && <span>id <span className="text-slate-600">{v.proteinId}</span></span>}
          {v.uniprotId && <span>uniprot <span className="text-slate-600">{v.uniprotId}</span></span>}
          {v.pdbId && <span>pdb <span className="text-slate-600">{v.pdbId}</span></span>}
          {v.modelType && <span>model <span className="text-slate-600">{v.modelType}</span></span>}
          {v.jobId && <span title={v.jobId}>job <span className="text-slate-600">{v.jobId.slice(0, 12)}{v.jobId.length > 12 ? '…' : ''}</span></span>}
        </div>
      )}
      {links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {links.map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-none border border-slate-200 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-900">
              <Icon className="h-2.5 w-2.5" strokeWidth={2} />{label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}

/* ── 2. Function ── */

function FunctionSection({ v }) {
  if (!v.function && !v.cellularLocation && !v.activity) return null
  return (
    <Section title="Función biológica">
      <dl className="flex flex-col gap-1.5">
        {v.function && <ProseField label="Función">{v.function}</ProseField>}
        {v.cellularLocation && <ProseField label="Localización celular">{v.cellularLocation}</ProseField>}
        {v.activity && <ProseField label="Actividad">{v.activity}</ProseField>}
      </dl>
    </Section>
  )
}

/* ── 3. Physical properties ── */

function PhysicalProps({ v }) {
  const mwKda = v.mwDa != null ? v.mwDa / 1000 : null
  const avgRes = v.length > 0 && v.mwDa != null ? v.mwDa / v.length : null
  const pI = v.isoelectricPoint
  const pINote = pI == null ? null : pI > 7.4 ? 'básica' : pI < 6.6 ? 'ácida' : 'neutra'
  const pITone = pI == null ? null : pI > 7.4 ? 'text-blue-700' : pI < 6.6 ? 'text-rose-700' : 'text-slate-800'
  const net = v.positiveCharges != null && v.negativeCharges != null ? v.positiveCharges - v.negativeCharges : null
  const netTone = net == null ? 'text-slate-800' : net > 0 ? 'text-blue-700' : net < 0 ? 'text-rose-700' : 'text-slate-800'
  const hasAny = v.length != null || mwKda != null || pI != null || v.positiveCharges != null || v.negativeCharges != null || v.cysteines != null || v.halfLife != null || v.extinctionCoefficient != null
  if (!hasAny) return null

  return (
    <Section title="Propiedades físico-químicas">
      <dl className="flex flex-col divide-y divide-slate-100 border-y border-slate-100">
        {v.length != null && <Cell label="Longitud" value={intFmt.format(v.length)} unit="aa" />}
        {mwKda != null && <Cell label="Peso molecular" value={num2Fmt.format(mwKda)} unit="kDa" sub={`${intFmt.format(Math.round(v.mwDa))} Da`} />}
        {avgRes != null && <Cell label="Masa/residuo" value={num2Fmt.format(avgRes)} unit="Da/aa" />}
        {pI != null && <Cell label="Punto isoel." value={num2Fmt.format(pI)} unit="pI" sub={pINote} tone={pITone} />}
        {v.positiveCharges != null && <Cell label="Cargas (+)" value={intFmt.format(v.positiveCharges)} sub="Lys+Arg" tone="text-blue-700" />}
        {v.negativeCharges != null && <Cell label="Cargas (−)" value={intFmt.format(v.negativeCharges)} sub="Asp+Glu" tone="text-rose-700" />}
        {net != null && <Cell label="Carga neta" value={`${net > 0 ? '+' : ''}${net}`} unit="e⁻" sub={v.length > 0 ? `${num3Fmt.format(net / v.length)} e⁻/aa` : null} tone={netTone} />}
        {v.cysteines != null && <Cell label="Cisteínas" value={intFmt.format(v.cysteines)} sub={Math.floor(v.cysteines / 2) > 0 ? `máx. ${Math.floor(v.cysteines / 2)} S–S` : null} />}
        {v.halfLife && <Cell label="Vida media" value={v.halfLife} />}
        {v.extinctionCoefficient != null && <Cell label="ε₂₈₀" value={intFmt.format(v.extinctionCoefficient)} unit="M⁻¹·cm⁻¹" />}
      </dl>
    </Section>
  )
}

/* ── 4. Structural confidence ── */

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
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-1 shrink-0" style={{ backgroundColor: band.hex }} />
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] text-slate-400">pLDDT</span>
              <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-900">
                {num2Fmt.format(v.plddtMean)}<span className="ml-1 text-[9px] font-normal text-slate-400">{band.label}</span>
              </span>
            </div>
          </div>
        )}
        {v.meanPae != null && (
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] text-slate-400">PAE medio</span>
            <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-800">
              {num2Fmt.format(v.meanPae)}<span className="ml-0.5 text-[9px] font-normal text-slate-400">Å</span>
            </span>
          </div>
        )}
      </div>
    </Section>
  )
}

/* ── 5. PAE Heatmap ── */

function PaeHeatmapSection({ v }) {
  if (!v.paeMatrix || v.paeMatrix.length === 0) return null
  return (
    <Section title="Mapa de error PAE">
      <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <PaeHeatmap paeMatrix={v.paeMatrix} meanPae={v.meanPae} compact />
      </div>
    </Section>
  )
}

/* ── 6. Bio viability ── */

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
    <div style={{ maxWidth: '100%', overflow: 'hidden' }} className="flex flex-col gap-1 py-0.5">
      <span className="flex items-center gap-1 text-[11px] text-slate-600">
        <TriangleAlert className="h-3 w-3 shrink-0 text-amber-600" strokeWidth={2} />{label}
      </span>
      <div style={{ maxWidth: '100%', overflow: 'hidden' }} className="flex flex-wrap gap-1">
        {alerts.map((alert, i) => (
          <Badge key={i} variant="outline" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }} className="rounded-none border-amber-300 bg-amber-50/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 font-sans">{alert}</Badge>
        ))}
      </div>
    </div>
  )
}

function BioViability({ v }) {
  const hasMetrics = v.solubilityScore != null || v.instabilityIndex != null
  const hasAlerts = v.toxicityAlerts.length > 0 || v.allergenicityAlerts.length > 0
  if (!hasMetrics && !hasAlerts) return null
  const solTone = v.solubilityScore == null ? 'text-slate-700' : v.solubilityScore > 50 ? 'text-emerald-700' : v.solubilityScore < 30 ? 'text-rose-700' : 'text-amber-700'
  const stabTone = v.instabilityIndex == null ? 'text-slate-700' : v.instabilityIndex < 40 ? 'text-emerald-700' : 'text-rose-700'

  return (
    <Section title="Viabilidad biológica">
      {hasMetrics && (
        <dl className="flex flex-col divide-y divide-slate-100 border-y border-slate-100">
          {v.solubilityScore != null && <Cell label="Solubilidad" value={num2Fmt.format(v.solubilityScore)} unit="/100" sub={v.solubilityLabel ?? null} tone={solTone} />}
          {v.instabilityIndex != null && <Cell label="Inestabilidad" value={num2Fmt.format(v.instabilityIndex)} unit="II" sub={v.instabilityLabel ?? null} tone={stabTone} />}
        </dl>
      )}
      <div className="mt-1.5 flex flex-col gap-0.5">
        <AlertRow label="Toxicidad" alerts={v.toxicityAlerts} />
        <AlertRow label="Alergenicidad" alerts={v.allergenicityAlerts} />
      </div>
    </Section>
  )
}

/* ── 7. Known structures ── */

function KnownStructures({ v }) {
  if (v.knownStructures.length === 0) return null
  return (
    <Section title="Estructuras experimentales" aside={`${v.knownStructures.length} ${v.knownStructures.length === 1 ? 'entrada' : 'entradas'}`}>
      <ul className="flex flex-col divide-y divide-slate-100">
        {v.knownStructures.map((s, i) => (
          <li key={`${s?.pdb_id ?? i}`} className="flex flex-col gap-0.5 py-1 overflow-hidden">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                {s?.pdb_id ? <a href={`https://www.rcsb.org/structure/${s.pdb_id}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] font-semibold text-blue-700 hover:underline">{s.pdb_id}</a> : <span className="font-mono text-[11px] text-slate-400">—</span>}
                {s?.method && <span className="text-[10px] text-slate-500">{s.method}</span>}
              </div>
              {s?.resolution != null && <span className="font-mono text-[10px] tabular-nums text-slate-600 shrink-0">{num2Fmt.format(s.resolution)} Å</span>}
            </div>
            {s?.publication && <a href={pubmedUrl(s.publication)} target="_blank" rel="noopener noreferrer" className="truncate text-[10px] text-slate-500 hover:text-slate-800 hover:underline" title={s.publication}>{s.publication}</a>}
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ── 8. Sequence ── */

function SequenceSection({ v }) {
  const sequence = (v.sequence ?? '').replace(/\s+/g, '').toUpperCase()
  const [showChem, setShowChem] = useState(false)
  if (!sequence) return null

  const blockSize = 10
  const blocksPerRow = 5
  const rowSize = blockSize * blocksPerRow
  const rows = []
  for (let i = 0; i < sequence.length; i += rowSize) {
    const chunk = sequence.slice(i, i + rowSize)
    const blocks = []
    for (let j = 0; j < chunk.length; j += blockSize) blocks.push(chunk.slice(j, j + blockSize))
    rows.push({ start: i + 1, blocks })
  }

  const handleDownload = () => {
    const content = v.fastaReady ?? `>${v.name ?? 'protein'}\n${sequence.replace(/(.{60})/g, '$1\n')}\n`
    downloadBlob(content, `${safeFilename(v.name)}.fasta`, 'text/plain')
  }

  return (
    <Section title="Secuencia" aside={`${intFmt.format(sequence.length)} aa`}>
      <div style={{ maxWidth: '100%', overflow: 'hidden', overflowY: 'auto', height: 128 }} className="w-full border border-slate-200 bg-slate-50/40 p-2 font-mono text-[10px] leading-[1.6] text-slate-700">
        {rows.map((row) => (
          <div key={row.start} className="flex gap-2">
            <span className="w-8 shrink-0 text-right tabular-nums text-slate-400">{row.start}</span>
            <span className="break-all">{row.blocks.join(' ')}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => setShowChem((x) => !x)} className="h-6 rounded-none border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900">
          <FlaskConical className="h-3 w-3 mr-1" strokeWidth={2} />{showChem ? 'Ocultar estructura química' : 'Ver estructura química'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="h-6 rounded-none border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900">
          <Download className="h-3 w-3 mr-1" strokeWidth={2} />Descargar FASTA
        </Button>
      </div>
      {showChem && <div className="mt-2 overflow-x-auto border border-slate-200 bg-white"><ChemicalBackbone sequence={sequence} /></div>}
    </Section>
  )
}

/* ── 8b. Chemical backbone SVG ── */

const RES_WIDTH = 92
const CHAIN_HEIGHT = 116
const MAX_RENDERED = 600

function ChemicalBackbone({ sequence }) {
  const residues = sequence.slice(0, MAX_RENDERED)
  const width = residues.length * RES_WIDTH + 60
  const y = 62
  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500">
        <span>Esqueleto peptídico — {intFmt.format(residues.length)} {residues.length === 1 ? 'residuo' : 'residuos'}{residues.length < sequence.length && <span className="ml-1 text-slate-400">(de {intFmt.format(sequence.length)}, truncado)</span>}</span>
      </div>
      <div className="overflow-x-auto">
        <svg width={width} height={CHAIN_HEIGHT} viewBox={`0 0 ${width} ${CHAIN_HEIGHT}`} className="block">
          {residues.split('').map((letter, i) => {
            const baseX = 30 + i * RES_WIDTH, xN = baseX, xCA = baseX + 30, xC = baseX + 60
            const isFirst = i === 0, isLast = i === residues.length - 1
            return (
              <g key={i}>
                {isFirst && <text x={xN - 18} y={y + 3} fontSize="10" fill="#475569" fontFamily="ui-monospace, monospace">H₂N</text>}
                <circle cx={xN} cy={y} r="7" fill="#dbeafe" stroke="#1e40af" strokeWidth="1" />
                <text x={xN} y={y + 3} fontSize="8" textAnchor="middle" fill="#1e40af" fontFamily="ui-monospace, monospace">N</text>
                {!isFirst && <text x={xN} y={y - 11} fontSize="7" textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">H</text>}
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
                {!isLast && <line x1={xC + 7} y1={y} x2={xC + RES_WIDTH - 30 - 7} y2={y} stroke="#f59e0b" strokeWidth="2.5" />}
                {isLast && <><line x1={xC + 7} y1={y} x2={xC + 20} y2={y} stroke="#475569" strokeWidth="1.5" /><text x={xC + 24} y={y + 3} fontSize="10" fill="#475569" fontFamily="ui-monospace, monospace">OH</text></>}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 px-2 py-1 font-mono text-[9px] text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-amber-500" />enlace peptídico</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 border border-blue-800 bg-blue-100" />N</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 border border-slate-600 bg-slate-100" />Cα</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 border border-red-800 bg-red-100" />C=O</span>
        <span className="ml-auto text-slate-400">R = cadena lateral</span>
      </div>
    </>
  )
}

/* ── 9. Action bar ── */

function ActionBar({ protein, v }) {
  const hasPdb = !!v.pdbFile
  const hasLogs = !!v.logs
  const [showLogs, setShowLogs] = useState(false)

  return (
    <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3 space-y-2 overflow-hidden">
      <ExportDriveButton
        proteinData={protein}
        summary={`Análisis: ${protein.name}\nOrganismo: ${protein.organism || 'N/A'}\nLongitud: ${protein.length} aa`}
        paeData={protein?._raw?.structural_data?.confidence?.pae_matrix}
        metrics={{ 'Proteína': protein.name, 'Organismo': protein.organism, 'Longitud (aa)': protein.length, 'pLDDT Medio': protein.plddtMean, 'PAE Medio': protein.meanPae, 'ID UniProt': protein.uniprotId, 'ID PDB': protein.pdbId }}
      />
      <div className="flex gap-2">
        <Button variant="default" disabled={!hasPdb} onClick={() => downloadBlob(v.pdbFile, `${safeFilename(v.name)}.pdb`, 'chemical/x-pdb')} className="flex-1 rounded-none bg-blue-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-blue-700 h-9 shadow-lg shadow-blue-200/60">
          <Download className="h-3 w-3 mr-1.5" strokeWidth={2.5} />Descargar PDB
        </Button>
        <Button variant="outline" disabled={!hasLogs} onClick={() => setShowLogs((x) => !x)} className="flex-1 rounded-none border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 h-9 shadow-sm">
          <Terminal className="h-3 w-3 mr-1.5" strokeWidth={2.5} />{showLogs ? 'Ocultar logs' : 'Ver logs'}
        </Button>
      </div>
      {showLogs && hasLogs && (
        <div className="mt-2 border border-slate-200 bg-slate-900 p-3 max-h-40 overflow-y-auto">
          <div className="flex items-center gap-1.5 mb-1.5"><FileText className="h-3 w-3 text-slate-500" strokeWidth={2} /><span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Logs HPC</span></div>
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-emerald-400 font-mono">{v.logs}</pre>
        </div>
      )}
    </div>
  )
}

/* ── MAIN COMPONENT ── */

export function DrawerBody({ protein }) {
  const v = normalizeProtein(protein)
  if (!v) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minWidth: 0, overflow: 'hidden', background: 'white' }}>
      <div style={{ flex: '1 1 0%', minHeight: 0, minWidth: 0, width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '0 24px 16px 20px', width: '100%', minWidth: 0, boxSizing: 'border-box' }} className="divide-y divide-slate-100">
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
      <ActionBar protein={protein} v={v} />
    </div>
  )
}
