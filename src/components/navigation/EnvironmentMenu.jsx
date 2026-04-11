import React from 'react'
import { Check } from 'lucide-react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"
import { useUIStore } from '../../stores/useUIStore'

export function EnvironmentMenu() {
  const sceneBackground      = useUIStore((s) => s.viewerBackground)
  const setSceneBackground   = useUIStore((s) => s.setViewerBackground)
  const viewerLighting       = useUIStore((s) => s.viewerLighting)
  const setViewerLighting    = useUIStore((s) => s.setViewerLighting)
  
  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer flex justify-between items-center"

  return (
    <MenubarMenu>
      <MenubarTrigger>Entorno</MenubarTrigger>
      <MenubarContent className="w-[360px] bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Fondos</MenubarLabel>
        <MenubarItem 
          className={itemClass}
          onClick={() => setSceneBackground('#ffffff')}
        >
          <span>Fondo Claro (Default)</span>
          {sceneBackground === '#ffffff' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
        </MenubarItem>
        <MenubarItem 
          className={itemClass}
          onClick={() => setSceneBackground('#000000')}
        >
          <span>Fondo Oscuro</span>
          {sceneBackground === '#000000' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
        </MenubarItem>
        
        <MenubarSeparator className="bg-white/10 mx-1 my-1" />
        
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Iluminación</MenubarLabel>
        <MenubarItem className={itemClass} onClick={() => setViewerLighting('studio')}>
          <span>Iluminación de Estudio (Sombras suaves)</span>
          {viewerLighting === 'studio' && <Check className="h-3 w-3 text-blue-400 shrink-0" />}
        </MenubarItem>
        <MenubarItem className={itemClass} onClick={() => setViewerLighting('flat')}>
          <span>Iluminación Plana (Sin sombras, mejor rendimiento)</span>
          {viewerLighting === 'flat' && <Check className="h-3 w-3 text-blue-400 shrink-0" />}
        </MenubarItem>
        <MenubarItem className={itemClass} onClick={() => setViewerLighting('ao')}>
          <span>Ambient Occlusion (SSAO)</span>
          {viewerLighting === 'ao' && <Check className="h-3 w-3 text-blue-400 shrink-0" />}
        </MenubarItem>
        
        <MenubarSeparator className="bg-white/10 mx-1 my-1" />
        
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Efectos de Cámara</MenubarLabel>
        <MenubarItem className={itemClass}>Profundidad de Campo (Bokeh)</MenubarItem>
        <MenubarItem className={itemClass}>Efecto Niebla (Depth Cueing) para proteínas muy grandes</MenubarItem>
        
        <MenubarSeparator className="bg-white/10 mx-1 my-1" />
        
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Calidad de Renderizado</MenubarLabel>
        <MenubarItem className={itemClass}>Rápido (Baja resolución)</MenubarItem>
        <MenubarItem className={itemClass}>Producción (Alta resolución)</MenubarItem>
        <MenubarItem className={itemClass}>Exportar Imagen de Publicación (Render Raytraced 4K)</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}
