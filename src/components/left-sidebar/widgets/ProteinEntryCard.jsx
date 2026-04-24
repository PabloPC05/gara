import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { useProteinStore } from "../../../stores/useProteinStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog.tsx";
import { Button } from "../../ui/button";

const proteinLabel = (protein) =>
  protein?.name ||
  protein?.uniprotId ||
  protein?.pdbId ||
  protein?.id ||
  "Unknown protein";

const proteinMeta = (protein) => {
  const bits = [];
  if (protein?.organism && protein.organism !== "Unknown")
    bits.push(protein.organism);
  if (protein?.length) bits.push(`${protein.length} aa`);
  if (protein?.uniprotId) bits.push(`UniProt ${protein.uniprotId}`);
  else if (protein?.pdbId) bits.push(`PDB ${protein.pdbId}`);
  return bits.join(" · ");
};

export function ProteinEntryCard({
  index,
  protein,
  isActive,
  onToggleSelection,
}) {
  const label = proteinLabel(protein);
  const meta = proteinMeta(protein);

  const removeProtein = useProteinStore((s) => s.removeProtein);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div
        className={`group flex w-full items-center rounded-none border px-3 py-2 transition-colors ${
          isActive
            ? "border-[#f2b8b9] bg-[#fde8e8]/70 shadow-[0_0_0_2px_rgba(227,30,36,0.12)]"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
      >
        {/* Zona de selección — ocupa todo el espacio disponible */}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          onClick={() => onToggleSelection?.(protein?.id)}
        >
          <span
            className={`mt-0.5 w-4 shrink-0 select-none text-right text-[9px] font-black tabular-nums transition-colors ${
              isActive ? "text-[#e31e24]" : "text-slate-300"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-semibold ${isActive ? "text-slate-900" : "text-slate-800"}`}
            >
              {label}
            </p>
            {meta ? (
              <p className="mt-1 truncate text-[11px] text-slate-500">{meta}</p>
            ) : (
              <p className="mt-1 truncate text-[11px] text-slate-400">
                {protein?.id}
              </p>
            )}
          </div>
        </button>

        {/* Botón eliminar — aparece al hacer hover sobre la fila */}
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="ml-2 shrink-0 rounded-md p-1 text-slate-300 opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
          title="Eliminar entrada"
          aria-label={`Eliminar ${label}`}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Eliminar entrada</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar{" "}
              <strong className="text-foreground">{label}</strong>? Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                removeProtein(protein.id);
                setConfirmOpen(false);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
