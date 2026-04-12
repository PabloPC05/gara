import React, { useState } from 'react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"

export function VisionMenu() {
  const [zoom, setZoom] = useState(100)
  
  const handleZoomIn = (e) => {
    e.preventDefault()
    setZoom(prev => Math.min(prev + 10, 200))
  }
  
  const handleZoomOut = (e) => {
    e.preventDefault()
    setZoom(prev => Math.max(prev - 10, 10))
  }

  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer"

  return (
    <MenubarMenu>
      <MenubarTrigger>Visión</MenubarTrigger>
      <MenubarContent className="w-64 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">
        
        {/* Zoom Controls */}
        <MenubarLabel className="px-2 py-1.5 flex items-center justify-between text-slate-300">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lente</span>
          <div className="flex items-center gap-2 bg-black rounded-lg border border-white/10 p-0.5">
            <button 
              onClick={handleZoomOut}
              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
            </button>
            <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
            <button 
              onClick={handleZoomIn}
              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          </div>
        </MenubarLabel>
        
        <MenubarSeparator className="bg-white/10 mx-1" />
        
        {/* Camera Types */}
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Proyección de Cámara</MenubarLabel>
        <MenubarItem className={itemClass}>Perspectiva (Realista)</MenubarItem>
        <MenubarItem className={itemClass}>Ortográfica (Plana)</MenubarItem>
        <MenubarItem className={itemClass}>Estereoscópica (Gafas 3D)</MenubarItem>

        <MenubarSeparator className="bg-white/10 mx-1" />

        {/* Visual Aids */}
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Ayudas Visuales</MenubarLabel>
        <MenubarItem className={itemClass}>Mostrar Ejes de Coordenadas</MenubarItem>
        <MenubarItem className={itemClass}>Cuadrícula de Referencia</MenubarItem>
        <MenubarItem className={itemClass}>Contornos de Alta Visibilidad</MenubarItem>
        <MenubarItem className={itemClass}>Sombras de Contacto (SSAO)</MenubarItem>

        <MenubarSeparator className="bg-white/10 mx-1" />

        {/* Advanced Clipping */}
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Sección Transversal</MenubarLabel>
        <MenubarItem className={itemClass}>Plano de Recorte Z (Frontal)</MenubarItem>
        <MenubarItem className={itemClass}>Plano de Recorte Y (Superior)</MenubarItem>
        <MenubarItem className={itemClass}>Invertir Recorte</MenubarItem>
        
      </MenubarContent>
    </MenubarMenu>
  )
}
