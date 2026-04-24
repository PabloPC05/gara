export const JOB_RESOURCE_LIMITS = {
  gpus: { min: 0, max: 4 },
  cpus: { min: 1, max: 64 },
  memory_gb: { min: 1, max: 256 },
  max_runtime_seconds: { min: 60, max: 86400 },
};

export const JOB_RUNTIME_MINUTES_LIMITS = {
  min: JOB_RESOURCE_LIMITS.max_runtime_seconds.min / 60,
  max: JOB_RESOURCE_LIMITS.max_runtime_seconds.max / 60,
};

export const DEFAULT_JOB_RESOURCES_PRESET_ID = "quick";

export const JOB_RESOURCE_PRESETS = [
  {
    id: "quick",
    label: "Vista rápida",
    description:
      "Perfil ligero y equivalente a la configuración base de la API.",
    resources: {
      gpus: 0,
      cpus: 1,
      memory_gb: 4,
      max_runtime_seconds: 3600,
    },
  },
  {
    id: "standard",
    label: "Estándar",
    description:
      "Equilibrado para la mayoría de secuencias y pruebas normales.",
    resources: {
      gpus: 1,
      cpus: 8,
      memory_gb: 32,
      max_runtime_seconds: 3600,
    },
  },
  {
    id: "precision",
    label: "Alta precisión",
    description: "Más CPU, memoria y tiempo para jobs complejos o exigentes.",
    resources: {
      gpus: 1,
      cpus: 16,
      memory_gb: 64,
      max_runtime_seconds: 14400,
    },
  },
];

function clampNumber(value, { min, max }) {
  const next = Number(value);
  if (!Number.isFinite(next)) return min;
  return Math.min(max, Math.max(min, Math.round(next)));
}

export function getJobResourcesPreset(presetId) {
  return (
    JOB_RESOURCE_PRESETS.find((preset) => preset.id === presetId) ??
    JOB_RESOURCE_PRESETS.find(
      (preset) => preset.id === DEFAULT_JOB_RESOURCES_PRESET_ID,
    ) ??
    JOB_RESOURCE_PRESETS[0]
  );
}

export function normalizeJobResources(resources = {}) {
  const fallback = getJobResourcesPreset(
    DEFAULT_JOB_RESOURCES_PRESET_ID,
  ).resources;

  return {
    gpus: clampNumber(
      resources.gpus ?? fallback.gpus,
      JOB_RESOURCE_LIMITS.gpus,
    ),
    cpus: clampNumber(
      resources.cpus ?? fallback.cpus,
      JOB_RESOURCE_LIMITS.cpus,
    ),
    memory_gb: clampNumber(
      resources.memory_gb ?? fallback.memory_gb,
      JOB_RESOURCE_LIMITS.memory_gb,
    ),
    max_runtime_seconds: clampNumber(
      resources.max_runtime_seconds ?? fallback.max_runtime_seconds,
      JOB_RESOURCE_LIMITS.max_runtime_seconds,
    ),
  };
}

export function resolveJobResourcesPresetId(resources) {
  const normalized = normalizeJobResources(resources);
  const matchedPreset = JOB_RESOURCE_PRESETS.find(
    (preset) =>
      preset.resources.gpus === normalized.gpus &&
      preset.resources.cpus === normalized.cpus &&
      preset.resources.memory_gb === normalized.memory_gb &&
      preset.resources.max_runtime_seconds === normalized.max_runtime_seconds,
  );

  return matchedPreset?.id ?? "custom";
}

export function formatJobResourcesSummary(resources) {
  const normalized = normalizeJobResources(resources);
  const runtimeMinutes = Math.round(normalized.max_runtime_seconds / 60);

  return `${normalized.gpus} GPU · ${normalized.cpus} CPU · ${normalized.memory_gb} GB · ${runtimeMinutes} min`;
}
