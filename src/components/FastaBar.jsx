import { useState, useRef, useEffect, useCallback } from 'react'

import { useProteinStore } from '@/stores/useProteinStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAminoAcidBuilder } from '@/hooks/useAminoAcidBuilder'
import { isValidEntry } from '@/hooks/useCommandEntries'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AminoAcidPicker } from './sidebar/AminoAcidPicker'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

// Mapa de letra → grupo bioquímico
const AA_GROUP_MAP = {
  G:'np', A:'np', V:'np', L:'np', I:'np', M:'np', F:'np', W:'np', P:'np',
  S:'po', T:'po', C:'po', Y:'po', N:'po', Q:'po',
  D:'ac', E:'ac',
  K:'ba', R:'ba', H:'ba',
}
// Colores por grupo (normal, hover, seleccionado)
const AA_GROUP_COLORS = {
  np: { base: '#fef3c7', text: '#92400e', sel: '#fbbf24', ring: '#f59e0b' },
  po: { base: '#e0f2fe', text: '#0c4a6e', sel: '#38bdf8', ring: '#0ea5e9' },
  ac: { base: '#fee2e2', text: '#7f1d1d', sel: '#f87171', ring: '#ef4444' },
  ba: { base: '#e0e7ff', text: '#1e1b4b', sel: '#818cf8', ring: '#6366f1' },
  '':  { base: '#f1f5f9', text: '#475569', sel: '#94a3b8', ring: '#64748b' },
}

export function FastaBar() {
  const activeProteinId = useProteinStore((s) => s.activeProteinId)
  const proteinsById = useProteinStore((s) => s.proteinsById)
  const activeTab = useUIStore((s) => s.activeTab)
  const focusedResidue = useUIStore((s) => s.focusedResidue)
  const setFocusedResidue = useUIStore((s) => s.setFocusedResidue)

  const {
    isPickerOpen,
    draftSequence,
    handlePickerOpenChange,
    handleConfirmPicker,
    appendLetter,
    deleteLastLetter,
    clearDraft,
    setDraftSequence,
  } = useAminoAcidBuilder()

  const [focused, setFocused] = useState(false)
  const [api, setApi] = useState(null)
  const ignoreOpenRef = useRef(false)
  const SCROLL_JUMP = 20

  const protein = activeProteinId ? proteinsById[activeProteinId] : null
  const proteinSequence = protein?.sequence ?? ''
  // Solo se puede seleccionar un residuo si hay una proteína cargada y no estamos en modo borrador
  const canSelect = !!activeProteinId && draftSequence.length === 0

  // Determinamos la secuencia a mostrar: borrador si existe, si no la de la proteína
  const displaySequence = draftSequence.length > 0 ? draftSequence : proteinSequence
  const canProcess = isValidEntry(displaySequence)
  const selectedSeqId =
    focusedResidue?.proteinId && focusedResidue.proteinId !== activeProteinId
      ? null
      : focusedResidue?.seqId ?? null

  const focusSeqId = useCallback((seqId) => {
    if (!Number.isFinite(seqId) || !activeProteinId) return
    setFocusedResidue({ proteinId: activeProteinId, seqId })
  }, [activeProteinId, setFocusedResidue])

  const clearFocusedResidue = useCallback(() => {
    setFocusedResidue(null)
  }, [setFocusedResidue])

  // Auto-scroll al residuo seleccionado o al final al escribir usando el API de Embla
  useEffect(() => {
    if (!api) return

    const timer = setTimeout(() => {
      if (draftSequence.length > 0) {
        api.scrollTo(displaySequence.length - 1)
      } else if (selectedSeqId && canSelect) {
        api.scrollTo(selectedSeqId - 1)
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [api, selectedSeqId, displaySequence.length, draftSequence.length, canSelect])

  useEffect(() => {
    if (!api) return
    const container = api.containerNode()
    if (!container) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = Math.sign(e.deltaY || e.deltaX) * SCROLL_JUMP
      api.scrollBy(delta)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [api])

  const leftOpen = activeTab !== null

  const leftVal = leftOpen ? 'var(--sidebar-width, 22rem)' : '0rem'
  const rightVal = 'var(--details-width, 40px)'

  const toggleKeyboard = (e) => {
    e.stopPropagation()
    if (isPickerOpen) {
      ignoreOpenRef.current = true
      handlePickerOpenChange(false)
      setTimeout(() => { ignoreOpenRef.current = false }, 300)
    } else {
      handlePickerOpenChange(true)
    }
  }

  const handleSheetOpenChange = (next) => {
    if (next && ignoreOpenRef.current) return
    handlePickerOpenChange(next)
  }

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    const key = e.key.toUpperCase()
    const validAA = 'GAVLIMFWPSTCYNQDEKRH'

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (!displaySequence || !canSelect) return
      e.preventDefault()
      const currentId = selectedSeqId || 0
      const next = e.key === 'ArrowLeft'
        ? Math.max(1, currentId - 1)
        : Math.min(displaySequence.length, currentId + 1)
      if (next !== currentId) focusSeqId(next)
      return
    }

    if (validAA.includes(key) && key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (draftSequence.length === 0 && proteinSequence.length > 0) {
        setDraftSequence(proteinSequence + key)
      } else {
        appendLetter(key)
      }
      clearFocusedResidue()
      return
    }

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (draftSequence.length === 0 && proteinSequence.length > 0) {
        setDraftSequence(proteinSequence.slice(0, -1))
      } else {
        deleteLastLetter()
      }
      clearFocusedResidue()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (canProcess && draftSequence.length > 0) {
        handleConfirmPicker()
      }
    }
  }

  return (
    <>
      <div
        data-slot="fasta-bar"
        data-testid="fasta-bar"
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        className={[
          'relative z-10 outline-none h-14',
          'border-b transition-all duration-200',
          focused
            ? 'bg-white/95 border-zinc-400'
            : 'bg-[#e4e4e7]/95 border-zinc-300',
        ].join(' ')}
        style={{
          marginLeft: leftVal,
          marginRight: rightVal,
          transition: 'margin-left 0.3s ease-in-out, margin-right 0.3s ease-in-out',
        }}
      >
        <div className="flex h-full w-full">
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 pb-1 px-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                {draftSequence.length > 0 ? 'Editando Borrador' : 'Secuencia'}
              </span>
              {displaySequence.length > 0 && (
                <span className="text-[9px] text-zinc-400">
                  {displaySequence.length} aa
                </span>
              )}
            </div>

            <div className="flex items-center w-full bg-black/5 border-y border-zinc-200/50">
              <Carousel
                setApi={setApi}
                opts={{ align: "start", dragFree: true }}
                className="flex-1 flex items-stretch min-w-0 h-8"
              >
                <button
                  onClick={() => api?.scrollBy(-SCROLL_JUMP)}
                  className="static translate-y-0 h-full w-8 rounded-none border-r border-zinc-200/50 hover:bg-zinc-200/50 shrink-0 flex items-center justify-center text-zinc-500 hover:text-zinc-700 transition-colors"
                  aria-label="Anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                
                <CarouselContent className="ml-0 flex-1 w-full h-full items-center gap-1.5 px-3">
                  {displaySequence.length === 0 ? (
                    <CarouselItem className="basis-auto pl-0">
                      <span className="text-[11px] text-zinc-400 italic h-full flex items-center">
                        Haz clic aquí para empezar a escribir...
                      </span>
                    </CarouselItem>
                  ) : (
                    [...displaySequence].map((letter, i) => {
                      const group = AA_GROUP_MAP[letter] ?? ''
                      const colors = AA_GROUP_COLORS[group]
                      const isSelected = selectedSeqId === i + 1
                      const tooltipText = `${letter} · pos ${i + 1}`

                      return (
                        <CarouselItem key={i} className="basis-auto pl-0 shrink-0">
                          <TooltipProvider delayDuration={0}>
                            <Tooltip open={isSelected && canSelect}>
                              <TooltipTrigger asChild>
                                <button
                                  data-selected={isSelected && canSelect ? "true" : "false"}
                                  tabIndex={-1}
                                  onClick={canSelect ? () => focusSeqId(i + 1) : undefined}
                                  className={[
                                    "w-[18px] h-[22px] flex items-center justify-center text-[10px] font-mono font-bold rounded-[3px] transition-all duration-100 shadow-sm",
                                    canSelect ? "cursor-pointer" : "cursor-default opacity-80"
                                  ].join(' ')}
                                  style={{
                                    backgroundColor: (isSelected && canSelect) ? colors.sel : colors.base,
                                    color: colors.text,
                                    outline: (isSelected && canSelect) ? `2px solid ${colors.ring}` : 'none',
                                    outlineOffset: '1px',
                                  }}
                                >
                                  {letter}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6} className="text-[10px] font-medium">
                                {tooltipText}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CarouselItem>
                      )
                    })
                  )}
                </CarouselContent>

                <button
                  onClick={() => api?.scrollBy(SCROLL_JUMP)}
                  className="static translate-y-0 h-full w-10 rounded-none border-l border-zinc-200/50 hover:bg-zinc-200/50 shrink-0 flex items-center justify-center text-zinc-500 hover:text-zinc-700 transition-colors"
                  aria-label="Siguiente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </Carousel>
              
              <button
                onClick={toggleKeyboard}
                className={[
                  'shrink-0 flex items-center justify-center w-10 h-8 border-l border-zinc-200/50 transition-colors rounded-none',
                  isPickerOpen
                    ? 'text-zinc-600 bg-zinc-200/60 hover:bg-zinc-300/60'
                    : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-300/40',
                ].join(' ')}
                title={isPickerOpen ? 'Cerrar teclado' : 'Abrir teclado de aminoácidos'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AminoAcidPicker
        open={isPickerOpen}
        onOpenChange={handleSheetOpenChange}
        onAppendLetter={appendLetter}
        onDeleteLast={deleteLastLetter}
        onClear={clearDraft}
        onConfirm={handleConfirmPicker}
        canConfirm={canProcess}
      />
    </>
  )
}
