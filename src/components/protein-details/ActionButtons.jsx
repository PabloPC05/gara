import { Download, Terminal, FileText } from 'lucide-react'
import { useState } from 'react'

export function ActionButtons({ protein }) {
  const pdbFile = protein._raw?.structural_data?.pdb_file ?? protein.pdbData
  const logs = protein._raw?.logs ?? protein.logs ?? ''
  const hasPdb = !!pdbFile
  const hasLogs = !!logs

  const [showLogs, setShowLogs] = useState(false)

  const handleDownloadPdb = () => {
    if (!pdbFile) return
    const proteinName = protein._raw?.protein_metadata?.protein_name || protein.name || 'protein'
    const safeName = proteinName.replace(/\s+/g, '_').toLowerCase()
    const blob = new Blob([pdbFile], { type: 'chemical/x-pdb' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}.pdb`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border-t border-slate-100 px-6 py-4">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasPdb}
          onClick={handleDownloadPdb}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-200/60 transition-all hover:bg-blue-700 hover:shadow-xl disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
          Descargar PDB
        </button>
        <button
          type="button"
          disabled={!hasLogs}
          onClick={() => setShowLogs((v) => !v)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
        >
          <Terminal className="h-3.5 w-3.5" strokeWidth={2.5} />
          {showLogs ? 'Ocultar Logs' : 'Ver Logs'}
        </button>
      </div>

      {showLogs && hasLogs && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-900 p-3 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-1.5 mb-2">
            <FileText className="h-3 w-3 text-slate-500" strokeWidth={2} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Logs de ejecución HPC
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
