import React from 'react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"

export function FileMenu() {
  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer"
  const labelClass = "px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500"
  const separatorClass = "bg-white/10 mx-1 my-1"

  return (
    <MenubarMenu>
      <MenubarTrigger>Archivo</MenubarTrigger>
      <MenubarContent className="w-72 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5">
        
        {/* Workspace */}
        <MenubarLabel className={labelClass}>Espacio de Trabajo</MenubarLabel>
        <MenubarItem className={itemClass}>Nueva Área de Trabajo (Limpiar)</MenubarItem>
        <MenubarItem className={itemClass}>Guardar Sesión Actual (.json)</MenubarItem>
        <MenubarItem className={itemClass}>Restaurar Sesión Previa</MenubarItem>
        
        <MenubarSeparator className={separatorClass} />

        {/* Import */}
        <MenubarLabel className={labelClass}>Importar Estructura</MenubarLabel>
        <MenubarItem className={itemClass}>Cargar Archivo Local (.pdb, .cif)</MenubarItem>
        <MenubarItem className={itemClass}>Obtener de RCSB PDB (por ID)</MenubarItem>
        <MenubarItem className={itemClass}>Obtener de AlphaFold DB (UniProt)</MenubarItem>

        <MenubarSeparator className={separatorClass} />

        {/* Export */}
        <MenubarLabel className={labelClass}>Exportar Datos</MenubarLabel>
        <MenubarItem className={itemClass}>Exportar Coordenadas (.pdb)</MenubarItem>
        <MenubarItem className={itemClass}>Exportar Secuencia (FASTA)</MenubarItem>
        <MenubarItem className={itemClass}>Exportar Tabla de Interacciones (CSV)</MenubarItem>

        <MenubarSeparator className={separatorClass} />

        {/* Share */}
        <MenubarLabel className={labelClass}>Colaboración</MenubarLabel>
        <MenubarItem className={itemClass}>Generar Enlace de Compartición</MenubarItem>
        <MenubarItem className={itemClass}>Invitar a Sesión en Vivo (Multijugador)</MenubarItem>

      </MenubarContent>
    </MenubarMenu>
  )
}
