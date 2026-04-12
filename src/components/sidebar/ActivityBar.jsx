import React, { useCallback } from 'react';
import { SquarePlus, FileCode, Search, Settings, FolderOpen, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '../../stores/useUIStore';
import { useProteinStore } from '../../stores/useProteinStore';
import { useMolstarStore } from '../../stores/useMolstarStore';
import { serializeViewerState, buildShareUrl } from '../../utils/deepLink';
import { GeminiIcon } from '../ui/GeminiIcon';

const NAV_TABS = [
  { id: 'plus',   icon: SquarePlus, title: 'Espacio 3D' },
  { id: 'files',  icon: FileCode,   title: 'Scripts & Jobs' },
  { id: 'search', icon: Search,     title: 'Explorar Catálogo' },
  { id: 'ai',     icon: GeminiIcon, title: 'AI Assistant', iconSize: 26 },
];

export function ActivityBar() {
  const activeTab    = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const proteinsById = useProteinStore((s) => s.proteinsById);
  const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds);

  const handleShareSession = useCallback(() => {
    const currentProteins = Object.values(proteinsById)
    if (currentProteins.length === 0) {
      toast.warning('No hay proteinas activas para compartir.')
      return
    }
    const pluginRef = useMolstarStore.getState().pluginRef
    const plugin = pluginRef?.current
    const { focusedResidue, viewerRepresentation, viewerLighting, viewerBackground } = useUIStore.getState()

    const encoded = serializeViewerState({
      proteinsById,
      selectedProteinIds,
      plugin,
      focusedResidue,
      viewerSettings: {
        representation: viewerRepresentation,
        lighting: viewerLighting,
        background: viewerBackground,
      },
    })

    const shareUrl = buildShareUrl(encoded)

    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Enlace copiado al portapapeles', {
        description: 'Cualquiera con este enlace vera la vista exacta que estas viendo.',
        duration: 4000,
      })
    }).catch(() => {
      navigator.clipboard.writeText(shareUrl)
      toast.info('Enlace generado', {
        description: 'No se pudo copiar automaticamente. El enlace esta en la consola.',
        duration: 5000,
      })
      console.log('[Share URL]', shareUrl)
    })
  }, [proteinsById, selectedProteinIds]);

  const btnClass = (id) =>
    `p-2 rounded-none transition-colors w-full flex justify-center border-l-2 ${
      activeTab === id
        ? 'text-white border-[#e31e24]'
        : 'text-slate-400 hover:text-slate-200 border-transparent'
    }`

  return (
    <div className="flex flex-col items-center w-12 bg-black border-r border-[#27272a] py-4 gap-4 z-50 h-full flex-shrink-0">

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
        className="p-2 rounded-none transition-colors w-full flex justify-center border-l-2 text-slate-400 hover:text-slate-200 border-transparent"
        title="Compartir Sesión"
      >
        <Share2 size={24} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => setActiveTab('workspace')}
        className={btnClass('workspace')}
        title="Workspace"
      >
        <FolderOpen size={24} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => setActiveTab('settings')}
        className={btnClass('settings')}
        title="Ajustes"
      >
        <Settings size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
}
