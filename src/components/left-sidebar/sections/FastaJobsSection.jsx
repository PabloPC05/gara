import React, { useState, useRef, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { loadProteinFromInputWithJobPanel } from "@/lib/proteinLoadService";
import { useProteinStore } from "@/stores/useProteinStore";
import { JOB_PANEL_KEYS } from "@/stores/useJobStatusStore";
import { PersistentJobStatusPanel } from "@/components/ui/PersistentJobStatusPanel";
import { validateFasta } from "@/utils/fasta";
import ExportDriveButton from "../../ExportDriveButton";

export function FastaJobsSection() {
  const [fasta, setFasta] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const setSelectedProteinIds = useProteinStore((s) => s.setSelectedProteinIds);

  const handleRun = useCallback(async () => {
    const validation = validateFasta(fasta);
    if (!validation.valid) {
      setError(validation.reason ?? "Secuencia FASTA no válida");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const proteinId = await loadProteinFromInputWithJobPanel(fasta, {
        panelKey: JOB_PANEL_KEYS.filesFasta,
      });
      if (proteinId) setSelectedProteinIds([proteinId]);
    } catch (err) {
      setError(err?.message ?? "Error al procesar la secuencia");
    } finally {
      setIsLoading(false);
    }
  }, [fasta, setSelectedProteinIds]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFasta(event.target.result);
    };
    reader.readAsText(file);
    // Reset input para permitir cargar el mismo archivo consecutivamente si es necesario
    e.target.value = null;
  };

  const handleFileDownload = () => {
    if (!fasta) return;

    const blob = new Blob([fasta], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sequence.fasta";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col gap-4 text-sm text-slate-700">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Scripts & Jobs
      </h2>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <label className="font-medium">Paste FASTA Sequence</label>
          <div className="flex gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-none p-1.5 text-slate-500 transition-colors hover:bg-[#fde8e8] hover:text-[#e31e24]"
              title="Cargar archivo FASTA"
            >
              <Upload size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".fasta,.fas,.fa,.seq,.txt"
              className="hidden"
            />
            <ExportDriveButton
              proteinData={{ name: "Manual Sequence", fasta: fasta }}
              minimal={true}
            />
          </div>
        </div>
        <textarea
          className="h-48 w-full resize-none rounded-none border border-slate-200 p-3 font-mono text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder=">Sequence_1&#10;MTEITAAMVKELRESTGAGMMDCKNALSET..."
          value={fasta}
          onChange={(e) => setFasta(e.target.value)}
        />
        <button
          className="mt-2 flex items-center justify-center gap-2 rounded-none bg-slate-900 py-2 font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          onClick={handleRun}
          disabled={!fasta || isLoading}
        >
          {isLoading && <Loader2 size={15} className="animate-spin" />}
          {isLoading ? "Procesando..." : "Run Job"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-none border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <PersistentJobStatusPanel panelKey={JOB_PANEL_KEYS.filesFasta} />
    </div>
  );
}
