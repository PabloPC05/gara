import {
  DEFAULT_JOB_RESOURCES_PRESET_ID,
  formatJobResourcesSummary,
  getJobResourcesPreset,
  normalizeJobResources,
  resolveJobResourcesPresetId,
} from "@/lib/jobResources";

describe("jobResources", () => {
  it("returns the default preset when the preset id is unknown", () => {
    const preset = getJobResourcesPreset("missing");

    expect(preset.id).toBe(DEFAULT_JOB_RESOURCES_PRESET_ID);
  });

  it("normalizes values against the API limits", () => {
    expect(
      normalizeJobResources({
        gpus: 99,
        cpus: 0,
        memory_gb: 999,
        max_runtime_seconds: 10,
      }),
    ).toEqual({
      gpus: 4,
      cpus: 1,
      memory_gb: 256,
      max_runtime_seconds: 60,
    });
  });

  it("detects custom resource combinations", () => {
    expect(
      resolveJobResourcesPresetId({
        gpus: 1,
        cpus: 12,
        memory_gb: 24,
        max_runtime_seconds: 7200,
      }),
    ).toBe("custom");
  });

  it("formats a compact job summary for the menu", () => {
    expect(
      formatJobResourcesSummary({
        gpus: 1,
        cpus: 8,
        memory_gb: 32,
        max_runtime_seconds: 3600,
      }),
    ).toBe("1 GPU · 8 CPU · 32 GB · 60 min");
  });
});
