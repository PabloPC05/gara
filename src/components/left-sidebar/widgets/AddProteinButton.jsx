import { Plus } from "lucide-react";

export function AddProteinButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group mt-3 flex w-full items-center justify-center gap-2 rounded-none border border-dashed border-slate-200 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-300 transition-all duration-200 hover:border-[#ea7660] hover:bg-[#fde8e8]/40 hover:text-[#e31e24] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-300"
      title={
        disabled
          ? "Introduce un PDB ID o secuencia válida antes de añadir"
          : "Añadir entrada"
      }
    >
      <Plus
        className="h-3.5 w-3.5 transition-transform group-hover:scale-110"
        strokeWidth={2.5}
      />
      Añadir
    </button>
  );
}
