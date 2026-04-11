import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet.tsx'
import { isValidEntry } from '../../hooks/useCommandEntries'

// Standard 3-letter abbreviations, ordered GAVLIMFWPSTCYNQDEKRH
const AMINO_ACIDS = [
  { letter: 'G', abbr: 'Gly', name: 'Glycine',       group: 'np' },
  { letter: 'A', abbr: 'Ala', name: 'Alanine',       group: 'np' },
  { letter: 'V', abbr: 'Val', name: 'Valine',        group: 'np' },
  { letter: 'L', abbr: 'Leu', name: 'Leucine',       group: 'np' },
  { letter: 'I', abbr: 'Ile', name: 'Isoleucine',    group: 'np' },
  { letter: 'M', abbr: 'Met', name: 'Methionine',    group: 'np' },
  { letter: 'F', abbr: 'Phe', name: 'Phenylalanine', group: 'np' },
  { letter: 'W', abbr: 'Trp', name: 'Tryptophan',    group: 'np' },
  { letter: 'P', abbr: 'Pro', name: 'Proline',       group: 'np' },
  { letter: 'S', abbr: 'Ser', name: 'Serine',        group: 'po' },
  { letter: 'T', abbr: 'Thr', name: 'Threonine',     group: 'po' },
  { letter: 'C', abbr: 'Cys', name: 'Cysteine',      group: 'po' },
  { letter: 'Y', abbr: 'Tyr', name: 'Tyrosine',      group: 'po' },
  { letter: 'N', abbr: 'Asn', name: 'Asparagine',    group: 'po' },
  { letter: 'Q', abbr: 'Gln', name: 'Glutamine',     group: 'po' },
  { letter: 'D', abbr: 'Asp', name: 'Aspartate',     group: 'ac' },
  { letter: 'E', abbr: 'Glu', name: 'Glutamate',     group: 'ac' },
  { letter: 'K', abbr: 'Lys', name: 'Lysine',        group: 'ba' },
  { letter: 'R', abbr: 'Arg', name: 'Arginine',      group: 'ba' },
  { letter: 'H', abbr: 'His', name: 'Histidine',     group: 'ba' },
]

const GROUP_STYLES = {
  np: 'bg-amber-50  text-amber-700  border-amber-200  hover:bg-amber-100  hover:border-amber-300',
  po: 'bg-sky-50    text-sky-700    border-sky-200    hover:bg-sky-100    hover:border-sky-300',
  ac: 'bg-rose-50   text-rose-700   border-rose-200   hover:bg-rose-100   hover:border-rose-300',
  ba: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300',
}

const LEGEND = [
  { group: 'np', dot: 'bg-amber-300',  label: 'Apolares' },
  { group: 'po', dot: 'bg-sky-300',    label: 'Polares'  },
  { group: 'ac', dot: 'bg-rose-300',   label: 'Ácidos'   },
  { group: 'ba', dot: 'bg-indigo-300', label: 'Básicos'  },
]

export function AminoAcidPicker({
  open,
  onOpenChange,
  activeEntry,
  draftSequence,
  entryIndex,
  onAppendLetter,
  onDeleteLast,
  onClear,
  onConfirm,
}) {
  const isDraft = !activeEntry
  const sequence = activeEntry?.value ?? draftSequence ?? ''
  const isValid  = isValidEntry(sequence)
  const isEmpty  = sequence.length === 0
  const canConfirm = isDraft ? isValid : true
  const confirmLabel = isDraft ? 'Añadir secuencia' : 'Listo'
  const shortcutHint = isDraft ? 'Backspace borra · Enter añade' : 'Backspace borra · Enter cierra'

  const handleKeyDown = (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return

    if (event.key === 'Backspace') {
      if (isEmpty) return
      event.preventDefault()
      onDeleteLast()
      return
    }

    if (event.key === 'Enter') {
      if (!canConfirm) return
      event.preventDefault()
      onConfirm()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="bottom"
        showOverlay={false}
        showCloseButton={true}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          event.currentTarget.focus()
        }}
        onKeyDown={handleKeyDown}
        className="rounded-t-2xl border-t border-slate-100 bg-white p-0 shadow-2xl shadow-slate-900/10"
      >
        {/* Full-width wrapper — minimal horizontal padding */}
        <div className="px-6 pt-4 pb-5">

          {/* Header — pr-8 keeps space for the absolute close button */}
          <SheetHeader className="p-0 mb-3 pr-8">
            <div className="flex items-center gap-2">
              {entryIndex != null && (
                <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#e31e24] text-white text-[9px] font-black tabular-nums select-none">
                  {String(entryIndex + 1).padStart(2, '0')}
                </span>
              )}
              <SheetTitle className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                Constructor de secuencia
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Sequence display + controls — side by side */}
          <div className="flex items-stretch gap-2 mb-4">

            {/* Sequence block — grows to fill available width */}
            <div className={`flex-1 min-w-0 rounded-xl border px-4 py-2 flex items-center gap-3 overflow-x-auto transition-colors ${
              isEmpty
                ? 'border-slate-100 bg-slate-50/60'
                : isValid
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-slate-100 bg-slate-50/60'
            }`}>
              {isEmpty ? (
                <span className="text-slate-300 text-sm italic select-none">
                  Pulsa un aminoácido para empezar…
                </span>
              ) : (
                <>
                  <span className={`font-mono text-xl tracking-wider font-semibold whitespace-nowrap leading-none ${
                    isValid ? 'text-emerald-700' : 'text-slate-700'
                  }`}>
                    {sequence.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums text-slate-400 shrink-0 leading-none">
                    {sequence.length} aa
                  </span>
                </>
              )}
            </div>

            {/* Controls — stacked vertically, aligned to the right of the sequence */}
            <div className="shrink-0 flex flex-col justify-center gap-1.5">
              <button
                onClick={onDeleteLast}
                disabled={isEmpty}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200
                           text-xs font-semibold text-slate-500 bg-white
                           hover:bg-slate-50 hover:border-slate-300
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ⌫ Borrar
              </button>
              <button
                onClick={onClear}
                disabled={isEmpty}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200
                           text-xs font-semibold text-slate-500 bg-white
                           hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ✕ Limpiar
              </button>
            </div>

          </div>

          {/* Amino acid grid — 10 cols × 2 rows, 3-letter codes */}
          <div className="grid grid-cols-10 gap-1.5 mb-3">
            {AMINO_ACIDS.map((aa) => (
              <button
                key={aa.letter}
                title={`${aa.name} · ${aa.letter}`}
                onClick={() => onAppendLetter(aa.letter)}
                className={`h-9 flex items-center justify-center rounded-lg border text-[11px] font-semibold
                            active:scale-95
                            transition-all duration-75 ${GROUP_STYLES[aa.group]}`}
              >
                {aa.abbr}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {LEGEND.map(({ group, dot, label }) => (
                <span key={group} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-[10px] text-slate-400">{label}</span>
                </span>
              ))}
            </div>

            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className="inline-flex items-center justify-center rounded-lg bg-[#e31e24] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#c91b20] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {confirmLabel}
            </button>
          </div>

          <p className="mt-3 text-[10px] font-medium text-slate-400">
            {shortcutHint}
          </p>

        </div>
      </SheetContent>
    </Sheet>
  )
}
