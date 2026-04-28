import { submitJob, pollJob, ApiError } from "@/lib/apiClient";
import { apiToUnified } from "@/lib/proteinAdapter";
import { useJobStatusStore } from "@/stores/useJobStatusStore";
import type { JobPanelKey, JobStatus } from "@/stores/useJobStatusStore";
import { useProteinStore } from "@/stores/useProteinStore";
import { useLayoutStore } from "@/stores/useLayoutStore";

function toFasta(input: string): string {
	const trimmed = input.trim();
	if (trimmed.startsWith(">")) return trimmed;
	return `>sequence\n${trimmed}`;
}

class ProteinLoadJobError extends ApiError {
	jobStatus: string | null;
	jobId: string | null;

	constructor(
		message: string,
		opts: {
			jobStatus?: string | null;
			jobId?: string | null;
			cause?: unknown;
		} = {},
	) {
		super(message, { cause: opts.cause });
		this.name = "ProteinLoadJobError";
		this.jobStatus = opts.jobStatus ?? null;
		this.jobId = opts.jobId ?? null;
	}
}

interface LoadOptions {
	signal?: AbortSignal;
	onStatusChange?: (status: string) => void;
	onJobCreated?: (jobId: string) => void;
	timeoutMs?: number;
}

interface LoadWithPanelOptions {
	panelKey?: JobPanelKey;
	subjectId?: string | null;
	signal?: AbortSignal;
	timeoutMs?: number;
}

interface UnifiedResult {
	id: string;
	[key: string]: unknown;
}

function resolvePollTimeoutMs(
	explicitTimeoutMs: number | undefined,
	maxRuntimeSeconds: unknown,
): number {
	if (Number.isFinite(explicitTimeoutMs) && (explicitTimeoutMs as number) > 0) {
		return Math.floor(explicitTimeoutMs as number);
	}

	const runtimeSeconds = Number(maxRuntimeSeconds);
	if (!Number.isFinite(runtimeSeconds) || runtimeSeconds <= 0) {
		return 15 * 60 * 1000;
	}

	const bufferMs = 2 * 60 * 1000;
	return Math.floor(runtimeSeconds * 1000 + bufferMs);
}

export async function loadProteinFromInput(
	input: string,
	opts: LoadOptions = {},
): Promise<string | null> {
	const trimmed = input?.trim();
	if (!trimmed) return null;

	const {
		upsertProtein,
		setProteinLoading,
		setProteinError,
		clearProteinLoadingByJobId,
	} =
		useProteinStore.getState();

	let jobId: string | null = null;
	try {
		const fasta = toFasta(trimmed);
		const state: any = useLayoutStore.getState();
		const pollTimeoutMs = resolvePollTimeoutMs(
			opts.timeoutMs,
			state?.jobResources?.max_runtime_seconds,
		);
		const submission = await submitJob(fasta, state.jobResources);
		jobId = submission.jobId;
		if (!jobId) {
			throw new ApiError("La API no devolvió jobId al crear el trabajo");
		}
		opts.onJobCreated?.(jobId);
		setProteinLoading(jobId);

		const job: any = await pollJob(jobId, {
			signal: opts.signal,
			onStatusChange: opts.onStatusChange,
			timeoutMs: pollTimeoutMs,
		});
		if (job?.status !== "COMPLETED") {
			throw new ProteinLoadJobError(
				`Job ${jobId} terminó con estado ${job?.status}`,
				{ jobStatus: job?.status, jobId },
			);
		}

		const unified = apiToUnified(job, fasta as any) as UnifiedResult | null;
		if (!unified) {
			throw new ApiError("Respuesta de la API sin datos suficientes");
		}

		const proteinId =
			typeof unified.id === "string" && unified.id.length > 0
				? unified.id
				: null;
		if (!proteinId) {
			throw new ApiError("Respuesta de la API sin identificador de proteína");
		}

		setProteinLoading(jobId, proteinId);
		upsertProtein(unified as any);
		if (proteinId !== jobId) {
			clearProteinLoadingByJobId(jobId);
		}
		return proteinId;
	} catch (error: unknown) {
		if (error instanceof DOMException && error.name === "AbortError")
			return null;
		if (jobId) {
			const msg = error instanceof Error ? error.message : "Error desconocido";
			setProteinError(jobId, msg);
		}
		throw error;
	}
}

export async function loadProteinFromInputWithJobPanel(
	input: string,
	opts: LoadWithPanelOptions = {},
): Promise<string | null> {
	const trimmed = input?.trim();
	if (!trimmed) return null;

	const { upsertJobPanel, clearJobPanel } = useJobStatusStore.getState();

	if (opts.panelKey) {
		upsertJobPanel(opts.panelKey, {
			status: "PENDING" as JobStatus,
			error: null,
			jobId: undefined,
			subjectId: opts.subjectId ?? undefined,
		});
	}

	try {
		const loadedProteinId = await loadProteinFromInput(trimmed, {
			signal: opts.signal,
			timeoutMs: opts.timeoutMs,
			onJobCreated: (jid: string) => {
				if (!opts.panelKey) return;
				useJobStatusStore
					.getState()
					.upsertJobPanel(opts.panelKey, { jobId: jid });
			},
			onStatusChange: (status: string) => {
				if (!opts.panelKey) return;
				useJobStatusStore.getState().upsertJobPanel(opts.panelKey, {
					status: status as JobStatus,
					error: null,
				});
			},
		});

		if (opts.panelKey) {
			clearJobPanel(opts.panelKey);
		}

		return loadedProteinId;
	} catch (error: unknown) {
		if (opts.panelKey) {
			const loadError = error as ProteinLoadJobError;
			const resolvedJobId =
				typeof loadError?.jobId === "string" && loadError.jobId.length > 0
					? loadError.jobId
					: undefined;
			useJobStatusStore.getState().upsertJobPanel(opts.panelKey, {
				status: (loadError.jobStatus === "CANCELLED"
					? "CANCELLED"
					: "FAILED") as JobStatus,
				error: loadError?.message ?? "No se pudo procesar la proteína",
				jobId: resolvedJobId,
				subjectId: undefined,
			});
		}

		throw error;
	}
}
