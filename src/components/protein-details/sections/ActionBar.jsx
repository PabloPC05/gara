import { useState } from 'react'
import { Download, FileText, Image, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ExportDriveButton from '../../ExportDriveButton'
import { safeFilename, downloadBlob } from '../formatters'
import { useMolstarStore } from '@/stores/useMolstarStore'
import { exportViewerImage } from '@/lib/exportImage'
import { exportProteinPdf } from '@/lib/exportPdf'

export function ActionBar({ protein, v }) {
  const hasPdb = !!v.pdbFile
  const hasLogs = !!v.logs
  const [showLogs, setShowLogs] = useState(false)
  const pluginRef = useMolstarStore((s) => s.pluginRef)

  const handleExportImage = async () => {
    if (!pluginRef) return
    try {
      const dataUrl = await exportViewerImage(pluginRef, { scale: 2, format: 'png', transparent: false })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${safeFilename(v.name)}.png`
      a.click()
    } catch (e) {
      console.error('Export image failed:', e)
    }
  }

  const handleExportPdf = async () => {
    if (!pluginRef) return
    try {
      await exportProteinPdf(pluginRef, protein)
    } catch (e) {
      console.error('Export PDF failed:', e)
    }
  }

  return (
    <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3 space-y-2 overflow-hidden min-w-0">
      <ExportDriveButton
        proteinData={protein}
        summary={`Análisis: ${protein.name}\nOrganismo: ${protein.organism || 'N/A'}\nLongitud: ${protein.length} aa`}
        paeData={protein?._raw?.structural_data?.confidence?.pae_matrix}
        metrics={{
          Proteína: protein.name,
          Organismo: protein.organism,
          'Longitud (aa)': protein.length,
          'pLDDT Medio': protein.plddtMean,
          'PAE Medio': protein.meanPae,
          'ID UniProt': protein.uniprotId,
          'ID PDB': protein.pdbId,
        }}
      />

      <div className="flex gap-2 min-w-0">
        <Button
          variant="default"
          disabled={!hasPdb}
          onClick={() => downloadBlob(v.pdbFile, `${safeFilename(v.name)}.pdb`, 'chemical/x-pdb')}
          className="flex-1 min-w-0 rounded-none bg-blue-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-blue-700 h-9 shadow-lg shadow-blue-200/60"
        >
          <Download className="h-3 w-3 mr-1.5 shrink-0" strokeWidth={2.5} />
          PDB
        </Button>
        <Button
          variant="outline"
          disabled={!pluginRef}
          onClick={handleExportImage}
          className="flex-1 min-w-0 rounded-none border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 h-9 shadow-sm"
        >
          <Image className="h-3 w-3 mr-1.5 shrink-0" strokeWidth={2.5} />
          PNG
        </Button>
        <Button
          variant="outline"
          disabled={!pluginRef}
          onClick={handleExportPdf}
          className="flex-1 min-w-0 rounded-none border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 h-9 shadow-sm"
        >
          <FileText className="h-3 w-3 mr-1.5 shrink-0" strokeWidth={2.5} />
          PDF
        </Button>
      </div>

      <Button
        variant="outline"
        disabled={!hasLogs}
        onClick={() => setShowLogs((x) => !x)}
        className="w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 h-9 shadow-sm"
      >
        <Terminal className="h-3 w-3 mr-1.5" strokeWidth={2.5} />
        {showLogs ? 'Ocultar logs' : 'Ver logs HPC'}
      </Button>

      {showLogs && hasLogs && (
        <div className="mt-2 border border-slate-200 bg-slate-900 p-3 max-h-40 overflow-y-auto">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="h-3 w-3 text-slate-500" strokeWidth={2} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Logs HPC
            </span>
          </div>
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-emerald-400 font-mono">
            {v.logs}
          </pre>
        </div>
      )}
    </div>
  )
}
