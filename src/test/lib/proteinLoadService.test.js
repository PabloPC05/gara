import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/apiClient", () => ({
	submitJob: vi.fn(),
	pollJob: vi.fn(),
	ApiError: class ApiError extends Error {
		constructor(message, opts = {}) {
			super(message);
			this.name = "ApiError";
			this.cause = opts.cause;
		}
	},
}));

vi.mock("@/lib/proteinAdapter", () => ({
	apiToUnified: vi.fn(),
}));

vi.mock("@/stores/useProteinStore", () => ({
	useProteinStore: {
		getState: vi.fn(() => ({
			upsertProtein: vi.fn(),
			setProteinLoading: vi.fn(),
			setProteinError: vi.fn(),
		})),
	},
}));

vi.mock("@/stores/useLayoutStore", () => ({
	useLayoutStore: {
		getState: vi.fn(() => ({
			jobResources: { gpus: 1 },
		})),
	},
}));

vi.mock("@/stores/useJobStatusStore", () => ({
	useJobStatusStore: {
		getState: vi.fn(() => ({
			upsertJobPanel: vi.fn(),
			clearJobPanel: vi.fn(),
		})),
	},
}));

describe("proteinLoadService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("loadProteinFromInput returns null for empty input", async () => {
		const { loadProteinFromInput } = await import("@/lib/proteinLoadService");
		expect(await loadProteinFromInput("")).toBeNull();
		expect(await loadProteinFromInput("   ")).toBeNull();
		expect(await loadProteinFromInput(null)).toBeNull();
	});

	it("loadProteinFromInput wraps plain sequence as FASTA", async () => {
		const { submitJob } = await import("@/lib/apiClient");
		const { pollJob } = await import("@/lib/apiClient");
		const { apiToUnified } = await import("@/lib/proteinAdapter");

		submitJob.mockResolvedValue({ jobId: "j-1" });
		pollJob.mockResolvedValue({ status: "COMPLETED" });
		apiToUnified.mockReturnValue({ id: "protein-1" });

		const { loadProteinFromInput } = await import("@/lib/proteinLoadService");
		const result = await loadProteinFromInput("ACDEF");

		expect(submitJob).toHaveBeenCalledWith(
			expect.stringContaining(">sequence"),
			expect.anything(),
		);
		expect(result).toBe("protein-1");
	});

	it("loadProteinFromInput preserves existing FASTA header", async () => {
		const { submitJob } = await import("@/lib/apiClient");
		const { pollJob } = await import("@/lib/apiClient");
		const { apiToUnified } = await import("@/lib/proteinAdapter");

		submitJob.mockResolvedValue({ jobId: "j-2" });
		pollJob.mockResolvedValue({ status: "COMPLETED" });
		apiToUnified.mockReturnValue({ id: "protein-2" });

		const { loadProteinFromInput } = await import("@/lib/proteinLoadService");
		await loadProteinFromInput(">my_protein\nACDEF");

		expect(submitJob).toHaveBeenCalledWith(
			">my_protein\nACDEF",
			expect.anything(),
		);
	});

	it("loadProteinFromInput returns null on AbortError", async () => {
		const { submitJob } = await import("@/lib/apiClient");
		submitJob.mockRejectedValue(new DOMException("Aborted", "AbortError"));

		const { loadProteinFromInput } = await import("@/lib/proteinLoadService");
		const result = await loadProteinFromInput("ACDEF");
		expect(result).toBeNull();
	});

	it("loadProteinFromInput sets error on failure", async () => {
		const { submitJob, pollJob } = await import("@/lib/apiClient");
		const { useProteinStore } = await import("@/stores/useProteinStore");

		const setProteinError = vi.fn();
		useProteinStore.getState.mockReturnValue({
			upsertProtein: vi.fn(),
			setProteinLoading: vi.fn(),
			setProteinError,
		});

		submitJob.mockResolvedValue({ jobId: "j-err" });
		pollJob.mockRejectedValue(new Error("Network failure"));

		const { loadProteinFromInput } = await import("@/lib/proteinLoadService");
		await expect(loadProteinFromInput("ACDEF")).rejects.toThrow(
			"Network failure",
		);

		expect(setProteinError).toHaveBeenCalledWith("j-err", "Network failure");
	});
});
