// ═══════════════════════════════════════════════════
// CESGA API Client — Full lifecycle management
// ═══════════════════════════════════════════════════

import axios from 'axios';
import type {
  JobSubmitRequest,
  JobSubmitResponse,
  JobStatusResponse,
  JobOutputsResponse,
  JobAccountingResponse,
  ProteinSummary,
  ProteinDetail,
  ProteinSample,
  DatabaseStats,
} from './types';

const API_BASE = 'https://api-mock-cesga.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Jobs ───

export async function submitJob(data: JobSubmitRequest): Promise<JobSubmitResponse> {
  const res = await api.post<JobSubmitResponse>('/jobs/submit', data);
  return res.data;
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await api.get<JobStatusResponse>(`/jobs/${jobId}/status`);
  return res.data;
}

export async function getJobOutputs(jobId: string): Promise<JobOutputsResponse> {
  const res = await api.get<JobOutputsResponse>(`/jobs/${jobId}/outputs`);
  return res.data;
}

export async function getJobAccounting(jobId: string): Promise<JobAccountingResponse> {
  const res = await api.get<JobAccountingResponse>(`/jobs/${jobId}/accounting`);
  return res.data;
}

export async function listJobs(skip = 0, limit = 100): Promise<JobStatusResponse[]> {
  const res = await api.get<JobStatusResponse[]>('/jobs/', { params: { skip, limit } });
  return res.data;
}

// ─── Polling ───

export interface PollOptions {
  intervalMs?: number;
  maxAttempts?: number;
  onStatusChange?: (status: JobStatusResponse) => void;
}

/**
 * Polls job status until COMPLETED or FAILED.
 * Returns the final status response.
 */
export async function pollJobStatus(
  jobId: string,
  options: PollOptions = {}
): Promise<JobStatusResponse> {
  const { intervalMs = 3000, maxAttempts = 100, onStatusChange } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getJobStatus(jobId);
    onStatusChange?.(status);

    if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Job ${jobId} did not complete within ${maxAttempts} polling attempts`);
}

// ─── Protein Catalog ───

export async function listProteins(params?: {
  category?: string;
  search?: string;
  min_length?: number;
  max_length?: number;
}): Promise<ProteinSummary[]> {
  const res = await api.get<ProteinSummary[]>('/proteins/', { params });
  return res.data;
}

export async function getProteinDetail(proteinId: string): Promise<ProteinDetail> {
  const res = await api.get<ProteinDetail>(`/proteins/${proteinId}`);
  return res.data;
}

export async function getProteinSamples(): Promise<ProteinSample[]> {
  const res = await api.get<ProteinSample[]>('/proteins/samples');
  return res.data;
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const res = await api.get<DatabaseStats>('/proteins/stats');
  return res.data;
}
