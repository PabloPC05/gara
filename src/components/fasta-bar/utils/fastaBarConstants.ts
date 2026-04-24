// --- Amino acid biochemical groups ---

type AminoAcidGroup = "np" | "po" | "ac" | "ba" | "";

interface GroupColors {
  base: string;
  text: string;
  sel: string;
  ring: string;
}

export const AA_GROUP_MAP: Record<string, AminoAcidGroup> = {
  G: "np",
  A: "np",
  V: "np",
  L: "np",
  I: "np",
  M: "np",
  F: "np",
  W: "np",
  P: "np",
  S: "po",
  T: "po",
  C: "po",
  Y: "po",
  N: "po",
  Q: "po",
  D: "ac",
  E: "ac",
  K: "ba",
  R: "ba",
  H: "ba",
};

export const AA_GROUP_COLORS: Record<AminoAcidGroup, GroupColors> = {
  np: { base: "#fef3c7", text: "#92400e", sel: "#fbbf24", ring: "#f59e0b" },
  po: { base: "#e0f2fe", text: "#0c4a6e", sel: "#38bdf8", ring: "#0ea5e9" },
  ac: { base: "#fee2e2", text: "#7f1d1d", sel: "#f87171", ring: "#ef4444" },
  ba: { base: "#e0e7ff", text: "#1e1b4b", sel: "#818cf8", ring: "#6366f1" },
  "": { base: "#f1f5f9", text: "#475569", sel: "#94a3b8", ring: "#64748b" },
};

export const SCROLL_JUMP = 20;
