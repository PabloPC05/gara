// ═══════════════════════════════════════════════════
// CESGA API — TypeScript Types
// Based on OpenAPI schema from api-mock-cesga.onrender.com
// ═══════════════════════════════════════════════════

// ─── Job Submission ───
export interface JobSubmitRequest {
  fasta_sequence: string;
  fasta_filename: string;
  gpus?: number;       // 0–4, default 0
  cpus?: number;       // 1–64, default 1
  memory_gb?: number;  // >0 to 256, default 4
  max_runtime_seconds?: number; // 60–86400, default 3600
}

export interface JobSubmitResponse {
  job_id: string;
  status: JobStatus;
  message: string;
}

// ─── Job Status ───
export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  gpus: number;
  cpus: number;
  memory_gb: number;
  max_runtime_seconds: number;
  fasta_filename: string;
  error_message: string | null;
}

// ─── Job Outputs ───
export interface StructuralDataOutput {
  pdb_file: string | null;
  cif_file: string | null;
  confidence: Record<string, unknown>;
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
  solubility_score: number;
  solubility_prediction: string | null;
  instability_index: number;
  stability_status: string | null;
  toxicity_alerts: string[];
  allergenicity_alerts: string[];
  secondary_structure_prediction: SecondaryStructurePrediction | null;
  sequence_properties: SequenceProperties | null;
  source: string | null;
}

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

export interface JobOutputsResponse {
  job_id: string;
  status: JobStatus;
  protein_metadata: ProteinMetadata | null;
  structural_data: StructuralDataOutput;
  biological_data: BiologicalDataOutput;
  logs: string;
}

// ─── Job Accounting ───
export interface AccountingData {
  cpu_hours: number;
  gpu_hours: number;
  memory_gb_hours: number;
  total_wall_time_seconds: number;
  cpu_efficiency_percent: number;
  memory_efficiency_percent: number;
  gpu_efficiency_percent: number | null;
}

export interface JobAccountingResponse {
  job_id: string;
  status: JobStatus;
  accounting: AccountingData;
}

// ─── Protein Catalog ───
export interface ProteinSummary {
  protein_id: string;
  uniprot_id: string;
  pdb_id: string;
  protein_name: string;
  organism: string;
  length: number;
  molecular_weight: number;
  category: string;
  description: string;
  tags: string[];
}

export interface ProteinDetail extends ProteinSummary {
  isoelectric_point: number;
  function: string;
  cellular_location: string;
  activity: string;
  sequence: string;
  fasta_ready: string;
  known_structures: Record<string, unknown>[];
}

export interface ProteinSample {
  protein_name: string;
  uniprot_id: string;
  sequence_length: number;
  fasta: string;
}

export interface DatabaseStats {
  total_proteins: number;
  embedded_proteins: number;
  extended_proteins: number;
  average_length: number;
  min_length: number;
  max_length: number;
  by_category: Record<string, number>;
}
