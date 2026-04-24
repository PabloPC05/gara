import { create } from "zustand";
import {
  DEFAULT_JOB_RESOURCES_PRESET_ID,
  getJobResourcesPreset,
  normalizeJobResources,
  resolveJobResourcesPresetId,
} from "@/lib/jobResources";

function load(key: string, fallback: string): string {
  const v = localStorage.getItem(key);
  return v !== null ? v : fallback;
}

function loadJSON<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function persistJobResources(
  presetId: string,
  resources: Record<string, unknown>,
) {
  localStorage.setItem("ui:jobResourcesPreset", presetId);
  localStorage.setItem("ui:jobResources", JSON.stringify(resources));
}

const savedDarkMode = load("ui:darkMode", "false") === "true";
const savedLanguage = load("ui:language", "es");
const savedCompact = load("ui:compact", "false") === "true";
const savedJobResourcesPreset = load(
  "ui:jobResourcesPreset",
  DEFAULT_JOB_RESOURCES_PRESET_ID,
);
const savedJobResourcesRaw = loadJSON<Record<string, unknown> | null>(
  "ui:jobResources",
  null,
);
const savedJobResources = savedJobResourcesRaw
  ? normalizeJobResources(savedJobResourcesRaw)
  : normalizeJobResources(
      getJobResourcesPreset(savedJobResourcesPreset).resources,
    );
const normalizedSavedJobResourcesPreset = savedJobResourcesRaw
  ? resolveJobResourcesPresetId(savedJobResources)
  : getJobResourcesPreset(savedJobResourcesPreset).id;

if (savedDarkMode) document.documentElement.classList.add("dark");

export const useLayoutStore = create((set) => ({
  // ── Sidebar / Panels ──────────────────────────────────────────────────
  activeTab: "plus" as string | null,
  currentView: "viewer" as string,
  detailsPanelOpen: false,

  // ── User preferences ──────────────────────────────────────────────────
  darkMode: savedDarkMode,
  language: savedLanguage,
  compactMode: savedCompact,

  // ── Job resources ─────────────────────────────────────────────────────
  jobResourcesPreset: normalizedSavedJobResourcesPreset,
  jobResources: savedJobResources,

  // ── Actions ───────────────────────────────────────────────────────────
  setActiveTab: (tab: string) =>
    set((state: { activeTab: string | null }) => ({
      activeTab: state.activeTab === tab ? null : tab,
    })),

  setCurrentView: (view: string) => set({ currentView: view }),

  setDetailsPanelOpen: (open: boolean) => set({ detailsPanelOpen: open }),

  toggleDarkMode: () =>
    set((state: { darkMode: boolean }) => {
      const next = !state.darkMode;
      localStorage.setItem("ui:darkMode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return { darkMode: next };
    }),

  setLanguage: (lang: string) =>
    set(() => {
      localStorage.setItem("ui:language", lang);
      return { language: lang };
    }),

  toggleCompactMode: () =>
    set((state: { compactMode: boolean }) => {
      const next = !state.compactMode;
      localStorage.setItem("ui:compact", String(next));
      return { compactMode: next };
    }),

  setJobResourcesPreset: (presetId: string) =>
    set(() => {
      const preset = getJobResourcesPreset(presetId);
      const nextResources = normalizeJobResources(preset.resources);
      persistJobResources(preset.id, nextResources);
      return { jobResourcesPreset: preset.id, jobResources: nextResources };
    }),

  updateJobResources: (partialResources: Record<string, unknown>) =>
    set((state: { jobResources: Record<string, unknown> }) => {
      const nextResources = normalizeJobResources({
        ...state.jobResources,
        ...partialResources,
      });
      const nextPresetId = resolveJobResourcesPresetId(nextResources);
      persistJobResources(nextPresetId, nextResources);
      return { jobResourcesPreset: nextPresetId, jobResources: nextResources };
    }),
}));
