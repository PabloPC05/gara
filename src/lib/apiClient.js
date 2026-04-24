import { API_BASE_URL } from "@/lib/appConfig";
import { validateApiResponse } from "@/lib/apiSchema";
import { normalizeJobResources } from "@/lib/jobResources";

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_TIMEOUT_MS = 15 * 60 * 1000;
const TERMINAL_JOB_STATUSES = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

export class ApiError extends Error {
	constructor(message, { status, cause } = {}) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		if (cause) this.cause = cause;
	}
}

async function request(path, init = {}) {
	let response;
	try {
		response = await fetch(`${API_BASE_URL}${path}`, {
			headers: { "content-type": "application/json", ...(init.headers ?? {}) },
			...init,
		});
	} catch (cause) {
		throw new ApiError(`Network error calling ${path}`, { cause });
	}
	if (!response.ok) {
		let body = "";
		try {
			body = await response.text();
		} catch {
			// ignore
		}
		throw new ApiError(
			`Request failed: ${response.status} ${response.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`,
			{
				status: response.status,
			},
		);
	}
	try {
		return await response.json();
	} catch (cause) {
		throw new ApiError(`Invalid JSON response from ${path}`, { cause });
	}
}

/**
 * Crea un job de predicción a partir de una secuencia FASTA.
 *
 * @param {string} fastaSequence  Texto FASTA completo (con cabecera ">...")
 * @param {{ gpus?: number, cpus?: number, memory_gb?: number, max_runtime_seconds?: number }} [jobResources]
 * @returns {Promise<{ jobId: string }>}
 */
export async function submitJob(fastaSequence, jobResources) {
	const normalizedResources = jobResources
		? normalizeJobResources(jobResources)
		: null;
	const raw = await request("/jobs/submit", {
		method: "POST",
		body: JSON.stringify({
			fasta_sequence: fastaSequence,
			fasta_filename: "sequence.fasta",
			...(normalizedResources ?? {}),
		}),
	});
	const jobId = raw?.job_id;
	if (!jobId) throw new ApiError("submitJob: respuesta sin job_id");
	return { jobId };
}

const asStringOrNull = (value) => (typeof value === "string" ? value : null);

const asNumberOrNull = (value) => {
	const next = Number(value);
	return Number.isFinite(next) ? next : null;
};

function normalizeCatalogSummary(raw) {
	if (!raw || typeof raw !== "object") return null;

	const proteinId = asStringOrNull(raw.protein_id);
	if (!proteinId) return null;

	return {
		proteinId,
		proteinName: asStringOrNull(raw.protein_name) ?? proteinId,
		uniprotId: asStringOrNull(raw.uniprot_id),
		pdbId: asStringOrNull(raw.pdb_id),
		organism: asStringOrNull(raw.organism) ?? "Unknown",
		length: asNumberOrNull(raw.length),
		category: asStringOrNull(raw.category),
		description: asStringOrNull(raw.description) ?? "",
	};
}

function normalizeCatalogDetail(raw) {
	const summary = normalizeCatalogSummary(raw);
	if (!summary) return null;

	return {
		...summary,
		sequence: asStringOrNull(raw.sequence) ?? "",
		fastaReady: asStringOrNull(raw.fasta_ready) ?? "",
	};
}

/**
 * Busca proteínas en el catálogo público de la API.
 *
 * @param {{ search?: string, category?: string, minLength?: string|number, maxLength?: string|number, limit?: number }} filters
 * @returns {Promise<Array<{
 *   proteinId: string,
 *   proteinName: string,
 *   uniprotId: string|null,
 *   pdbId: string|null,
 *   organism: string,
 *   length: number|null,
 *   category: string|null,
 *   description: string
 * }>>}
 */
export async function searchCatalogProteins({
	search = "",
	category = "",
	minLength = "",
	maxLength = "",
	limit,
} = {}) {
	const params = new URLSearchParams();
	const normalizedLimit =
		Number.isFinite(Number(limit)) && Number(limit) > 0
			? Math.floor(Number(limit))
			: null;

	if (search.trim()) params.set("search", search.trim());
	if (category.trim()) params.set("category", category.trim());
	if (minLength !== "") params.set("min_length", String(minLength));
	if (maxLength !== "") params.set("max_length", String(maxLength));
	if (normalizedLimit) params.set("limit", String(normalizedLimit));

	const qs = params.toString();
	const raw = await request(qs ? `/proteins/?${qs}` : `/proteins/`);

	if (!Array.isArray(raw)) {
		throw new ApiError("searchCatalogProteins: respuesta inválida");
	}

	const results = raw.map(normalizeCatalogSummary).filter(Boolean);
	return normalizedLimit ? results.slice(0, normalizedLimit) : results;
}

/**
 * Obtiene el detalle de una proteína del catálogo, incluyendo `fasta_ready`.
 *
 * @param {string} proteinId
 * @returns {Promise<{
 *   proteinId: string,
 *   proteinName: string,
 *   uniprotId: string|null,
 *   pdbId: string|null,
 *   organism: string,
 *   length: number|null,
 *   category: string|null,
 *   description: string,
 *   sequence: string,
 *   fastaReady: string
 * }>}
 */
export async function getCatalogProteinDetail(proteinId) {
	const trimmed = proteinId?.trim();
	if (!trimmed) {
		throw new ApiError("getCatalogProteinDetail: proteinId requerido");
	}

	const raw = await request(`/proteins/${encodeURIComponent(trimmed)}`);
	const detail = normalizeCatalogDetail(raw);

	if (!detail) {
		throw new ApiError("getCatalogProteinDetail: respuesta inválida");
	}

	return detail;
}

/**
 * Consulta el estado de un job. Si está COMPLETED, obtiene también los
 * outputs (PDB, confianza, datos biológicos) en una segunda llamada.
 * La respuesta pasa por `validateApiResponse` para que el resto de la app
 * trabaje siempre con la forma normalizada del schema.
 *
 * @param {string} jobId
 */
export async function getJob(jobId) {
	const statusRaw = await request(`/jobs/${encodeURIComponent(jobId)}/status`);
	const status = statusRaw?.status ?? "UNKNOWN";

	if (status === "COMPLETED") {
		const outputsRaw = await request(
			`/jobs/${encodeURIComponent(jobId)}/outputs`,
		);
		const result = validateApiResponse(outputsRaw);
		if (!result.valid)
			throw new ApiError(`getJob: respuesta inválida (${result.error})`);
		return result.data;
	}

	const result = validateApiResponse(statusRaw);
	if (!result.valid)
		throw new ApiError(`getJob: respuesta inválida (${result.error})`);
	return result.data;
}

const waitWithAbort = (ms, signal) =>
	new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = setTimeout(() => {
			signal?.removeEventListener?.("abort", onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal?.addEventListener?.("abort", onAbort, { once: true });
	});

/**
 * Polling hasta que el job alcanza un estado terminal (COMPLETED/FAILED/CANCELLED).
 * Respeta AbortSignal para cancelación limpia.
 *
 * @param {string} jobId
 * @param {{ intervalMs?: number, timeoutMs?: number, signal?: AbortSignal, onStatusChange?: (status: string) => void }} [options]
 */
export async function pollJob(
	jobId,
	{
		intervalMs = DEFAULT_POLL_INTERVAL_MS,
		timeoutMs = DEFAULT_POLL_TIMEOUT_MS,
		signal,
		onStatusChange,
	} = {},
) {
	const startedAt = Date.now();
	const safeIntervalMs =
		Number.isFinite(intervalMs) && intervalMs > 0
			? Math.floor(intervalMs)
			: DEFAULT_POLL_INTERVAL_MS;
	const safeTimeoutMs =
		timeoutMs == null || (Number.isFinite(timeoutMs) && timeoutMs > 0)
			? timeoutMs
			: DEFAULT_POLL_TIMEOUT_MS;

	for (;;) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		if (safeTimeoutMs != null && Date.now() - startedAt >= safeTimeoutMs) {
			throw new ApiError(
				`pollJob: timeout esperando estado final para ${jobId}`,
				{ status: 408 },
			);
		}
		const job = await getJob(jobId);
		onStatusChange?.(job.status);
		if (TERMINAL_JOB_STATUSES.has(job.status)) return job;
		await waitWithAbort(safeIntervalMs, signal);
	}
}
