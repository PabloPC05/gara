import React, { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { PersistentJobStatusPanel } from '@/components/ui/PersistentJobStatusPanel';
import { loadProteinFromInputWithJobPanel } from '@/lib/proteinLoadService';
import {
  ACTIVE_JOB_STATUSES,
  JOB_PANEL_KEYS,
  useJobStatusStore,
} from '@/stores/useJobStatusStore';
import { useProteinStore } from '@/stores/useProteinStore';
import { validateFasta } from '@/utils/fasta';
import ExportDriveButton from '../ExportDriveButton';

export function FilesSection() {
  const [fasta, setFasta] = useState('');
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const jobPanel = useJobStatusStore((s) => s.panelsByKey[JOB_PANEL_KEYS.filesFasta] ?? null);
  const setSelectedProteinIds = useProteinStore((s) => s.setSelectedProteinIds);
  const isJobActive = ACTIVE_JOB_STATUSES.has(jobPanel?.status);

  const handleRun = async () => {
    const validation = validateFasta(fasta);
    if (!validation.valid) {
      setValidationError(validation.reason ?? 'Secuencia FASTA no válida');
      return;
    }

    setValidationError(null);
    try {
      const proteinId = await loadProteinFromInputWithJobPanel(fasta, {
        panelKey: JOB_PANEL_KEYS.filesFasta,
      });
      if (proteinId) setSelectedProteinIds([proteinId]);
    } catch {
      // El servicio ya actualiza el panel persistente con FAILED/CANCELLED.
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setValidationError(null);
      setFasta(event.target.result);
    };
    reader.readAsText(file);
    // Reset input para permitir cargar el mismo archivo consecutivamente si es necesario
    e.target.value = null;
  };

  const handleFileDownload = () => {
    if (!fasta) return;
    
    const blob = new Blob([fasta], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sequence.fasta';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 text-sm text-slate-700 h-full">
      <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-wider px-1">Scripts & Jobs</h2>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <label className="font-medium">Paste FASTA Sequence</label>
          <div className="flex gap-1">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-500 hover:text-[#e31e24] hover:bg-[#fde8e8] rounded-none transition-colors flex items-center gap-1"
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
              proteinData={{ name: 'Manual Sequence', fasta: fasta }}
              minimal={true}
            />
          </div>
        </div>
        <textarea 
          className="w-full h-48 p-3 border border-slate-200 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs shadow-sm"
          placeholder=">Sequence_1&#10;MTEITAAMVKELRESTGAGMMDCKNALSET..."
          value={fasta}
          onChange={(e) => {
            setValidationError(null);
            setFasta(e.target.value);
          }}
        />
        <button
          className="bg-slate-900 text-white py-2 rounded-none hover:bg-slate-800 transition-colors font-medium mt-2 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
          onClick={handleRun}
          disabled={!fasta || isJobActive}
        >
          {isJobActive && <Loader2 size={15} className="animate-spin" />}
          {isJobActive ? 'Procesando...' : 'Run Job'}
        </button>
      </div>

      {validationError && (
        <div className="mt-3 border border-rose-200 rounded-none p-3 bg-rose-50 text-rose-700 text-xs">
          {validationError}
        </div>
      )}

      <PersistentJobStatusPanel panelKey={JOB_PANEL_KEYS.filesFasta} />
    </div>
  );
}
