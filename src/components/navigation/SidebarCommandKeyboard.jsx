import React, { useState } from 'react';
import { cn } from "../../lib/utils"
import { Type, Delete } from 'lucide-react';

const AMINO_ACIDS = [
  { short: 'G', long: 'Gly', type: 'nonpolar', color: 'bg-slate-500' },
  { short: 'A', long: 'Ala', type: 'nonpolar', color: 'bg-slate-500' },
  { short: 'V', long: 'Val', type: 'nonpolar', color: 'bg-slate-500' },
  { short: 'L', long: 'Leu', type: 'nonpolar', color: 'bg-slate-500' },
  { short: 'I', long: 'Ile', type: 'nonpolar', color: 'bg-slate-500' },
  { short: 'M', long: 'Met', type: 'nonpolar', color: 'bg-slate-500' },
  { short: 'F', long: 'Phe', type: 'nonpolar', color: 'bg-slate-500' },
  { short: 'W', long: 'Trp', type: 'nonpolar', color: 'bg-slate-500' },
  { short: 'P', long: 'Pro', type: 'nonpolar', color: 'bg-slate-500' },
  { short: 'S', long: 'Ser', type: 'polar', color: 'bg-emerald-500' },
  { short: 'T', long: 'Thr', type: 'polar', color: 'bg-emerald-500' },
  { short: 'C', long: 'Cys', type: 'polar', color: 'bg-emerald-500' },
  { short: 'Y', long: 'Tyr', type: 'polar', color: 'bg-emerald-500' },
  { short: 'N', long: 'Asn', type: 'polar', color: 'bg-emerald-500' },
  { short: 'Q', long: 'Gln', type: 'polar', color: 'bg-emerald-500' },
  { short: 'D', long: 'Asp', type: 'acidic', color: 'bg-rose-500' },
  { short: 'E', long: 'Glu', type: 'acidic', color: 'bg-rose-500' },
  { short: 'K', long: 'Lys', type: 'basic', color: 'bg-blue-500' },
  { short: 'R', long: 'Arg', type: 'basic', color: 'bg-blue-500' },
  { short: 'H', long: 'His', type: 'basic', color: 'bg-blue-500' },
];

export default function SidebarCommandKeyboard({ onInsert, onBackspace, isVisible }) {
  const [useLongName, setUseLongName] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 px-1">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Amino-Input</span>
          <button 
            onMouseDown={(e) => { e.preventDefault(); setUseLongName(!useLongName); }}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase transition-all",
              useLongName ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
            )}
          >
            <Type className="h-3 w-3" />
            {useLongName ? '3-Letras' : '1-Letra'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {AMINO_ACIDS.map((aa) => (
            <button
              key={aa.short}
              onMouseDown={(e) => { e.preventDefault(); onInsert(useLongName ? aa.long : aa.short); }}
              className="group relative flex h-9 flex-col items-center justify-center rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all active:scale-95"
            >
              <div className={cn("absolute top-1 left-1 h-1 w-1 rounded-full", aa.color)} />
              <span className="text-xs font-black text-slate-700">{useLongName ? aa.long : aa.short}</span>
            </button>
          ))}
          <button
            onMouseDown={(e) => { e.preventDefault(); onBackspace(); }}
            className="col-span-2 flex h-9 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <Delete className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
