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

export function ExportImageDialog({ open, onOpenChange, onExport }) {
  const [format, setFormat] = useState("png");
  const [scale, setScale] = useState(2);
  const [transparent, setTransparent] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport({ format, scale, transparent });
    } finally {
      setExporting(false);
      onOpenChange(false);
    }
  };

  const scales = [
    { value: 1, label: "1x (Estándar)" },
    { value: 2, label: "2x (Alta)" },
    { value: 4, label: "4x (Publicación)" },
  ];

  const formats = [
    { value: "png", label: "PNG", desc: "Sin pérdida, con transparencia" },
    { value: "jpeg", label: "JPEG", desc: "Comprimido, menor tamaño" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Exportar Imagen del Visor 3D
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500">
            Configura el formato y la resolución de la imagen exportada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Formato
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`rounded-none border px-3 py-2 text-left transition-colors ${
                    format === f.value
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="block text-[11px] font-bold">{f.label}</span>
                  <span className="text-[9px] text-slate-400">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Resolución
            </label>
            <div className="space-y-1">
              {scales.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScale(s.value)}
                  className={`w-full rounded-none border px-3 py-2 text-left text-[11px] transition-colors ${
                    scale === s.value
                      ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {format === "png" && (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="h-3.5 w-3.5 rounded-none border-slate-300"
              />
              <span className="text-[11px] text-slate-600">
                Fondo transparente
              </span>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-blue-700"
          >
            {exporting ? "Exportando..." : "Exportar Imagen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
