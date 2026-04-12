import { useState, useCallback } from 'react'

const ACCEPTED_EXTENSIONS = ['.pdb', '.cif', '.mmcif', '.fasta', '.fas', '.fa', '.seq', '.txt', '.session']

function isAcceptedFile(file) {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

export function DropZoneOverlay({ onFilesDropped, children }) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragCount, setDragCount] = useState(0)

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCount((c) => {
      if (c === 0) setIsDragging(true)
      return c + 1
    })
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCount((c) => {
      const next = c - 1
      if (next === 0) setIsDragging(false)
      return Math.max(0, next)
    })
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragCount(0)

    const files = Array.from(e.dataTransfer.files).filter(isAcceptedFile)
    if (files.length > 0) {
      onFilesDropped(files)
    }
  }, [onFilesDropped])

  return (
    <div
      className="relative w-full h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {isDragging && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-blue-600/10 backdrop-blur-sm border-2 border-dashed border-blue-500 pointer-events-none">
          <div className="rounded-none bg-white/95 border border-blue-200 shadow-2xl px-8 py-6 text-center">
            <div className="text-3xl mb-2">&#128196;</div>
            <div className="text-sm font-bold text-slate-900">Soltar archivos aquí</div>
            <div className="text-[10px] text-slate-500 mt-1">
              .pdb, .cif, .fasta, .session
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
