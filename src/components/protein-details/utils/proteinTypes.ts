import type {
  ProteinMetadata,
  StructuralDataOutput,
  BiologicalDataOutput,
  SequenceProperties,
} from "@/api/types";

// Shape of the unified protein object that comes from the Zustand store
// (produced by proteinAdapter.js → apiToUnified / mockToUnified)
export interface RawProtein {
  id?: string;
  name?: string;
  protein_name?: string;
  organism?: string;
  length?: number | null;
  description?: string | null;
  tags?: string[];
  category?: string | null;
  function?: string | null;
  cellular_location?: string | null;
  activity?: string | null;
  protein_id?: string | null;
  uniprot_id?: string | null;
  pdb_id?: string | null;
  uniprotId?: string | null;
  pdbId?: string | null;
  molecular_weight?: number | null;
  isoelectric_point?: number | null;
  plddtMean?: number | null;
  meanPae?: number | null;
  paeMatrix?: number[][];
  plddtPerResidue?: number[];
  sequence?: string | null;
  fasta_ready?: string | null;
  known_structures?: unknown[];
  jobId?: string | null;
  logs?: string;
  pdbData?: string | null;
  // Unified biological data (from proteinAdapter)
  biological?: {
    solubility?: number | null;
    solubilityLabel?: string | null;
    instabilityIndex?: number | null;
    instabilityLabel?: string | null;
    toxicityAlert?: boolean;
    toxicityLabel?: string | null;
    toxicityAlerts?: string[];
    molecularWeight?: number | null;
    isoelectricPoint?: number | null;
    halfLife?: string | null;
    extinctionCoefficient?: number | null;
    positiveCharges?: number | null;
    negativeCharges?: number | null;
    cysteineResidues?: number | null;
  } | null;
  // Raw API response nested under _raw
  _raw?: {
    job_id?: string;
    protein_metadata?: ProteinMetadata;
    structural_data?: StructuralDataOutput;
    biological_data?: BiologicalDataOutput;
    sequence_properties?: SequenceProperties;
    logs?: string;
  };
}

// Flat display shape produced by normalizeProtein()
export interface NormalizedProtein {
  name: string | null;
  organism: string | null;
  length: number | null;
  description: string | null;
  tags: string[];
  proteinId: string | null;
  uniprotId: string | null;
  pdbId: string | null;
  category: string | null;
  modelType: string | null;
  jobId: string | null;
  dataSource: string | null;
  function: string | null;
  cellularLocation: string | null;
  activity: string | null;
  mwDa: number | null;
  isoelectricPoint: number | null;
  positiveCharges: number | null;
  negativeCharges: number | null;
  cysteines: number | null;
  halfLife: string | null;
  extinctionCoefficient: number | null;
  plddtMean: number | null;
  meanPae: number | null;
  paeMatrix: number[][];
  solubilityScore: number | null;
  solubilityLabel: string | null;
  instabilityIndex: number | null;
  instabilityLabel: string | null;
  toxicityAlerts: string[];
  allergenicityAlerts: string[];
  knownStructures: unknown[];
  sequence: string | null;
  fastaReady: string | null;
  pdbFile: string | null;
  logs: string;
}
