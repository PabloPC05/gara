import React from 'react'
import { ProjectBreadcrumbs } from './ProjectBreadcrumbs'
import { StyleMenu } from './StyleMenu'
import { ToolsMenu } from './ToolsMenu'
import { EnvironmentMenu } from './EnvironmentMenu'
import { HPCMonitor } from './HPCMonitor'
import { SearchBarTrigger } from './SearchBarTrigger'
import { UserAccountModule } from './UserAccountModule'

export function FloatingNavbar() {
  return (
    <header className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-fit max-w-[95vw]">
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white/85 px-3 py-2 shadow-xl backdrop-blur-xl transition-all hover:bg-white/95">
        
        {/* Breadcrumbs de Proyecto */}
        <ProjectBreadcrumbs />

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Herramientas de Representación y Análisis */}
        <div className="flex items-center gap-1">
          <StyleMenu />
          <ToolsMenu />
          <EnvironmentMenu />
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Estado y Perfil */}
        <div className="flex items-center gap-3">
          <HPCMonitor />
          <SearchBarTrigger />
          <UserAccountModule />
        </div>
      </div>
    </header>
  )
}
