import React from 'react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"
import useAnalysisStore from '../../stores/useAnalysisStore'

export function ToolsMenu() {
  const mode     = useAnalysisStore((s) => s.mode)
  const toggleMode = useAnalysisStore((s) => s.toggleMode)
  const clearAll = useAnalysisStore((s) => s.clearAll)

  // ── Clases reutilizables ───────────────────────────────────────────────────
  const base = "text-xs rounded-lg px-2 py-1.5 cursor-pointer flex items-center gap-2"

  // Ítem normal (interactivo)
  const itemClass = `${base} text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white`

  // Ítem activo (modo encendido)
  const activeClass = `${base} text-sky-300 bg-sky-500/15 ring-1 ring-sky-500/30 hover:bg-sky-500/20 focus:bg-sky-500/20`

  // Ítem deshabilitado — no responde a clics, visualmente apagado
  const disabledClass = `${base} text-slate-600 opacity-60 cursor-default pointer-events-none select-none`

  // Badge "Próximamente"
  const badge = (
    <span className="ml-auto text-[9px] font-semibold uppercase tracking-widest text-slate-600">
      Próximamente
    </span>
  )

  // Punto pulsante de modo activo
  const activeDot = (
    <span className="ml-auto flex items-center gap-1 text-sky-400 text-[10px] font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
      activo
    </span>
  )

  return (
    <MenubarMenu>
      {/* El trigger se colorea cuando hay un modo activo */}
      <MenubarTrigger className={mode ? 'text-sky-400' : ''}>
        Análisis{mode && <span className="ml-1 text-sky-400">●</span>}
      </MenubarTrigger>

      <MenubarContent className="w-80 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">

        {/* ── Mediciones ────────────────────────────────────────────────── */}
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Mediciones
        </MenubarLabel>

        {/* REAL: Medir Distancias */}
        <MenubarItem
          className={mode === 'distance' ? activeClass : itemClass}
          onClick={() => toggleMode('distance')}
        >
          <span>📏</span>
          Medir Distancias
          {mode === 'distance' ? activeDot : null}
        </MenubarItem>

        {/* DESHABILITADO */}
        <MenubarItem className={disabledClass}>
          Medir Ángulos
          {badge}
        </MenubarItem>
        <MenubarItem className={disabledClass}>
          Ángulos Diedros (Ramachandran)
          {badge}
        </MenubarItem>

        <MenubarSeparator className="bg-white/10 mx-1 my-1" />

        {/* ── Interacciones ──────────────────────────────────────────────── */}
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Interacciones
        </MenubarLabel>

        {/* REAL: Puentes de Hidrógeno */}
        <MenubarItem
          className={mode === 'hbonds' ? activeClass : itemClass}
          onClick={() => toggleMode('hbonds')}
        >
          <span>🔗</span>
          Detectar Puentes de Hidrógeno
          {mode === 'hbonds' ? activeDot : null}
        </MenubarItem>

        {/* DESHABILITADOS */}
        <MenubarItem className={disabledClass}>
          Interacciones Pi-Pi / Cation-Pi
          {badge}
        </MenubarItem>
        <MenubarItem className={disabledClass}>
          Calcular SASA
          {badge}
        </MenubarItem>

        <MenubarSeparator className="bg-white/10 mx-1 my-1" />

        {/* ── Alineamiento ───────────────────────────────────────────────── */}
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Alineamiento
        </MenubarLabel>
        <MenubarItem className={disabledClass}>
          Superponer Estructuras (RMSD)
          {badge}
        </MenubarItem>
        <MenubarItem className={disabledClass}>
          Alineamiento de Secuencias
          {badge}
        </MenubarItem>

        <MenubarSeparator className="bg-white/10 mx-1 my-1" />

        {/* ── Predicciones / Modelado ────────────────────────────────────── */}
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Predicciones / Modelado
        </MenubarLabel>
        <MenubarItem className={disabledClass}>
          Potencial Electroestático (APBS)
          {badge}
        </MenubarItem>
        <MenubarItem className={disabledClass}>
          Mutagénesis In-silico
          {badge}
        </MenubarItem>

        {/* ── Limpiar análisis (solo visible si hay modo activo) ─────────── */}
        {mode && (
          <>
            <MenubarSeparator className="bg-white/10 mx-1 my-1" />
            <MenubarItem
              className={`${base} text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300 focus:text-red-300`}
              onClick={clearAll}
            >
              <span>🗑️</span>
              Limpiar Análisis
            </MenubarItem>
          </>
        )}

        {/* SECCIÓN "MODO DE SELECCIÓN" ELIMINADA — era misleading.
            La selección ya funciona vía hover/click en el visor directamente. */}

      </MenubarContent>
    </MenubarMenu>
  )
}
