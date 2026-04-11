import React from 'react';
import { SquarePlus, FileCode, Search, Bot, Settings } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

const NAV_TABS = [
  { id: 'plus',   icon: SquarePlus, title: 'Espacio 3D' },
  { id: 'files',  icon: FileCode,   title: 'Scripts & Jobs' },
  { id: 'search', icon: Search,     title: 'Explorar Catálogo' },
  { id: 'ai',     icon: Bot,        title: 'AI Assistant' },
];

export function ActivityBar() {
  const activeTab    = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return (
    <div className="flex flex-col items-center w-12 bg-black border-r border-[#27272a] py-4 gap-4 z-50 h-full flex-shrink-0">

      {/* Tabs principales */}
      {NAV_TABS.map(({ id, icon: Icon, title }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`p-2 rounded-none transition-colors w-full flex justify-center border-l-2 ${
            activeTab === id
              ? 'text-white border-[#e31e24]'
              : 'text-slate-400 hover:text-slate-200 border-transparent'
          }`}
          title={title}
        >
          <Icon size={24} strokeWidth={1.5} />
        </button>
      ))}

      {/* Ajustes al fondo */}
      <div className="flex-1" />
      <button
        onClick={() => setActiveTab('settings')}
        className={`p-2 rounded-none transition-colors w-full flex justify-center border-l-2 ${
          activeTab === 'settings'
            ? 'text-white border-[#e31e24]'
            : 'text-slate-400 hover:text-slate-200 border-transparent'
        }`}
        title="Ajustes"
      >
        <Settings size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
}
