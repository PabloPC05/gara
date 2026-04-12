import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { captureViewerImage, capturePlotlyImage } from './exportImage'

const COLORS = {
  primary: [0, 83, 214],
  dark: [15, 23, 42],
  muted: [100, 116, 139],
  border: [203, 213, 225],
  bg: [248, 250, 252],
  white: [255, 255, 255],
}

function drawHeader(doc, name) {
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('CAMELIA — BioHack', 14, 13)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Reporte de Analisis Estructural`, 14, 20)
  doc.setFontSize(8)
  doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), 190, 20, { align: 'right' })
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(name || 'Proteina sin identificar', 14, 38)
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(14, 42, 196, 42)
}

function addViewerImage(doc, imageDataUrl, y) {
  if (!imageDataUrl) return y
  const imgWidth = 182
  const imgHeight = 120
  doc.addImage(imageDataUrl, 'PNG', 14, y, imgWidth, imgHeight)
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.muted)
  doc.text('Vista del visor 3D', 14, y + imgHeight + 4)
  return y + imgHeight + 10
}

function addIdentitySection(doc, v, y) {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('Identidad', 14, y)
  y += 5

  doc.autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 7 },
    body: [
      ['Nombre', v.name || '—'],
      ['Organismo', v.organism || '—'],
      ['Longitud', v.length ? `${v.length} aa` : '—'],
      ['UniProt ID', v.uniprotId || '—'],
      ['PDB ID', v.pdbId || '—'],
      ['Fuente', v.dataSource || '—'],
    ],
    theme: 'grid',
    tableLineColor: COLORS.border,
    tableLineWidth: 0.1,
  })

  return doc.lastAutoTable.finalY + 6
}

function addMetricsSection(doc, v, y) {
  if (v.plddtMean == null && v.meanPae == null && v.mwDa == null) return y

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('Metricas Estructurales', 14, y)
  y += 5

  const rows = []
  if (v.plddtMean != null) rows.push(['pLDDT Medio', `${v.plddtMean.toFixed(2)}`])
  if (v.meanPae != null) rows.push(['PAE Medio', `${v.meanPae.toFixed(2)} A`])
  if (v.mwDa != null) rows.push(['Peso Molecular', `${(v.mwDa / 1000).toFixed(2)} kDa (${Math.round(v.mwDa)} Da)`])
  if (v.isoelectricPoint != null) rows.push(['Punto Isoelectrico', `${v.isoelectricPoint.toFixed(2)}`])
  if (v.solubilityScore != null) rows.push(['Solubilidad', `${v.solubilityScore}/100 (${v.solubilityLabel || ''})`])
  if (v.instabilityIndex != null) rows.push(['Indice de Inestabilidad', `${v.instabilityIndex.toFixed(2)} (${v.instabilityLabel || ''})`])
  if (v.positiveCharges != null) rows.push(['Cargas (+)', `${v.positiveCharges}`])
  if (v.negativeCharges != null) rows.push(['Cargas (-)', `${v.negativeCharges}`])

  doc.autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 7 },
    body: rows,
    theme: 'grid',
    tableLineColor: COLORS.border,
    tableLineWidth: 0.1,
  })

  return doc.lastAutoTable.finalY + 6
}

function addSequenceSection(doc, v, y) {
  const seq = (v.sequence ?? '').replace(/\s+/g, '').toUpperCase()
  if (!seq) return y

  if (y > 240) {
    doc.addPage()
    y = 20
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('Secuencia', 14, y)
  y += 5

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.dark)

  const lineW = 70
  for (let i = 0; i < seq.length; i += lineW) {
    if (y > 275) {
      doc.addPage()
      y = 20
    }
    doc.text(seq.slice(i, i + lineW), 14, y)
    y += 3.5
  }

  return y + 4
}

function addFooter(doc) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.muted)
    doc.text(`Pagina ${i} de ${pageCount}`, 190, 290, { align: 'right' })
    doc.text('Generado por CAMELIA BioHack', 14, 290)
  }
}

/**
 * Genera y descarga un PDF con el reporte completo de analisis.
 * @param {object} protein - Proteina del store (UnifiedProtein).
 * @param {import('molstar/lib/mol-plugin/context').PluginContext|null} plugin - Plugin Mol* para capturar imagen.
 * @param {object} [options]
 * @param {boolean} [options.includeImage=true]
 * @param {boolean} [options.includePaeHeatmap=true]
 * @param {HTMLElement|null} [options.plotlyContainer=null]
 */
export async function exportProteinPdf(protein, plugin, options = {}) {
  const {
    includeImage = true,
    includePaeHeatmap = true,
    plotlyContainer = null,
  } = options

  const raw = protein?._raw ?? {}
  const meta = raw.protein_metadata ?? {}
  const conf = raw.structural_data?.confidence ?? {}
  const bioRaw = raw.biological_data ?? {}
  const seqProps = raw.sequence_properties ?? raw.biological_data?.sequence_properties ?? {}
  const bioUnified = protein?.biological ?? null

  const v = {
    name: protein?.name ?? meta.protein_name ?? 'Proteina',
    organism: protein?.organism ?? meta.organism,
    length: protein?.length ?? seqProps.length,
    uniprotId: protein?.uniprotId ?? meta.uniprot_id,
    pdbId: protein?.pdbId ?? meta.pdb_id,
    dataSource: meta.data_source,
    description: meta.description ?? protein?.description,
    plddtMean: protein?.plddtMean ?? conf.plddt_mean,
    meanPae: protein?.meanPae ?? conf.mean_pae,
    mwDa: bioUnified?.molecularWeight ?? (seqProps.molecular_weight_kda ? seqProps.molecular_weight_kda * 1000 : null),
    isoelectricPoint: bioUnified?.isoelectricPoint,
    positiveCharges: bioUnified?.positiveCharges ?? seqProps.positive_charges,
    negativeCharges: bioUnified?.negativeCharges ?? seqProps.negative_charges,
    solubilityScore: bioUnified?.solubility ?? bioRaw.solubility_score,
    solubilityLabel: bioUnified?.solubilityLabel ?? bioRaw.solubility_prediction,
    instabilityIndex: bioUnified?.instabilityIndex ?? bioRaw.instability_index,
    instabilityLabel: bioUnified?.instabilityLabel ?? bioRaw.stability_status,
    sequence: protein?.sequence,
  }

  let viewerImage = null
  let heatmapImage = null

  if (includeImage && plugin?.canvas3d) {
    try {
      const { captureViewerImage } = await import('./exportImage')
      viewerImage = await captureViewerImage(plugin, { format: 'png', scale: 2 })
    } catch (e) {
      console.warn('[PDF] No se pudo capturar imagen del visor:', e)
    }
  }

  if (includePaeHeatmap && plotlyContainer && typeof window.Plotly !== 'undefined') {
    try {
      heatmapImage = await capturePlotlyImage(plotlyContainer)
    } catch (e) {
      console.warn('[PDF] No se pudo capturar heatmap PAE:', e)
    }
  }

  const doc = new jsPDF('p', 'mm', 'a4')

  drawHeader(doc, v.name)

  let y = 48

  if (viewerImage) {
    y = addViewerImage(doc, viewerImage, y)
  }

  if (y > 240) { doc.addPage(); y = 20 }

  y = addIdentitySection(doc, v, y)

  if (y > 220) { doc.addPage(); y = 20 }

  y = addMetricsSection(doc, v, y)

  if (heatmapImage) {
    if (y > 170) { doc.addPage(); y = 20 }
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text('Mapa de Error PAE', 14, y)
    y += 3
    const hmSize = Math.min(120, 290 - y - 10)
    doc.addImage(heatmapImage, 'PNG', 14, y, hmSize, hmSize)
    y += hmSize + 8
  }

  y = addSequenceSection(doc, v, y)

  addFooter(doc)

  const safeName = (v.name || 'protein').replace(/[^a-z0-9_-]+/gi, '_').toLowerCase()
  doc.save(`${safeName}_report.pdf`)
}
