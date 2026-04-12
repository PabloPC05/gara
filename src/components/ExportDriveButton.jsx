import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, FileText, Table, FolderOpen } from 'lucide-react';
import { initGoogleIdentity, exportResultsToWorkspace } from '../lib/googleDriveService';
import driveLogo from '../assets/new-logo-drive-google.svg';

const GoogleDriveLogo = ({ className }) => (
  <img src={driveLogo} alt="Google Drive" className={className} />
);

const ExportDriveButton = ({ proteinData, summary, paeData, metrics, minimal = false }) => {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [exportResult, setExportResult] = useState(null);

  const handleExport = async () => {
    if (!proteinData) return;
    
    setStatus('loading');
    setExportResult(null);
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID no configurado');
      
      const result = await exportResultsToWorkspace({
        proteinName: proteinData.name || 'Proteína',
        summaryText: summary || `Secuencia:\n${proteinData.sequence || proteinData.fasta || ''}`,
        paeJsonData: paeData,
        metrics: metrics || {
          pLDDT: proteinData.plddtMean,
          'PAE Medio': proteinData.meanPae,
          'Peso Molecular (Da)': proteinData.molecular_weight,
          'Longitud (aa)': proteinData.length,
          'Organismo': proteinData.organism
        }
      });
      
      setExportResult(result);
      setStatus('success');
      // No reseteamos a idle automáticamente si hay links que mostrar
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.error === 'access_denied' ? 'Acceso cancelado' : (err.message || 'Error al exportar'));
    }
  };

  const buttonStyles = {
    idle: "bg-white text-slate-900 hover:bg-slate-50 border-slate-200",
    loading: "bg-blue-50 text-blue-600 border-blue-200 cursor-wait",
    success: "bg-green-50 text-green-600 border-green-200",
    error: "bg-red-50 text-red-600 border-red-200"
  };

  if (minimal) {
    return (
      <div className="relative group">
        <button
          onClick={handleExport}
          disabled={status === 'loading'}
          title={status === 'loading' ? 'Exportando...' : 'Exportar a Google Workspace'}
          className={`p-1.5 rounded-none transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center ${
            status === 'idle' ? 'hover:bg-slate-100 text-slate-500' : 
            status === 'loading' ? 'bg-blue-50 text-blue-500' : 
            status === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
          }`}
        >
          {status === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : status === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <GoogleDriveLogo className="w-4 h-4" />
          )}
        </button>
        
        {status === 'success' && exportResult && (
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white border border-slate-200 shadow-xl p-2 flex flex-col gap-1 rounded-none">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1">Exportado</p>
            <a href={exportResult.folderUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
              <FolderOpen className="w-3 h-3" /> Ver Carpeta
            </a>
            {exportResult.files.map((file, i) => (
              <a key={i} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                {file.name.includes('Hoja') ? <Table className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                {file.name}
              </a>
            ))}
            <button onClick={() => setStatus('idle')} className="mt-1 border-t border-slate-100 pt-1 text-[9px] text-slate-400 hover:text-slate-600 text-center">Cerrar</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-hidden min-w-0">
      <button
        onClick={handleExport}
        disabled={status === 'loading'}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-none border font-medium transition-all duration-200 shadow-sm overflow-hidden min-w-0 ${buttonStyles[status]}`}
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : status === 'success' ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : status === 'error' ? (
          <AlertCircle className="w-4 h-4 shrink-0" />
        ) : (
          <GoogleDriveLogo className="w-4 h-4 shrink-0" />
        )}

        <span className="text-sm truncate">
          {status === 'loading' ? 'Exportando...' :
           status === 'success' ? '¡Exportado!' :
           status === 'error' ? 'Reintentar' : 'Exportar a Google Workspace'}
        </span>
      </button>
      
      {status === 'success' && exportResult && (
        <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col gap-2 rounded-none animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden min-w-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Archivos creados:</p>
          <div className="grid grid-cols-1 gap-1.5 min-w-0">
            <a href={exportResult.folderUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between group px-2 py-1.5 bg-white border border-slate-100 hover:border-blue-200 transition-all min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-xs font-medium text-slate-700 truncate">Ver carpeta en Drive</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400 shrink-0 ml-2" />
            </a>
            {exportResult.files.map((file, i) => (
              <a key={i} href={file.url} target="_blank" rel="noreferrer" className="flex items-center justify-between group px-2 py-1.5 bg-white border border-slate-100 hover:border-blue-200 transition-all min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                  {file.name.includes('Hoja') ?
                    <Table className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> :
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  }
                  <span className="text-xs font-medium text-slate-700 truncate">{file.name}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400 shrink-0 ml-2" />
              </a>
            ))}
          </div>
          <button onClick={() => setStatus('idle')} className="text-[10px] text-slate-400 hover:text-slate-600 underline">Exportar de nuevo</button>
        </div>
      )}

      {status === 'error' && (
        <p className="text-[10px] text-red-500 text-center font-medium uppercase tracking-tighter">
          {errorMsg}
        </p>
      )}
    </div>
  );
};

export default ExportDriveButton;
