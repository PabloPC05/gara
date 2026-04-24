export type AnalysisMode = "distance" | "hbonds";

export type RepresentationType =
  | "cartoon"
  | "gaussian-surface"
  | "spacefill"
  | "ball-and-stick"
  | "molecular-surface";

export type LightingType = "ao" | "flat" | "studio";

export type ColorSchemeType =
  | "alphafold-plddt"
  | "hydrophobicity-kyte-doolittle"
  | "electrostatic-charge"
  | "side-chain-size";

export interface FocusedResidue {
  seqId: number;
}

export interface PendingCamera {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
}

export interface TooltipData {
  code: string;
  seqId: number;
  chainId: string;
  plddt: string;
}

/**
 * An entry in the Mol* structure map, representing one loaded protein.
 * Created by `loadStructure` in `structurePipeline.js`.
 */
export interface StructureEntry {
  id: string;
  dataRef: unknown;
  baseRef: unknown;
  transformedRef: { ref: string };
  reprRef: unknown;
  /** Mat4 from molstar — branded Array<number> with length 16 */
  mat: ArrayLike<number> & { [i: number]: number };
  /** Vec3 from molstar — branded Array<number> with length 3 */
  centroid: ArrayLike<number> & { [i: number]: number };
}
