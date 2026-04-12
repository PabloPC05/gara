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

const SCROLL_JUMP = 20

// Flechas de navegación del carrusel (izquierda)
const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
)
// Flechas de navegación del carrusel (derecha)
const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
)
// Icono de teclado
const KeyboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>
)

// Línea de cursor parpadeante estilo text-input
const CURSOR_BLINK_STYLE = {
  width: 2,
  height: 18,
  backgroundColor: '#3b82f6',
  borderRadius: 1,
  animation: 'fastabar-cursor-blink 1s step-end infinite',
}

/**
 * Fila de carrusel de aminoácidos para una proteína individual.
 * Componente interno reutilizado tanto en modo simple como comparación.
 *
 * cursorPos: número | null — posición del cursor de edición (entre aminoácidos)
 * onCursorPlace: (pos: number) => void — callback para colocar el cursor
 */
function SequenceCarouselRow({ proteinId, sequence, focusedSeqId, canSelect, onSelect, onDeselect, onApiReady, label, showNav, cursorPos, onCursorPlace }) {
  const [rowApi, setRowApi] = useState(null)

  const handleApi = useCallback((api) => {
    setRowApi(api)
    onApiReady?.(api)
  }, [onApiReady])

  const scrollRowBy = useCallback((jump) => {
    if (!rowApi) return
    const target = Math.max(
      0,
      Math.min(rowApi.scrollSnapList().length - 1, rowApi.selectedScrollSnap() + jump)
    )
    rowApi.scrollTo(target)
  }, [rowApi])

  const handleAAClick = useCallback((e, i, isSelected) => {
    // Colocar cursor según la mitad del botón clickeada
    if (onCursorPlace) {
      const rect = e.currentTarget.getBoundingClientRect()
      const isLeftHalf = (e.clientX - rect.left) < rect.width / 2
      onCursorPlace(isLeftHalf ? i : i + 1)
    }
    // Selección de residuo para visor 3D
    if (canSelect) {
      if (isSelected) onDeselect(proteinId)
      else onSelect(proteinId, i + 1)
    }
  }, [onCursorPlace, canSelect, proteinId, onSelect, onDeselect])

  return (
    <div className="flex flex-col">
      {label && (
        <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-400 px-3 pt-0.5 truncate">
          {label}
        </span>
      )}
      <div className="flex items-stretch overflow-hidden min-w-0">
        {showNav && (
          <button
            onClick={() => scrollRowBy(-SCROLL_JUMP)}
            className="w-6 shrink-0 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 transition-colors border-r border-zinc-200/50"
            aria-label="Anterior"
          >
            <ChevronLeft />
          </button>
        )}
        <Carousel
          setApi={handleApi}
          opts={{ align: "start", dragFree: true }}
          className="flex-1 min-w-0 h-7"
        >
          <CarouselContent className="ml-0 h-full items-center gap-1.5 px-3">
          {sequence.length === 0 ? (
            <CarouselItem className="basis-auto pl-0">
              <div
                className="h-[22px] flex items-center cursor-text"
                onClick={() => onCursorPlace?.(0)}
              >
                {cursorPos === 0 ? (
                  <span style={CURSOR_BLINK_STYLE} />
                ) : (
                  <span className="text-[11px] text-zinc-400 italic flex items-center">
                    Sin secuencia
                  </span>
                )}
              </div>
            </CarouselItem>
          ) : (
            <>
              {[...sequence].map((letter, i) => {
                const group = AA_GROUP_MAP[letter] ?? ''
                const colors = AA_GROUP_COLORS[group]
                const isSelected = focusedSeqId === i + 1
                const tooltipText = `${letter} · pos ${i + 1}`
                const hasCursorBefore = cursorPos === i
                const hasCursorAfter = i === sequence.length - 1 && cursorPos === sequence.length

                return (
                  <CarouselItem key={i} className="basis-auto pl-0 shrink-0">
                    <div className="relative flex items-center">
                      {/* Cursor antes de este aminoácido */}
                      {hasCursorBefore && (
                        <div
                          className="absolute z-10 pointer-events-none"
                          style={{ left: -4, top: '50%', transform: 'translateY(-50%)', ...CURSOR_BLINK_STYLE }}
                        />
                      )}
                      <TooltipProvider delayDuration={0}>
                        <Tooltip open={isSelected && canSelect}>
                          <TooltipTrigger asChild>
                            <button
                              data-selected={isSelected && canSelect ? "true" : "false"}
                              tabIndex={-1}
                              onClick={(e) => handleAAClick(e, i, isSelected)}
                              className={[
                                "w-[18px] h-[22px] flex items-center justify-center text-[10px] font-mono font-bold rounded-[3px] transition-all duration-100 shadow-sm",
                                onCursorPlace ? "cursor-text" : canSelect ? "cursor-pointer" : "cursor-default opacity-80"
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
                      {/* Cursor después del último aminoácido */}
                      {hasCursorAfter && (
                        <div
                          className="absolute z-10 pointer-events-none"
                          style={{ right: -4, top: '50%', transform: 'translateY(-50%)', ...CURSOR_BLINK_STYLE }}
                        />
                      )}
                    </div>
                  </CarouselItem>
                )
              })}
              {/* Zona clickeable al final para colocar cursor al final */}
              {onCursorPlace && (
                <CarouselItem className="basis-auto pl-0 shrink-0">
                  <div
                    className="w-4 h-[22px] cursor-text"
                    onClick={() => onCursorPlace(sequence.length)}
                  />
                </CarouselItem>
              )}
            </>
          )}
        </CarouselContent>
        </Carousel>
        {showNav && (
          <button
            onClick={() => scrollRowBy(SCROLL_JUMP)}
            className="w-6 shrink-0 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 transition-colors border-l border-zinc-200/50"
            aria-label="Siguiente"
          >
            <ChevronRight />
          </button>
        )}
      </div>
    </div>
  )
}

export function FastaBar() {
  const activeProteinId = useProteinStore((s) => s.activeProteinId)
  const proteinsById = useProteinStore((s) => s.proteinsById)
  const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds)
  const activeTab = useUIStore((s) => s.activeTab)
  const detailsPanelOpen = useUIStore((s) => s.detailsPanelOpen)
  const focusedResidueByProtein = useUIStore((s) => s.focusedResidueByProtein)
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
  const [cursorPos, setCursorPos] = useState(null) // null = sin cursor, number = posición entre aminoácidos
  const ignoreOpenRef = useRef(false)

  // Map de APIs de Embla: { [proteinId]: EmblaApi }
  const apisRef = useRef({})

  const protein = activeProteinId ? proteinsById[activeProteinId] : null
  const proteinSequence = protein?.sequence ?? ''

  // Proteínas válidas seleccionadas para comparación
  const validSelectedIds = selectedProteinIds.filter(id => {
    const p = proteinsById[id]
    return p && p.name
  })
  const isComparison = validSelectedIds.length >= 2
  const visibleCount = isComparison ? Math.min(validSelectedIds.length, 4) : 1

  // Solo se puede seleccionar un residuo si hay una proteína activa y no estamos en modo borrador
  const canSelect = !!activeProteinId && draftSequence.length === 0

  // Secuencia para el modo single / edición (solo proteína activa)
  const displaySequence = draftSequence.length > 0 ? draftSequence : proteinSequence
  const canProcess = isValidEntry(displaySequence)

  const handleSelect = useCallback((pid, seqId) => {
    setFocusedResidue(pid, { seqId })
  }, [setFocusedResidue])

  const handleDeselect = useCallback((pid) => {
    setFocusedResidue(pid, null)
  }, [setFocusedResidue])

  const clearAllFocusedResidues = useCallback(() => {
    selectedProteinIds.forEach(pid => setFocusedResidue(pid, null))
  }, [selectedProteinIds, setFocusedResidue])

  // Registrar/desregistrar APIs de carrusel por proteína
  const registerApi = useCallback((pid, api) => {
    if (api) apisRef.current[pid] = api
    else delete apisRef.current[pid]
  }, [])

  // Scroll de todos los carruseles (modo single) o noop (en comparación cada uno tiene sus propios botones)
  const scrollAllBy = useCallback((jump) => {
    Object.values(apisRef.current).forEach(api => {
      const target = Math.max(
        0,
        Math.min(api.scrollSnapList().length - 1, api.selectedScrollSnap() + jump)
      )
      api.scrollTo(target)
    })
  }, [])

  // Auto-scroll al residuo seleccionado o al cursor
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isComparison) {
        // En comparación: scroll cada carrusel a su residuo enfocado
        for (const pid of validSelectedIds) {
          const api = apisRef.current[pid]
          if (!api) continue
          const fr = focusedResidueByProtein[pid]
          if (fr?.seqId) api.scrollTo(fr.seqId - 1)
        }
      } else {
        // Modo single
        const api = apisRef.current[activeProteinId] ?? Object.values(apisRef.current)[0]
        if (!api) return
        // Prioridad: cursor > draft > residuo seleccionado
        if (cursorPos !== null) {
          api.scrollTo(Math.max(0, Math.min(cursorPos, displaySequence.length - 1)))
        } else if (draftSequence.length > 0) {
          api.scrollTo(displaySequence.length - 1)
        } else {
          const fr = activeProteinId ? focusedResidueByProtein[activeProteinId] : null
          if (fr?.seqId && canSelect) {
            api.scrollTo(fr.seqId - 1)
          }
        }
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [focusedResidueByProtein, validSelectedIds, isComparison, activeProteinId, draftSequence.length, displaySequence.length, canSelect, cursorPos])

  // Wheel handler: cada carrusel se mueve de forma independiente
  useEffect(() => {
    const apis = Object.values(apisRef.current)
    if (apis.length === 0) return

    const handlers = []
    apis.forEach(api => {
      const container = api.containerNode()
      if (!container) return
      const handleWheel = (e) => {
        e.preventDefault()
        const direction = Math.sign(e.deltaY || e.deltaX)
        if (direction !== 0) {
          const engine = api.internalEngine()
          engine.scrollBody.useBaseFriction().useDuration(0)
          engine.scrollTo.distance(direction * 40, false)
        }
      }
      container.addEventListener('wheel', handleWheel, { passive: false })
      handlers.push(() => container.removeEventListener('wheel', handleWheel))
    })

    return () => handlers.forEach(cleanup => cleanup())
  }, [validSelectedIds.join(','), isComparison])

  // Reset cursor al cambiar de proteína
  useEffect(() => {
    setCursorPos(null)
  }, [activeProteinId])

  // Navegación con flechas: cursor tiene prioridad, luego residuo
  const handleKeyDownCapture = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

    // Movimiento del cursor de edición (prioridad sobre selección de residuo)
    if (cursorPos !== null && !isComparison) {
      e.preventDefault()
      e.stopPropagation()
      const seqLen = displaySequence.length
      if (e.key === 'ArrowLeft') {
        setCursorPos(prev => Math.max(0, prev - 1))
      } else {
        setCursorPos(prev => Math.min(seqLen, prev + 1))
      }
      // Auto-scroll al cursor
      const api = apisRef.current[activeProteinId] ?? Object.values(apisRef.current)[0]
      if (api) {
        const targetIdx = e.key === 'ArrowLeft'
          ? Math.max(0, cursorPos - 1)
          : Math.min(displaySequence.length - 1, cursorPos)
        api.scrollTo(targetIdx)
      }
      return
    }

    if (!canSelect) return

    if (isComparison) {
      // Buscar qué proteína tiene un residuo enfocado
      let activePid = null
      let focusedSeqId = null
      for (const pid of validSelectedIds) {
        if (focusedResidueByProtein[pid]?.seqId) {
          activePid = pid
          focusedSeqId = focusedResidueByProtein[pid].seqId
          break
        }
      }
      if (!activePid || !focusedSeqId) return

      const p = proteinsById[activePid]
      if (!p?.sequence) return

      e.preventDefault()
      e.stopPropagation()
      const next = e.key === 'ArrowLeft'
        ? Math.max(1, focusedSeqId - 1)
        : Math.min(p.sequence.length, focusedSeqId + 1)
      if (next !== focusedSeqId) setFocusedResidue(activePid, { seqId: next })
    } else {
      // Modo single: navegar sobre la proteína activa
      if (!activeProteinId || !displaySequence) return
      const fr = focusedResidueByProtein[activeProteinId]
      const currentId = fr?.seqId || 0
      e.preventDefault()
      e.stopPropagation()
      const next = e.key === 'ArrowLeft'
        ? Math.max(1, currentId - 1)
        : Math.min(displaySequence.length, currentId + 1)
      if (next !== currentId) setFocusedResidue(activeProteinId, { seqId: next })
    }
  }

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    if (isComparison) return // En comparación no se edita la secuencia directamente

    // Escape: quitar cursor
    if (e.key === 'Escape' && cursorPos !== null) {
      e.preventDefault()
      setCursorPos(null)
      return
    }

    const key = e.key.toUpperCase()
    const validAA = 'GAVLIMFWPSTCYNQDEKRH'

    if (validAA.includes(key) && key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (cursorPos !== null) {
        // Insertar en la posición del cursor
        const base = draftSequence.length > 0 ? draftSequence : proteinSequence
        setDraftSequence(base.slice(0, cursorPos) + key + base.slice(cursorPos))
        setCursorPos(cursorPos + 1)
      } else {
        // Añadir al final (comportamiento original)
        if (draftSequence.length === 0 && proteinSequence.length > 0) {
          setDraftSequence(proteinSequence + key)
        } else {
          appendLetter(key)
        }
      }
      clearAllFocusedResidues()
      return
    }

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (cursorPos !== null) {
        // Eliminar antes del cursor
        if (cursorPos > 0) {
          const base = draftSequence.length > 0 ? draftSequence : proteinSequence
          setDraftSequence(base.slice(0, cursorPos - 1) + base.slice(cursorPos))
          setCursorPos(cursorPos - 1)
        }
      } else {
        // Eliminar del final (comportamiento original)
        if (draftSequence.length === 0 && proteinSequence.length > 0) {
          setDraftSequence(proteinSequence.slice(0, -1))
        } else {
          deleteLastLetter()
        }
      }
      clearAllFocusedResidues()
      return
    }

    if (e.key === 'Delete' && cursorPos !== null) {
      e.preventDefault()
      const base = draftSequence.length > 0 ? draftSequence : proteinSequence
      if (cursorPos < base.length) {
        setDraftSequence(base.slice(0, cursorPos) + base.slice(cursorPos + 1))
      }
      clearAllFocusedResidues()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (canProcess && draftSequence.length > 0) {
        handleConfirmPicker()
        setCursorPos(null)
      }
    }

    // Home / End para mover cursor al inicio / final
    if (e.key === 'Home') {
      e.preventDefault()
      setCursorPos(0)
      return
    }
    if (e.key === 'End') {
      e.preventDefault()
      setCursorPos(displaySequence.length)
      return
    }
  }

  // Funciones cursor-aware para el AminoAcidPicker
  const handlePickerAppendLetter = useCallback((letter) => {
    if (cursorPos !== null) {
      const base = draftSequence.length > 0 ? draftSequence : proteinSequence
      setDraftSequence(base.slice(0, cursorPos) + letter + base.slice(cursorPos))
      setCursorPos(prev => prev + 1)
    } else {
      if (draftSequence.length === 0 && proteinSequence.length > 0) {
        setDraftSequence(proteinSequence + letter)
      } else {
        appendLetter(letter)
      }
    }
  }, [cursorPos, draftSequence, proteinSequence, setDraftSequence, appendLetter])

  const handlePickerDeleteLast = useCallback(() => {
    if (cursorPos !== null && cursorPos > 0) {
      const base = draftSequence.length > 0 ? draftSequence : proteinSequence
      setDraftSequence(base.slice(0, cursorPos - 1) + base.slice(cursorPos))
      setCursorPos(prev => prev - 1)
    } else if (cursorPos === null) {
      if (draftSequence.length === 0 && proteinSequence.length > 0) {
        setDraftSequence(proteinSequence.slice(0, -1))
      } else {
        deleteLastLetter()
      }
    }
  }, [cursorPos, draftSequence, proteinSequence, setDraftSequence, deleteLastLetter])

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

  const showComparison = isComparison && draftSequence.length === 0

  return (
    <>
      {/* FastaBar — full-width, no margin hacks. Parent flex handles sidebar spacing. */}
      <div
        data-slot="fasta-bar"
        data-testid="fasta-bar"
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDownCapture={handleKeyDownCapture}
        onKeyDown={handleKeyDown}
        style={{
          maxWidth: 'calc(100% - var(--left-sidebar-width, 22rem) - var(--details-sidebar-width, 26rem))',
          marginLeft: 'var(--left-sidebar-width, 22rem)',
        }}
        className={[
          'outline-none shrink-0 flex overflow-hidden min-w-0',
          'border-b',
          focused
            ? 'bg-white/95 border-zinc-400'
            : 'bg-[#e4e4e7]/95 border-zinc-300',
        ].join(' ')}
      >
        {/* Sequence content area */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 py-1 px-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
              {draftSequence.length > 0
                ? 'Editando Borrador'
                : showComparison
                  ? 'Comparación'
                  : 'Secuencia'}
            </span>
            {!showComparison && displaySequence.length > 0 && (
              <span className="text-[9px] text-zinc-400">
                {displaySequence.length} aa
              </span>
            )}
          </div>

          {showComparison ? (
            <div className="bg-black/5 border-y border-zinc-200/50 flex flex-col pb-1.5 overflow-hidden min-w-0">
              {validSelectedIds.slice(0, 2).map((pid) => {
                const p = proteinsById[pid]
                if (!p) return null
                const fr = focusedResidueByProtein[pid]
                return (
                  <SequenceCarouselRow
                    key={pid}
                    proteinId={pid}
                    sequence={p.sequence ?? ''}
                    focusedSeqId={fr?.seqId ?? null}
                    canSelect={canSelect}
                    onSelect={handleSelect}
                    onDeselect={handleDeselect}
                    onApiReady={(api) => registerApi(pid, api)}
                    label={p.name || pid}
                    showNav
                  />
                )
              })}
            </div>
          ) : (
            <div className="flex items-center bg-black/5 border-y border-zinc-200/50 overflow-hidden min-w-0">
              <button
                onClick={() => scrollAllBy(-SCROLL_JUMP)}
                className="self-stretch w-8 shrink-0 flex items-center justify-center text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 transition-colors border-r border-zinc-200/50"
                aria-label="Anterior"
              >
                <ChevronLeft />
              </button>

              <div className="flex-1 min-w-0 overflow-hidden">
                <SequenceCarouselRow
                  proteinId={activeProteinId}
                  sequence={displaySequence}
                  focusedSeqId={activeProteinId ? (focusedResidueByProtein[activeProteinId]?.seqId ?? null) : null}
                  canSelect={canSelect}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                  onApiReady={(api) => registerApi(activeProteinId ?? '_single', api)}
                  cursorPos={cursorPos}
                  onCursorPlace={setCursorPos}
                />
              </div>

              <button
                onClick={() => scrollAllBy(SCROLL_JUMP)}
                className="self-stretch w-10 shrink-0 flex items-center justify-center text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 transition-colors border-l border-zinc-200/50"
                aria-label="Siguiente"
              >
                <ChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* Keyboard toggle button — inside the flex row, no absolute positioning */}
        <button
          onClick={toggleKeyboard}
          className={[
            'shrink-0 w-10 flex items-center justify-center border-l transition-colors',
            isPickerOpen
              ? 'text-zinc-600 bg-zinc-200/60 hover:bg-zinc-300/60'
              : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-300/40',
          ].join(' ')}
          title={isPickerOpen ? 'Cerrar teclado' : 'Abrir teclado de aminoácidos'}
        >
          <KeyboardIcon />
        </button>
      </div>

      <AminoAcidPicker
        open={isPickerOpen}
        onOpenChange={handleSheetOpenChange}
        onAppendLetter={handlePickerAppendLetter}
        onDeleteLast={handlePickerDeleteLast}
        onClear={() => { clearDraft(); setCursorPos(null) }}
        onConfirm={() => { handleConfirmPicker(); setCursorPos(null) }}
        canConfirm={canProcess}
      />

      <style>{`
        @keyframes fastabar-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
