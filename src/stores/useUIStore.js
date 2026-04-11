import { create } from 'zustand'

function load(key, fallback) {
  const v = localStorage.getItem(key)
  return v !== null ? v : fallback
}

const savedDarkMode  = load('ui:darkMode', 'false') === 'true'
const savedLanguage  = load('ui:language', 'es')
const savedCompact   = load('ui:compact', 'false') === 'true'
const savedViewerBg  = load('ui:viewerBg', '#ffffff')

// Aplicar class dark inmediatamente para evitar flash en la carga inicial
if (savedDarkMode) document.documentElement.classList.add('dark')

export const useUIStore = create((set) => ({
  // ── Sidebar / UI ─────────────────────────────────────────────────────
  activeTab:        'plus', // 'plus' | 'files' | 'search' | 'ai' | 'settings' | null
  currentView:      'viewer', // 'viewer' | 'dashboard'
  detailsPanelOpen: false,  // panel de detalles de proteína (independiente de la selección)
  darkMode:    savedDarkMode,
  language:    savedLanguage,   // 'es' | 'en'
  compactMode: savedCompact,    // reduce spacing in sidebar

  // ── Visor 3D ─────────────────────────────────────────────────────────
  viewerBackground:     savedViewerBg, // color de fondo para el visor 3D (persistido)
  viewerRepresentation: 'cartoon',     // 'cartoon' | 'gaussian-surface' | 'spacefill' | 'ball-and-stick' | 'molecular-surface'
  viewerLighting:       'ao',          // 'ao' | 'flat' | 'studio'

  // ── Acciones sidebar / UI ─────────────────────────────────────────────
  setActiveTab: (tab) =>
    set((state) => ({ activeTab: state.activeTab === tab ? null : tab })),

  setCurrentView: (view) => set({ currentView: view }),

  setDetailsPanelOpen: (open) => set({ detailsPanelOpen: open }),

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      localStorage.setItem('ui:darkMode', String(next))
      document.documentElement.classList.toggle('dark', next)
      return { darkMode: next }
    }),

  setLanguage: (lang) =>
    set(() => {
      localStorage.setItem('ui:language', lang)
      return { language: lang }
    }),

  toggleCompactMode: () =>
    set((state) => {
      const next = !state.compactMode
      localStorage.setItem('ui:compact', String(next))
      return { compactMode: next }
    }),

  // ── Acciones visor 3D ─────────────────────────────────────────────────
  setViewerBackground: (color) =>
    set(() => {
      localStorage.setItem('ui:viewerBg', color)
      return { viewerBackground: color }
    }),

  setViewerRepresentation: (repr) => set({ viewerRepresentation: repr }),
  setViewerLighting: (lighting) => set({ viewerLighting: lighting }),

  // ── Residuo enfocado (FastaBar ↔ Visor 3D) ───────────────────────────
  focusedResidue: null, // { seqId: number } | null
  setFocusedResidue: (residue) => set({ focusedResidue: residue }),
}))
