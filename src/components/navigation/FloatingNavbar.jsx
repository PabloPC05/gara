import React from 'react'
import { PanelLeft, PanelRight } from 'lucide-react'
import { ProjectBreadcrumbs } from './ProjectBreadcrumbs'
import { FileMenu } from './FileMenu'
import { StyleMenu } from './StyleMenu'
import { ToolsMenu } from './ToolsMenu'
import { EnvironmentMenu } from './EnvironmentMenu'
import { VisionMenu } from './VisionMenu'
import { SearchBarTrigger } from './SearchBarTrigger'
import { JobResourcesMenu } from './JobResourcesMenu'
import { UserAccountModule } from './UserAccountModule'
import { Menubar } from '../ui/menubar'
import { useUIStore } from '../../stores/useUIStore'

export function MenuBar() {
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const detailsPanelOpen = useUIStore((s) => s.detailsPanelOpen)
  const setDetailsPanelOpen = useUIStore((s) => s.setDetailsPanelOpen)

  const handleToggleLeftSidebar = () => {
    if (activeTab) {
      setActiveTab(null)
    } else {
      setActiveTab('plus')
    }
  }

  return (
    <header className="relative z-[60] flex items-center h-9 px-2 select-none bg-black border-b border-[#27272a]">
      <div className="flex flex-1 items-center">
        <ProjectBreadcrumbs />
        <div className="h-9 w-px bg-slate-600 mx-1" />
        <Menubar>
          <FileMenu />
          <StyleMenu />
          <ToolsMenu />
          <EnvironmentMenu />
          <VisionMenu />
        </Menubar>
      </div>
      
      <div className="flex justify-center gap-2">
        <SearchBarTrigger />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1 ml-2">
        {/* Botón toggle barra lateral izquierda */}
        <button
          onClick={handleToggleLeftSidebar}
          title="Alternar barra lateral izquierda"
          className={`flex h-7 w-7 items-center justify-center rounded-none hover:bg-white/10 transition-colors ${
            activeTab ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* Botón toggle panel de detalles (derecha) */}
        <button
          onClick={() => setDetailsPanelOpen(!detailsPanelOpen)}
          title="Alternar detalles de proteína"
          className={`flex h-7 w-7 items-center justify-center rounded-none hover:bg-white/10 transition-colors ${
            detailsPanelOpen ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PanelRight className="h-4 w-4" />
        </button>

        <JobResourcesMenu />
        <div className="h-4 w-px bg-[#27272a] mx-1" />
        <UserAccountModule />
      </div>
    </header>
  )
}
