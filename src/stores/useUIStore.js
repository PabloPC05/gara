import { create } from 'zustand'
import {
  DEFAULT_JOB_RESOURCES_PRESET_ID,
  getJobResourcesPreset,
  normalizeJobResources,
  resolveJobResourcesPresetId,
} from '@/lib/jobResources'

function load(key, fallback) {
  const v = localStorage.getItem(key)
  return v !== null ? v : fallback
}

function loadJSON(key, fallback) {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function persistJobResources(presetId, resources) {
  localStorage.setItem('ui:jobResourcesPreset', presetId)
  localStorage.setItem('ui:jobResources', JSON.stringify(resources))
}

const savedDarkMode  = load('ui:darkMode', 'false') === 'true'
const savedLanguage  = load('ui:language', 'es')
const savedCompact   = load('ui:compact', 'false') === 'true'
const savedViewerBg  = load('ui:viewerBg', '#ffffff')
const savedColorScheme = load('ui:viewerColorScheme', 'alphafold-plddt')
const savedJobResourcesPreset = load('ui:jobResourcesPreset', DEFAULT_JOB_RESOURCES_PRESET_ID)
const savedJobResourcesRaw = loadJSON('ui:jobResources', null)
const savedJobResources = savedJobResourcesRaw
  ? normalizeJobResources(savedJobResourcesRaw)
  : normalizeJobResources(getJobResourcesPreset(savedJobResourcesPreset).resources)
const normalizedSavedJobResourcesPreset = savedJobResourcesRaw
  ? resolveJobResourcesPresetId(savedJobResources)
  : getJobResourcesPreset(savedJobResourcesPreset).id

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
  jobResourcesPreset: normalizedSavedJobResourcesPreset,
  jobResources: savedJobResources,

  // ── Visor 3D ─────────────────────────────────────────────────────────
  viewerBackground:     savedViewerBg, // color de fondo para el visor 3D (persistido)
  viewerRepresentation: 'cartoon',     // 'cartoon' | 'gaussian-surface' | 'spacefill' | 'ball-and-stick' | 'molecular-surface'
  viewerLighting:       'ao',          // 'ao' | 'flat' | 'studio'
  viewerColorScheme:    savedColorScheme, // 'alphafold-plddt' | 'hydrophobicity-kyte-doolittle' | 'electrostatic-charge' | 'side-chain-size'

  // ── Drug Discovery Mode ─────────────────────────────────────────────
  // Modo combinado: activa superficie gaussiana + lente bioquímica.
  // Al activar guarda repr/color previos para restaurarlos al desactivar.
  drugDiscoveryMode: false,
  drugDiscoveryLens: 'electrostatic-charge', // lente activa dentro del modo
  _preDiscoveryRepr: null,   // backup de viewerRepresentation antes de activar
  _preDiscoveryColor: null,  // backup de viewerColorScheme antes de activar

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

  setJobResourcesPreset: (presetId) =>
    set(() => {
      const preset = getJobResourcesPreset(presetId)
      const nextResources = normalizeJobResources(preset.resources)
      persistJobResources(preset.id, nextResources)
      return {
        jobResourcesPreset: preset.id,
        jobResources: nextResources,
      }
    }),

  updateJobResources: (partialResources) =>
    set((state) => {
      const nextResources = normalizeJobResources({
        ...state.jobResources,
        ...partialResources,
      })
      const nextPresetId = resolveJobResourcesPresetId(nextResources)
      persistJobResources(nextPresetId, nextResources)
      return {
        jobResourcesPreset: nextPresetId,
        jobResources: nextResources,
      }
    }),

  // ── Acciones visor 3D ─────────────────────────────────────────────────
  setViewerBackground: (color) =>
    set(() => {
      localStorage.setItem('ui:viewerBg', color)
      return { viewerBackground: color }
    }),

  setViewerRepresentation: (repr) =>
    set((state) => ({
      viewerRepresentation: repr,
      // Cambio manual de representación desactiva el modo Drug Discovery
      ...(state.drugDiscoveryMode
        ? { drugDiscoveryMode: false, _preDiscoveryRepr: null, _preDiscoveryColor: null }
        : {}),
    })),

  setViewerLighting: (lighting) => set({ viewerLighting: lighting }),

  setViewerColorScheme: (scheme) =>
    set((state) => {
      localStorage.setItem('ui:viewerColorScheme', scheme)
      return {
        viewerColorScheme: scheme,
        // Cambio manual de color desactiva el modo Drug Discovery
        ...(state.drugDiscoveryMode
          ? { drugDiscoveryMode: false, _preDiscoveryRepr: null, _preDiscoveryColor: null }
          : {}),
      }
    }),

  // ── Drug Discovery Mode actions ────────────────────────────────────
  /** Activa/desactiva el modo Drug Discovery (superficie + lente bioquímica). */
  toggleDrugDiscovery: () =>
    set((state) => {
      if (state.drugDiscoveryMode) {
        // Desactivar → restaurar representación y color previos
        const restoredColor = state._preDiscoveryColor ?? 'alphafold-plddt'
        localStorage.setItem('ui:viewerColorScheme', restoredColor)
        return {
          drugDiscoveryMode: false,
          viewerRepresentation: state._preDiscoveryRepr ?? 'cartoon',
          viewerColorScheme: restoredColor,
          _preDiscoveryRepr: null,
          _preDiscoveryColor: null,
        }
      }
      // Activar → guardar estado actual, cambiar a superficie + lente
      localStorage.setItem('ui:viewerColorScheme', state.drugDiscoveryLens)
      return {
        drugDiscoveryMode: true,
        _preDiscoveryRepr: state.viewerRepresentation,
        _preDiscoveryColor: state.viewerColorScheme,
        viewerRepresentation: 'gaussian-surface',
        viewerColorScheme: state.drugDiscoveryLens,
      }
    }),

  /** Cambia la lente activa dentro del modo Drug Discovery. */
  setDrugDiscoveryLens: (lens) =>
    set((state) => {
      const update = { drugDiscoveryLens: lens }
      if (state.drugDiscoveryMode) {
        update.viewerColorScheme = lens
        localStorage.setItem('ui:viewerColorScheme', lens)
      }
      return update
    }),

  // ── Residuo enfocado por proteína (FastaBar ↔ Visores 3D) ───────────────────
  // En modo split-screen cada visor necesita su propio residuo enfocado independiente.
  // Usamos un mapa { [proteinId]: { seqId } | null } en vez de un solo valor global.
  focusedResidueByProtein: {}, // { [proteinId]: { seqId: number } | null }

  setFocusedResidue: (proteinId, residue) =>
    set((state) => ({
      focusedResidueByProtein: {
        ...state.focusedResidueByProtein,
        [proteinId]: residue,
      },
    })),

  clearFocusedResidue: (proteinId) =>
    set((state) => {
      const next = { ...state.focusedResidueByProtein }
      delete next[proteinId]
      return { focusedResidueByProtein: next }
    }),

  // ── Simulación de flexibilidad ────────────────────────────────────────
  flexibilityAnimating: false,
  toggleFlexibilityAnimation: () =>
    set((state) => ({ flexibilityAnimating: !state.flexibilityAnimating })),

  // ── Camara pendiente (deep link restore) ──────────────────────────────
  pendingCamera: null, // { position: [x,y,z], target: [x,y,z], up: [x,y,z] } | null
  setPendingCamera: (cam) => set({ pendingCamera: cam }),
  clearPendingCamera: () => set({ pendingCamera: null }),
}))
