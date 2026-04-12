import { X, Download } from 'lucide-react'
import ExportDriveButton from '../ExportDriveButton'
import { COLLAPSED_WIDTH } from './constants'

export function CollapsedStrip({
  hasProteins,
  isComparison,
  proteinCount,
  firstProtein,
  hasPdb,
  onExpand,
  onDownloadPdb,
  onClear,
}) {
  const displayName = hasProteins
    ? isComparison
      ? `${proteinCount} proteínas`
      : firstProtein?.name ?? 'Proteína'
    : 'Detalles'

  return (
    <div
      onClick={onExpand}
      style={{ width: COLLAPSED_WIDTH }}
      className="absolute right-0 top-0 bottom-0 z-30 flex flex-col items-center gap-2 border-l border-slate-200 bg-white py-4 px-1 cursor-pointer hover:bg-slate-50 group"
      title="Expandir detalles"
    >
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <span
          className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 tracking-wide select-none transition-colors"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            maxHeight: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </span>
      </div>

      {hasProteins && (
        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <ExportDriveButton proteinData={firstProtein} minimal />
          <button
            onClick={onDownloadPdb}
            disabled={!hasPdb}
            aria-label="Descargar PDB"
            title="Descargar PDB"
            className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-30 cursor-pointer shrink-0"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          <button
            onClick={onClear}
            aria-label="Deseleccionar"
            title="Deseleccionar proteína"
            className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 cursor-pointer shrink-0"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}
