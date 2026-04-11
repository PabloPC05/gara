import { useState, useRef, useEffect, useCallback } from 'react'

import { useProteinStore } from '@/stores/useProteinStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAminoAcidBuilder } from '@/hooks/useAminoAcidBuilder'
import { isValidEntry } from '@/hooks/useCommandEntries'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AminoAcidPicker } from './sidebar/AminoAcidPicker'

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
  const detailsPanelOpen = useUIStore((s) => s.detailsPanelOpen)
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

  const [expanded, setExpanded] = useState(false)
  const [focused, setFocused] = useState(false)
  const ignoreOpenRef = useRef(false)
  const sequenceContainerRef = useRef(null)

  const protein = activeProteinId ? proteinsById[activeProteinId] : null
  const proteinSequence = protein?.sequence ?? ''

  const isEditing = focused || isPickerOpen || draftSequence.length > 0
  const inputValue = isEditing ? draftSequence : proteinSequence
  const canProcess = isEditing ? isValidEntry(draftSequence) : isValidEntry(proteinSequence)
  const selectedSeqId =
    focusedResidue?.proteinId && focusedResidue.proteinId !== activeProteinId
      ? null
      : focusedResidue?.seqId ?? null

  const focusSeqId = useCallback((seqId) => {
    if (!Number.isFinite(seqId)) return
    if (activeProteinId) {
      setFocusedResidue({ proteinId: activeProteinId, seqId })
      return
    }
    setFocusedResidue({ seqId })
  }, [activeProteinId, setFocusedResidue])

  const clearFocusedResidue = useCallback(() => {
    setFocusedResidue(null)
  }, [setFocusedResidue])

  // Navegación por teclado (←/→) entre residuos, no cíclica
  useEffect(() => {
    if (isEditing || !proteinSequence) return
    const handleKeyDown = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (!focusedResidue) return
      e.preventDefault()
      const next = e.key === 'ArrowLeft'
        ? Math.max(1, focusedResidue.seqId - 1)
        : Math.min(proteinSequence.length, focusedResidue.seqId + 1)
      if (next !== focusedResidue.seqId) focusSeqId(next)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, proteinSequence, focusedResidue, focusSeqId])

  // Auto-scroll al residuo seleccionado en la barra
  useEffect(() => {
    if (!focusedResidue || !sequenceContainerRef.current) return
    const el = sequenceContainerRef.current.querySelector('[data-selected="true"]')
    el?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })
  }, [focusedResidue])

  // Scroll horizontal con rueda del ratón
  useEffect(() => {
    const el = sequenceContainerRef.current
    if (!el) return

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [isEditing, proteinSequence])

  const leftOpen = activeTab !== null
  const hasProtein = !!activeProteinId

  const leftVal = leftOpen ? 'var(--sidebar-width, 22rem)' : '0rem'
  const rightVal = detailsPanelOpen
    ? 'var(--details-sidebar-width, 26rem)'
    : hasProtein
      ? '2.5rem'
      : '0rem'

  const toggleKeyboard = () => {
    if (isPickerOpen) {
      ignoreOpenRef.current = true
      handlePickerOpenChange(false)
      setExpanded(false)
      setTimeout(() => { ignoreOpenRef.current = false }, 300)
    } else {
      handlePickerOpenChange(true)
      setExpanded(true)
    }
  }

  const handleSheetOpenChange = (next) => {
    if (next && ignoreOpenRef.current) return
    handlePickerOpenChange(next)
  }

  const handleFocus = () => {
    setFocused(true)
    clearFocusedResidue()
    if (!draftSequence && proteinSequence) {
      setDraftSequence(proteinSequence)
    }
  }

  const handleBlur = () => {
    setFocused(false)
  }

  const handleChange = (e) => {
    setDraftSequence(e.target.value.toUpperCase().replace(/[^GAVLIMFWPSTCYNQDEKRH]/g, ''))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canProcess) {
        handleConfirmPicker()
      }
    }
  }

  const handleScrollLeft = () => {
    if (sequenceContainerRef.current) {
      sequenceContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const handleScrollRight = () => {
    if (sequenceContainerRef.current) {
      sequenceContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  return (
    <>
      <div
        data-slot="fasta-bar"
        className={[
          'relative z-10',
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
        <div className="flex items-stretch">
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 px-3 pt-1.5 pb-0">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                {focused ? 'Editando' : 'Secuencia'}
              </span>
              {inputValue.length > 0 && (
                <span className="text-[9px] text-zinc-400">
                  {inputValue.length} aa
                </span>
              )}
            </div>

            {!isEditing && proteinSequence ? (
              /* Vista de residuos clicables (modo lectura) */
              <div className="relative group flex items-center w-full">
                <button
                  onClick={handleScrollLeft}
                  className="absolute left-0 z-10 h-[calc(100%-8px)] px-1.5 bg-gradient-to-r from-[#e4e4e7] via-[#e4e4e7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-zinc-500 hover:text-zinc-800"
                  aria-label="Scroll left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>

                <div
                  ref={sequenceContainerRef}
                  className="overflow-x-auto overflow-y-hidden w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{ maxHeight: '36px' }}
                >
                  <div className="flex items-center gap-1.5 px-6 pb-1.5 pt-0.5 w-max select-none">
                    {[...proteinSequence].map((letter, i) => {
                      const group = AA_GROUP_MAP[letter] ?? ''
                      const colors = AA_GROUP_COLORS[group]
                      const isSelected = selectedSeqId === i + 1
                      const tooltipText = `${letter} · pos ${i + 1}`

                      if (isSelected) {
                        return (
                          <TooltipProvider key={i} delayDuration={0}>
                            <Tooltip open>
                              <TooltipTrigger asChild>
                                <button
                                  data-selected="true"
                                  title={tooltipText}
                                  onClick={() => focusSeqId(i + 1)}
                                  className="w-[16px] h-[20px] flex items-center justify-center text-[10px] font-mono font-bold rounded-[2px] transition-all duration-100 cursor-pointer"
                                  style={{
                                    backgroundColor: colors.sel,
                                    color: colors.text,
                                    outline: `2px solid ${colors.ring}`,
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
                        )
                      }

                      return (
                        <button
                          key={i}
                          title={tooltipText}
                          onClick={() => focusSeqId(i + 1)}
                          className="w-[16px] h-[20px] flex items-center justify-center text-[10px] font-mono font-bold rounded-[2px] transition-all duration-100 cursor-pointer"
                          style={{
                            backgroundColor: colors.base,
                            color: colors.text,
                            outline: 'none',
                            outlineOffset: '1px',
                          }}
                        >
                          {letter}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={handleScrollRight}
                  className="absolute right-0 z-10 h-[calc(100%-8px)] px-1.5 bg-gradient-to-l from-[#e4e4e7] via-[#e4e4e7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-zinc-500 hover:text-zinc-800"
                  aria-label="Scroll right"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            ) : (
              /* Vista de edición (textarea) */
              <div
                className="overflow-y-auto transition-all duration-300 ease-in-out"
                style={{ maxHeight: expanded ? '50vh' : '36px' }}
              >
                <textarea
                  value={inputValue}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Introduce una secuencia de aminoácidos"
                  spellCheck={false}
                  className={[
                    'w-full resize-none bg-transparent px-3 pb-1.5 pt-0.5 text-[11px] font-mono leading-relaxed',
                    'whitespace-pre-wrap break-all outline-none select-text',
                    focused ? 'text-zinc-800' : 'text-zinc-600',
                    !focused && !inputValue ? 'italic' : '',
                  ].join(' ')}
                  style={{ minHeight: '20px' }}
                  rows={1}
                />
              </div>
            )}
          </div>

          <button
            onClick={toggleKeyboard}
            className={[
              'shrink-0 flex items-center justify-center w-9 border-l transition-colors',
              isPickerOpen
                ? 'text-zinc-600 bg-zinc-200/60 border-zinc-400 hover:bg-zinc-300/60'
                : 'text-zinc-400 border-zinc-300/60 hover:text-zinc-600 hover:bg-zinc-300/40',
            ].join(' ')}
            title={isPickerOpen ? 'Cerrar teclado' : 'Abrir teclado de aminoácidos'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>
          </button>
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
