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
    <header className="relative z-[60] flex items-center h-12 px-2 select-none bg-[#18181b] border-b border-[#27272a]">
      <ProjectBreadcrumbs />
      <div className="h-12 w-px bg-slate-600 mx-1" />
      <Menubar>
        <StyleMenu />
        <ToolsMenu />
        <EnvironmentMenu />
      </Menubar>
      <div className="flex-1" />
      <SearchBarTrigger />
      <div className="flex items-center gap-1 ml-2">
        <HPCMonitor />
        <UserAccountModule />
      </div>
    </header>
  )
}
