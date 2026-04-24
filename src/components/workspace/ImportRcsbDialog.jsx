import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ImportRcsbDialog({ open, onOpenChange, onImport }) {
  const [pdbId, setPdbId] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState("pdb");

  const handleSearch = async () => {
    const id = pdbId.trim().toUpperCase();
    if (!/^\d[A-Z0-9]{3}$/.test(id)) {
      setError("El PDB ID debe tener 4 caracteres alfanuméricos (ej: 1CRN)");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { fetchMetadataById } = await import("../../lib/rcsbClient");
      const meta = await fetchMetadataById(id);
      setPreview(meta);
    } catch (e) {
      setError(e.message);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const id = pdbId.trim().toUpperCase();
    setLoading(true);
    try {
      await onImport(id, format);
      onOpenChange(false);
      setPdbId("");
      setPreview(null);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open) => {
    if (!open) {
      setPdbId("");
      setPreview(null);
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Importar desde RCSB PDB
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500">
            Introduce el PDB ID de la estructura que deseas cargar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-slate-400">
              PDB ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pdbId}
                onChange={(e) => setPdbId(e.target.value)}
                placeholder="ej: 1CRN, 7A4B"
                maxLength={4}
                className="flex-1 rounded-none border border-slate-200 px-3 py-2 font-mono text-sm uppercase tracking-wider focus:border-blue-500 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={loading || pdbId.trim().length < 4}
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {loading ? "..." : "Buscar"}
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Formato de descarga
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat("pdb")}
                className={`rounded-none border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  format === "pdb"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                PDB (clásico)
              </button>
              <button
                onClick={() => setFormat("cif")}
                className={`rounded-none border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  format === "cif"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                mmCIF (moderno)
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-none border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-600">
              {error}
            </div>
          )}

          {preview && (
            <div className="space-y-1 rounded-none border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-bold text-slate-900">
                {preview.title}
              </div>
              {preview.organism && (
                <div className="text-[10px] italic text-slate-500">
                  {preview.organism}
                </div>
              )}
              <div className="flex gap-3 font-mono text-[9px] text-slate-400">
                {preview.method && <span>{preview.method}</span>}
                {preview.resolution != null && (
                  <span>{preview.resolution.toFixed(2)} A</span>
                )}
                {preview.length != null && (
                  <span>{preview.length} residuos</span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            className="text-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || !preview}
            className="bg-blue-600 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-blue-700"
          >
            {loading ? "Cargando..." : "Importar Estructura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
