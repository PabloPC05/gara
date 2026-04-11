import React from 'react'
import { ProjectBreadcrumbs } from './ProjectBreadcrumbs'
import { StyleMenu } from './StyleMenu'
import { ToolsMenu } from './ToolsMenu'
import { EnvironmentMenu } from './EnvironmentMenu'
import { HPCMonitor } from './HPCMonitor'
import { SearchBarTrigger } from './SearchBarTrigger'
import { UserAccountModule } from './UserAccountModule'
import { Menubar } from '../ui/menubar'

export function MenuBar() {
  return (
    <header className="relative z-[60] flex items-center h-9 px-2 select-none bg-[#18181b] border-b border-[#27272a]">
      <div className="flex flex-1 items-center">
        <ProjectBreadcrumbs />
        <div className="h-9 w-px bg-slate-600 mx-1" />
        <Menubar>
          <StyleMenu />
          <ToolsMenu />
          <EnvironmentMenu />
        </Menubar>
      </div>
      <div className="flex justify-center">
        <SearchBarTrigger />
      </div>
      <div className="flex flex-1 items-center justify-end gap-1 ml-2">
        <HPCMonitor />
        <UserAccountModule />
      </div>
    </header>
  )
}
