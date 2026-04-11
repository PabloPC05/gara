import React from 'react';
import { PlusSquare, FileCode, Search } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export function ActivityBar() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col items-center w-12 bg-[#18181b] border-r border-[#27272a] py-4 gap-4 z-50 h-screen flex-shrink-0">
      <button 
        onClick={() => handleTabClick('plus')}
        className={`p-2 rounded-none transition-colors w-full flex justify-center border-l-2 ${activeTab === 'plus' ? 'text-white border-[#e31e24]' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}
        title="Espacio 3D"
      >
        <PlusSquare size={24} strokeWidth={1.5} />
      </button>
      <button 
        onClick={() => handleTabClick('files')}
        className={`p-2 rounded-none transition-colors w-full flex justify-center border-l-2 ${activeTab === 'files' ? 'text-white border-[#e31e24]' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}
        title="Scripts & Jobs"
      >
        <FileCode size={24} strokeWidth={1.5} />
      </button>
      <button 
        onClick={() => handleTabClick('search')}
        className={`p-2 rounded-none transition-colors w-full flex justify-center border-l-2 ${activeTab === 'search' ? 'text-white border-[#e31e24]' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}
        title="Explorar Catálogo"
      >
        <Search size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
}
