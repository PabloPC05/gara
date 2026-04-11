import React, { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';

export function FilesSection() {
  const [fasta, setFasta] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, PENDING, RUNNING, COMPLETED
  const fileInputRef = useRef(null);

  const handleRun = () => {
    if (!fasta) return;
    setStatus('PENDING');
    setTimeout(() => setStatus('RUNNING'), 1500);
    setTimeout(() => setStatus('COMPLETED'), 4500);
  };

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
              className="p-1.5 text-slate-500 hover:text-[#e31e24] hover:bg-[#fde8e8] rounded-md transition-colors flex items-center gap-1"
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
            <button 
              onClick={handleFileDownload}
              disabled={!fasta}
              className="p-1.5 text-slate-500 hover:text-[#e31e24] hover:bg-[#fde8e8] rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1"
              title="Descargar FASTA"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        <textarea 
          className="w-full h-48 p-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs shadow-sm"
          placeholder=">Sequence_1&#10;MTEITAAMVKELRESTGAGMMDCKNALSET..."
          value={fasta}
          onChange={(e) => setFasta(e.target.value)}
        />
        <button 
          className="bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 transition-colors font-medium mt-2 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
          onClick={handleRun}
          disabled={!fasta || status === 'PENDING' || status === 'RUNNING'}
        >
          {status === 'RUNNING' ? 'Running...' : status === 'PENDING' ? 'Pending...' : 'Run Job'}
        </button>
      </div>
      
      {status !== 'IDLE' && (
        <div className="mt-4 border border-slate-200 rounded-md p-3 bg-slate-50 shadow-sm">
          <h3 className="font-medium text-xs text-slate-500 uppercase tracking-wider mb-3">Job Status</h3>
          <div className="flex items-center gap-3">
            <span className={`flex-shrink-0 w-3 h-3 rounded-full ${status === 'COMPLETED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : status === 'RUNNING' ? 'bg-[#e31e24] animate-pulse shadow-[0_0_8px_rgba(227,30,36,0.6)]' : 'bg-amber-400'}`}></span>
            <span className="font-mono text-sm font-semibold">{status}</span>
          </div>
        </div>
      )}
    </div>
  );
}
