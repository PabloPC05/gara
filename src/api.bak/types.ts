// ─── Jobs ───

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface SubmitJobPayload {
  fasta_sequence: string;       // 1–100_000 chars
  fasta_filename: string;       // 1–255 chars
  gpus?: number;                // 0–4, default 0
  cpus?: number;                // 1–64, default 1
  memory_gb?: number;           // (0, 256], default 4.0
  max_runtime_seconds?: number; // 60–86_400, default 3600
}

export interface SubmitJobResponse {
  job_id: string;
  status: JobStatus; // always PENDING on creation
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  created_at: string; // ISO 8601
  started_at: string | null;
  completed_at: string | null;
  gpus: number;
  cpus: number;
  memory_gb: number;
  max_runtime_seconds: number;
  fasta_filename: string;
  error_message: string | null;
}

// ─── Outputs ───

// All fields are nullable per the OpenAPI schema (no `required` list on ProteinMetadata).
export interface ProteinMetadata {
  identified_protein: string | null;
  uniprot_id: string | null;
  pdb_id: string | null;
  protein_name: string | null;
  organism: string | null;
  description: string | null;
  data_source: string | null;
  plddt_average: number | null;
  model_type: string | null;
}

// `confidence` is declared as `type: object` (no properties) in the OpenAPI schema.
// Shape verified via runtime call to /jobs/{id}/outputs on a real Ubiquitin job.
export interface ConfidenceData {
  plddt_per_residue: number[];
  plddt_mean: number;
  plddt_histogram: {
    very_high: number; // > 90
    high: number;      // 70–90
    medium: number;    // 50–70
    low: number;       // < 50
  };
  pae_matrix: number[][];
  mean_pae: number;
}

export interface StructuralDataOutput {
  pdb_file: string | null; // nullable in schema
  cif_file: string | null; // nullable in schema
  confidence: ConfidenceData; // only required field
}

export interface SecondaryStructurePrediction {
  helix_percent: number;
  strand_percent: number;
  coil_percent: number;
}

export interface SequenceProperties {
  length: number;
  molecular_weight_kda: number;
  positive_charges: number;
  negative_charges: number;
  cysteine_residues: number;
  aromatic_residues: number;
}

export interface BiologicalDataOutput {
  solubility_score: number;    // required
  solubility_prediction: string | null;
  instability_index: number;   // required
  stability_status: string | null;
  toxicity_alerts: string[];   // required, may be empty
  allergenicity_alerts: string[];
  secondary_structure_prediction: SecondaryStructurePrediction | null;
  sequence_properties: SequenceProperties | null;
  source: string | null;
}

export interface JobOutputsResponse {
  job_id: string;
  status: JobStatus;
  protein_metadata: ProteinMetadata | null;
  structural_data: StructuralDataOutput;
  biological_data: BiologicalDataOutput;
  logs: string;
}

// ─── Proteins ───

// Verified via GET /proteins/samples in the live API: direct array with exactly these 4 fields.
export interface ProteinSample {
  protein_name: string;
  uniprot_id: string;
  sequence_length: number;
  fasta: string;
}
