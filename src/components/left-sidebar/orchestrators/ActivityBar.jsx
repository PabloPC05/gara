import React from "react";
import {
  SquarePlus,
  FileCode,
  Search,
  Settings,
  FolderOpen,
  Share2,
} from "lucide-react";
import { useLayoutStore } from "../../../stores/useLayoutStore";
import { useShareSession } from "../../../hooks/useShareSession";
import { GeminiIcon } from "../../ui/GeminiIcon";

const NAV_TABS = [
  { id: "plus", icon: SquarePlus, title: "Espacio 3D" },
  { id: "files", icon: FileCode, title: "Scripts & Jobs" },
  { id: "search", icon: Search, title: "Explorar Catálogo" },
  { id: "ai", icon: GeminiIcon, title: "AI Assistant", iconSize: 26 },
];

export function ActivityBar() {
  const activeTab = useLayoutStore((s) => s.activeTab);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const { handleShareSession } = useShareSession();

  const btnClass = (id) =>
    `p-2 rounded-none transition-colors w-full flex justify-center border-l-2 ${
      activeTab === id
        ? "text-white border-[#e31e24]"
        : "text-slate-400 hover:text-slate-200 border-transparent"
    }`;

  return (
    <div className="z-50 flex h-full w-12 flex-shrink-0 flex-col items-center gap-4 border-r border-[#27272a] bg-black py-4">
      {NAV_TABS.map(({ id, icon: Icon, title, iconSize }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={btnClass(id)}
          title={title}
        >
          <Icon size={iconSize || 24} strokeWidth={1.5} />
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={handleShareSession}
        className="flex w-full justify-center rounded-none border-l-2 border-transparent p-2 text-slate-400 transition-colors hover:text-slate-200"
        title="Compartir Sesión"
      >
        <Share2 size={24} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => setActiveTab("workspace")}
        className={btnClass("workspace")}
        title="Workspace"
      >
        <FolderOpen size={24} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => setActiveTab("settings")}
        className={btnClass("settings")}
        title="Ajustes"
      >
        <Settings size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
}
