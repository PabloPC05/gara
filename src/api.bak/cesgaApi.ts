import { ApiError, api } from '@/api/client';
import type {
  SubmitJobPayload,
  SubmitJobResponse,
  JobStatusResponse,
  JobOutputsResponse,
  JobStatus,
  ProteinSample,
} from '@/api/types';

export async function submitJob(payload: SubmitJobPayload): Promise<SubmitJobResponse> {
  const { data } = await api.post<SubmitJobResponse>('/jobs/submit', payload);
  return data;
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const { data } = await api.get<JobStatusResponse>(`/jobs/${jobId}/status`);
  return data;
}

export async function getJobOutputs(jobId: string): Promise<JobOutputsResponse> {
  const { data } = await api.get<JobOutputsResponse>(`/jobs/${jobId}/outputs`);
  return data;
}

export async function getProteinSamples(): Promise<ProteinSample[]> {
  const { data } = await api.get<ProteinSample[]>('/proteins/samples');
  return data;
}

// ─── Polling ───

const TERMINAL: JobStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED'];

interface PollOptions {
  intervalMs?: number;  // default 2500 ms
  timeoutMs?: number;   // default 5 min — raise to hours for real CESGA jobs
  onStatusChange?: (s: JobStatusResponse) => void;
}

export async function pollJobStatus(
  jobId: string,
  { intervalMs = 2500, timeoutMs = 5 * 60_000, onStatusChange }: PollOptions = {},
): Promise<JobStatusResponse> {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    if (Date.now() > deadline) {
      throw new ApiError('El trabajo ha superado el tiempo máximo de espera. Cancela e inténtalo de nuevo.');
    }
    const status = await getJobStatus(jobId);
    onStatusChange?.(status);
    if (TERMINAL.includes(status.status)) return status;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
