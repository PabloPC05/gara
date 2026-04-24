import { useState, useCallback } from "react";

const ACCEPTED_EXTENSIONS = [
  ".pdb",
  ".cif",
  ".mmcif",
  ".fasta",
  ".fas",
  ".fa",
  ".seq",
  ".txt",
  ".session",
];

function isAcceptedFile(file) {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function DropZoneOverlay({ onFilesDropped, children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCount, setDragCount] = useState(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCount((c) => {
      if (c === 0) setIsDragging(true);
      return c + 1;
    });
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCount((c) => {
      const next = c - 1;
      if (next === 0) setIsDragging(false);
      return Math.max(0, next);
    });
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCount(0);

      const files = Array.from(e.dataTransfer.files).filter(isAcceptedFile);
      if (files.length > 0) {
        onFilesDropped(files);
      }
    },
    [onFilesDropped],
  );

  return (
    <div
      className="relative h-full w-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-[100] flex items-center justify-center border-2 border-dashed border-blue-500 bg-blue-600/10 backdrop-blur-sm">
          <div className="rounded-none border border-blue-200 bg-white/95 px-8 py-6 text-center shadow-2xl">
            <div className="mb-2 text-3xl">&#128196;</div>
            <div className="text-sm font-bold text-slate-900">
              Soltar archivos aquí
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              .pdb, .cif, .fasta, .session
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
