export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface SubmitJobPayload {
  fasta_sequence: string;
  fasta_filename: string;
  gpus?: number;
  cpus?: number;
  memory_gb?: number;
  max_runtime_seconds?: number;
}

export interface SubmitJobResponse {
  job_id: string;
  status: JobStatus;
  message: string;
}

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

export interface ConfidenceData {
  plddt_per_residue: number[];
  plddt_mean: number;
  plddt_histogram: {
    very_high: number;
    high: number;
    medium: number;
    low: number;
  };
  pae_matrix: number[][];
  mean_pae: number;
}

export interface StructuralDataOutput {
  pdb_file: string | null;
  cif_file: string | null;
  confidence: ConfidenceData;
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

export interface JobOutputsResponse {
  job_id: string;
  status: JobStatus;
  protein_metadata: ProteinMetadata | null;
  structural_data: StructuralDataOutput;
  biological_data: BiologicalDataOutput;
  logs: string;
}

export interface ProteinSample {
  protein_name: string;
  uniprot_id: string;
  sequence_length: number;
  fasta: string;
}
