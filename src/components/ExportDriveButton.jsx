import React, { useState } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  Table,
  FolderOpen,
} from "lucide-react";
import {
  initGoogleIdentity,
  exportResultsToWorkspace,
} from "../lib/googleDriveService";
import driveLogo from "../assets/new-logo-drive-google.svg";

const GoogleDriveLogo = ({ className }) => (
  <img src={driveLogo} alt="Google Drive" className={className} />
);

const ExportDriveButton = ({
  proteinData,
  summary,
  paeData,
  metrics,
  minimal = false,
}) => {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [exportResult, setExportResult] = useState(null);

  const handleExport = async () => {
    if (!proteinData) return;

    setStatus("loading");
    setExportResult(null);
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error("VITE_GOOGLE_CLIENT_ID no configurado");

      const result = await exportResultsToWorkspace({
        proteinName: proteinData.name || "Proteína",
        summaryText:
          summary ||
          `Secuencia:\n${proteinData.sequence || proteinData.fasta || ""}`,
        paeJsonData: paeData,
        metrics: metrics || {
          pLDDT: proteinData.plddtMean,
          "PAE Medio": proteinData.meanPae,
          "Peso Molecular (Da)": proteinData.molecular_weight,
          "Longitud (aa)": proteinData.length,
          Organismo: proteinData.organism,
        },
      });

      setExportResult(result);
      setStatus("success");
      // No reseteamos a idle automáticamente si hay links que mostrar
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(
        err.error === "access_denied"
          ? "Acceso cancelado"
          : err.message || "Error al exportar",
      );
    }
  };

  const buttonStyles = {
    idle: "bg-white text-slate-900 hover:bg-slate-50 border-slate-200",
    loading: "bg-blue-50 text-blue-600 border-blue-200 cursor-wait",
    success: "bg-green-50 text-green-600 border-green-200",
    error: "bg-red-50 text-red-600 border-red-200",
  };

  if (minimal) {
    return (
      <div className="group relative">
        <button
          onClick={handleExport}
          disabled={status === "loading"}
          title={
            status === "loading"
              ? "Exportando..."
              : "Exportar a Google Workspace"
          }
          className={`flex items-center justify-center rounded-none p-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
            status === "idle"
              ? "text-slate-500 hover:bg-slate-100"
              : status === "loading"
                ? "bg-blue-50 text-blue-500"
                : status === "success"
                  ? "bg-green-50 text-green-500"
                  : "bg-red-50 text-red-500"
          }`}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : status === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <GoogleDriveLogo className="h-4 w-4" />
          )}
        </button>

        {status === "success" && exportResult && (
          <div className="absolute right-0 top-full z-50 mt-1 flex w-48 flex-col gap-1 rounded-none border border-slate-200 bg-white p-2 shadow-xl">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Exportado
            </p>
            <a
              href={exportResult.folderUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600"
            >
              <FolderOpen className="h-3 w-3" /> Ver Carpeta
            </a>
            {exportResult.files.map((file, i) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600"
              >
                {file.name.includes("Hoja") ? (
                  <Table className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                {file.name}
              </a>
            ))}
            <button
              onClick={() => setStatus("idle")}
              className="mt-1 border-t border-slate-100 pt-1 text-center text-[9px] text-slate-400 hover:text-slate-600"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 overflow-hidden">
      <button
        onClick={handleExport}
        disabled={status === "loading"}
        className={`flex min-w-0 items-center justify-center gap-2 overflow-hidden rounded-none border px-4 py-2 font-medium shadow-sm transition-all duration-200 ${buttonStyles[status]}`}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : status === "success" ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        ) : status === "error" ? (
          <AlertCircle className="h-4 w-4 shrink-0" />
        ) : (
          <GoogleDriveLogo className="h-4 w-4 shrink-0" />
        )}

        <span className="truncate text-sm">
          {status === "loading"
            ? "Exportando..."
            : status === "success"
              ? "¡Exportado!"
              : status === "error"
                ? "Reintentar"
                : "Exportar a Google Workspace"}
        </span>
      </button>

      {status === "success" && exportResult && (
        <div className="flex min-w-0 flex-col gap-2 overflow-hidden rounded-none border border-slate-200 bg-slate-50 p-3 duration-300 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Archivos creados:
          </p>
          <div className="grid min-w-0 grid-cols-1 gap-1.5">
            <a
              href={exportResult.folderUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex min-w-0 items-center justify-between overflow-hidden border border-slate-100 bg-white px-2 py-1.5 transition-all hover:border-blue-200"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span className="truncate text-xs font-medium text-slate-700">
                  Ver carpeta en Drive
                </span>
              </div>
              <ExternalLink className="ml-2 h-3 w-3 shrink-0 text-slate-300 group-hover:text-blue-400" />
            </a>
            {exportResult.files.map((file, i) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="group flex min-w-0 items-center justify-between overflow-hidden border border-slate-100 bg-white px-2 py-1.5 transition-all hover:border-blue-200"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {file.name.includes("Hoja") ? (
                    <Table className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  )}
                  <span className="truncate text-xs font-medium text-slate-700">
                    {file.name}
                  </span>
                </div>
                <ExternalLink className="ml-2 h-3 w-3 shrink-0 text-slate-300 group-hover:text-blue-400" />
              </a>
            ))}
          </div>
          <button
            onClick={() => setStatus("idle")}
            className="text-[10px] text-slate-400 underline hover:text-slate-600"
          >
            Exportar de nuevo
          </button>
        </div>
      )}

      {status === "error" && (
        <p className="text-center text-[10px] font-medium uppercase tracking-tighter text-red-500">
          {errorMsg}
        </p>
      )}
    </div>
  );
};

export default ExportDriveButton;
