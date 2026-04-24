import React from "react";
import { PanelLeft, PanelRight } from "lucide-react";
import { ProjectBreadcrumbs } from "./ProjectBreadcrumbs";
import { FileMenu } from "./FileMenu";
import { StyleMenu } from "./StyleMenu";
import { ToolsMenu } from "./ToolsMenu";
import { EnvironmentMenu } from "./EnvironmentMenu";
import { SearchBarTrigger } from "./SearchBarTrigger";
import { JobResourcesMenu } from "./JobResourcesMenu";
import { UserAccountModule } from "./UserAccountModule";
import { Menubar } from "../ui/menubar";
import { useLayoutStore } from "../../stores/useLayoutStore";

export function MenuBar() {
  const activeTab = useLayoutStore((s) => s.activeTab);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const detailsPanelOpen = useLayoutStore((s) => s.detailsPanelOpen);
  const setDetailsPanelOpen = useLayoutStore((s) => s.setDetailsPanelOpen);

  const handleToggleLeftSidebar = () => {
    if (activeTab) {
      setActiveTab(null);
    } else {
      setActiveTab("plus");
    }
  };

  return (
    <header className="relative z-[60] flex h-9 select-none items-center border-b border-[#27272a] bg-black px-2">
      <div className="flex flex-1 items-center">
        <ProjectBreadcrumbs />
        <Menubar>
          <FileMenu />
          <StyleMenu />
          <ToolsMenu />
          <EnvironmentMenu />
        </Menubar>
      </div>

      <div className="flex justify-center gap-2">
        <SearchBarTrigger />
      </div>

      <div className="ml-2 flex flex-1 items-center justify-end gap-1">
        {/* Botón toggle barra lateral izquierda */}
        <button
          onClick={handleToggleLeftSidebar}
          title="Alternar barra lateral izquierda"
          className={`flex h-7 w-7 items-center justify-center rounded-none transition-colors hover:bg-white/10 ${
            activeTab ? "text-blue-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* Botón toggle panel de detalles (derecha) */}
        <button
          onClick={() => setDetailsPanelOpen(!detailsPanelOpen)}
          title="Alternar detalles de proteína"
          className={`flex h-7 w-7 items-center justify-center rounded-none transition-colors hover:bg-white/10 ${
            detailsPanelOpen
              ? "text-blue-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <PanelRight className="h-4 w-4" />
        </button>

        <JobResourcesMenu />
        <div className="mx-1 h-4 w-px bg-[#27272a]" />
        <UserAccountModule />
      </div>
    </header>
  );
}
