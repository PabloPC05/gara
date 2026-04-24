import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../ui/sheet.tsx";

const AMINO_ACIDS = [
  {
    letter: "G",
    abbr: "Gly",
    name: "Glicina",
    nameEn: "Glycine",
    group: "np",
    formula: "C₂H₅NO₂",
    mw: 75.03,
    pI: 5.97,
    charge: 0,
    desc: "El aminoácido más pequeño. Confiere flexibilidad a las cadenas polipeptídicas.",
  },
  {
    letter: "A",
    abbr: "Ala",
    name: "Alanina",
    nameEn: "Alanine",
    group: "np",
    formula: "C₃H₇NO₂",
    mw: 89.09,
    pI: 6.01,
    charge: 0,
    desc: "Aminoácido no polar muy común. Estabiliza estructuras α-hélice.",
  },
  {
    letter: "V",
    abbr: "Val",
    name: "Valina",
    nameEn: "Valine",
    group: "np",
    formula: "C₅H₁₁NO₂",
    mw: 117.15,
    pI: 5.96,
    charge: 0,
    desc: "Aminoácido esencial. Importante en el metabolismo muscular.",
  },
  {
    letter: "L",
    abbr: "Leu",
    name: "Leucina",
    nameEn: "Leucine",
    group: "np",
    formula: "C₆H₁₃NO₂",
    mw: 131.17,
    pI: 5.98,
    charge: 0,
    desc: "Aminoácido esencial. Regula la síntesis proteica vía mTOR.",
  },
  {
    letter: "I",
    abbr: "Ile",
    name: "Isoleucina",
    nameEn: "Isoleucine",
    group: "np",
    formula: "C₆H₁₃NO₂",
    mw: 131.17,
    pI: 6.02,
    charge: 0,
    desc: "Aminoácido esencial isómero de leucina. Participa en el metabolismo energético.",
  },
  {
    letter: "M",
    abbr: "Met",
    name: "Metionina",
    nameEn: "Methionine",
    group: "np",
    formula: "C₅H₁₁NO₂S",
    mw: 149.21,
    pI: 5.74,
    charge: 0,
    desc: "Inicia la síntesis de proteínas. Fuente de grupos metilo.",
  },
  {
    letter: "F",
    abbr: "Phe",
    name: "Fenilalanina",
    nameEn: "Phenylalanine",
    group: "np",
    formula: "C₉H₁₁NO₂",
    mw: 165.19,
    pI: 5.48,
    charge: 0,
    desc: "Aminoácido esencial aromático. Precursor de tirosina y neurotransmisores.",
  },
  {
    letter: "W",
    abbr: "Trp",
    name: "Triptófano",
    nameEn: "Tryptophan",
    group: "np",
    formula: "C₁₁H₁₂N₂O₂",
    mw: 204.23,
    pI: 5.89,
    charge: 0,
    desc: "Aminoácido esencial con anillo indol. Precursor de serotonina.",
  },
  {
    letter: "P",
    abbr: "Pro",
    name: "Prolina",
    nameEn: "Proline",
    group: "np",
    formula: "C₅H₉NO₂",
    mw: 115.13,
    pI: 6.3,
    charge: 0,
    desc: "Aminoácido cíclico. Introduce giros en la cadena y estabiliza giros β.",
  },
  {
    letter: "S",
    abbr: "Ser",
    name: "Serina",
    nameEn: "Serine",
    group: "po",
    formula: "C₃H₇NO₃",
    mw: 105.09,
    pI: 5.68,
    charge: 0,
    desc: "Aminoácido polar. Sitio frecuente de fosforilación en señalización celular.",
  },
  {
    letter: "T",
    abbr: "Thr",
    name: "Treonina",
    nameEn: "Threonine",
    group: "po",
    formula: "C₄H₉NO₃",
    mw: 119.12,
    pI: 5.6,
    charge: 0,
    desc: "Aminoácido esencial polar. También sitio de fosforilación y glicosilación.",
  },
  {
    letter: "C",
    abbr: "Cys",
    name: "Cisteína",
    nameEn: "Cysteine",
    group: "po",
    formula: "C₃H₇NO₂S",
    mw: 121.16,
    pI: 5.07,
    charge: 0,
    desc: "Forma puentes disulfuro que estabilizan la estructura 3D de proteínas.",
  },
  {
    letter: "Y",
    abbr: "Tyr",
    name: "Tirosina",
    nameEn: "Tyrosine",
    group: "po",
    formula: "C₉H₁₁NO₃",
    mw: 181.19,
    pI: 5.66,
    charge: 0,
    desc: "Aminoácido aromático polar. Sitio de fosforilación en cascadas de señalización.",
  },
  {
    letter: "N",
    abbr: "Asn",
    name: "Asparagina",
    nameEn: "Asparagine",
    group: "po",
    formula: "C₄H₈N₂O₃",
    mw: 132.12,
    pI: 5.41,
    charge: 0,
    desc: "Aminoácido polar. Sitio frecuente de N-glicosilación en proteínas.",
  },
  {
    letter: "Q",
    abbr: "Gln",
    name: "Glutamina",
    nameEn: "Glutamine",
    group: "po",
    formula: "C₅H₁₀N₂O₃",
    mw: 146.15,
    pI: 5.65,
    charge: 0,
    desc: "Aminoácido polar más abundante en sangre. Donador de grupos amino.",
  },
  {
    letter: "D",
    abbr: "Asp",
    name: "Ácido aspártico",
    nameEn: "Aspartate",
    group: "ac",
    formula: "C₄H₇NO₄",
    mw: 133.1,
    pI: 2.77,
    charge: -1,
    desc: "Aminoácido ácido. Participa en la catálisis enzimática como ácido general.",
  },
  {
    letter: "E",
    abbr: "Glu",
    name: "Ácido glutámico",
    nameEn: "Glutamate",
    group: "ac",
    formula: "C₅H₉NO₄",
    mw: 147.13,
    pI: 3.22,
    charge: -1,
    desc: "Neurotransmisor excitatorio principal. Dona grupos amino en transaminación.",
  },
  {
    letter: "K",
    abbr: "Lys",
    name: "Lisina",
    nameEn: "Lysine",
    group: "ba",
    formula: "C₆H₁₄N₂O₂",
    mw: 146.19,
    pI: 9.74,
    charge: +1,
    desc: "Aminoácido básico esencial. Participa en uniones iónicas y metilación de histonas.",
  },
  {
    letter: "R",
    abbr: "Arg",
    name: "Arginina",
    nameEn: "Arginine",
    group: "ba",
    formula: "C₆H₁₄N₄O₂",
    mw: 174.2,
    pI: 10.76,
    charge: +1,
    desc: "Aminoácido más básico. Forma múltiples puentes de hidrógeno en sitios activos.",
  },
  {
    letter: "H",
    abbr: "His",
    name: "Histidina",
    nameEn: "Hisitidine",
    group: "ba",
    formula: "C₆H₉N₃O₂",
    mw: 155.16,
    pI: 7.59,
    charge: 0,
    desc: "Aminoácido con imidazol. Residuo catalítico clave por su pKa cercano a 7.",
  },
];

const GROUP_STYLES = {
  np: "bg-amber-50  text-amber-700  border-amber-200  hover:bg-amber-100  hover:border-amber-300",
  po: "bg-sky-50    text-sky-700    border-sky-200    hover:bg-sky-100    hover:border-sky-300",
  ac: "bg-rose-50   text-rose-700   border-rose-200   hover:bg-rose-100   hover:border-rose-300",
  ba: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300",
};

const GROUP_LABELS = { np: "No polar", po: "Polar", ac: "Ácido", ba: "Básico" };

const LEGEND = [
  { group: "np", dot: "bg-amber-300", label: "Apolares" },
  { group: "po", dot: "bg-sky-300", label: "Polares" },
  { group: "ac", dot: "bg-rose-300", label: "Ácidos" },
  { group: "ba", dot: "bg-indigo-300", label: "Básicos" },
];

function AminoAcidTooltip({ aa, buttonRef }) {
  if (!aa || !buttonRef) return null;

  const rect = buttonRef.getBoundingClientRect();
  const parentRect = buttonRef
    .closest("[data-keyboard-root]")
    ?.getBoundingClientRect();
  const offsetX = parentRect
    ? rect.left - parentRect.left + rect.width / 2
    : rect.width / 2;

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        bottom: "100%",
        left: offsetX,
        transform: "translateX(-50%)",
        marginBottom: 8,
      }}
    >
      <div className="w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl font-black text-slate-800">
            {aa.letter}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold text-slate-700">
              {aa.name}
            </span>
            <span className="text-[9px] text-slate-400">{aa.nameEn}</span>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div>
            <span className="text-slate-400">Abreviatura</span>
            <p className="font-semibold text-slate-700">{aa.abbr}</p>
          </div>
          <div>
            <span className="text-slate-400">Tipo</span>
            <p className="font-semibold text-slate-700">
              {GROUP_LABELS[aa.group]}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Fórmula</span>
            <p className="font-semibold text-slate-700">{aa.formula}</p>
          </div>
          <div>
            <span className="text-slate-400">Masa (Da)</span>
            <p className="font-semibold text-slate-700">{aa.mw.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-slate-400">pI</span>
            <p className="font-semibold text-slate-700">{aa.pI.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-slate-400">Carga (pH 7)</span>
            <p className="font-semibold text-slate-700">
              {aa.charge > 0
                ? `+${aa.charge}`
                : aa.charge < 0
                  ? `${aa.charge}`
                  : "0"}
            </p>
          </div>
        </div>

        <p className="text-[10px] leading-snug text-slate-500">{aa.desc}</p>
      </div>
      <div className="flex justify-center">
        <div className="-mt-[7px] h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white" />
      </div>
    </div>
  );
}

export function AminoAcidGridPicker({
  open,
  onOpenChange,
  onAppendLetter,
  onDeleteLast,
  onClear,
  onConfirm,
  canConfirm,
}) {
  const [hoveredAa, setHoveredAa] = useState(null);
  const [hoveredRef, setHoveredRef] = useState(null);

  const handleKeyDown = (event) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    )
      return;

    if (event.key === "Backspace") {
      event.preventDefault();
      onDeleteLast();
      return;
    }

    if (event.key === "Enter") {
      if (!canConfirm) return;
      event.preventDefault();
      onConfirm();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="bottom"
        showOverlay={false}
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          event.currentTarget.focus();
        }}
        onPointerDownOutside={(event) => {}}
        onInteractOutside={(event) => {}}
        onKeyDown={handleKeyDown}
        className="rounded-none border-t border-slate-100 bg-white p-0 shadow-2xl shadow-slate-900/10"
      >
        <div className="relative px-6 pb-8 pt-3" data-keyboard-root>
          {hoveredAa && (
            <AminoAcidTooltip aa={hoveredAa} buttonRef={hoveredRef} />
          )}

          <div
            className="mb-2 flex cursor-pointer select-none items-center justify-between"
            onClick={() => onOpenChange(false)}
            title="Cerrar teclado"
          >
            <SheetHeader className="p-0">
              <SheetTitle className="text-[10px] font-semibold uppercase leading-none tracking-widest text-slate-400">
                Teclado de aminoácidos
              </SheetTitle>
              <SheetDescription className="sr-only">
                Selecciona aminoácidos para construir tu secuencia.
              </SheetDescription>
            </SheetHeader>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {LEGEND.map(({ group, dot, label }) => (
                <span key={group} className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <span className="text-[10px] text-slate-400">{label}</span>
                </span>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={onDeleteLast}
                title="Borrar último"
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
              <button
                onClick={onClear}
                title="Limpiar todo"
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-sm font-extrabold text-slate-600 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
              >
                AC
              </button>
              <button
                onClick={onConfirm}
                disabled={!canConfirm}
                title="Procesar secuencia"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e31e24] text-white transition-all hover:bg-[#c91b20] active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-1.5">
            {AMINO_ACIDS.map((aa) => (
              <button
                key={aa.letter}
                title={`${aa.name} · ${aa.letter}`}
                onClick={() => onAppendLetter(aa.letter)}
                onMouseEnter={(e) => {
                  setHoveredAa(aa);
                  setHoveredRef(e.currentTarget);
                }}
                onMouseLeave={() => {
                  setHoveredAa(null);
                  setHoveredRef(null);
                }}
                className={`flex h-9 items-center justify-center rounded-lg border text-[11px] font-semibold transition-all duration-75 active:scale-95 ${GROUP_STYLES[aa.group]}`}
              >
                {aa.abbr}
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
