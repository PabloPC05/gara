import { submitJob, getJob, pollJob, ApiError } from "@/lib/apiClient";

vi.mock("@/lib/appConfig", () => ({
	API_BASE_URL: "http://test-api.local",
}));

vi.mock("@/lib/apiSchema", () => ({
	validateApiResponse: vi.fn((raw) => {
		if (raw.invalid) return { valid: false, error: "bad schema" };
		return { valid: true, data: raw };
	}),
}));

describe("apiClient", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe("ApiError", () => {
		it("carries status and cause", () => {
			const err = new ApiError("test", {
				status: 500,
				cause: new Error("root"),
			});
			expect(err.name).toBe("ApiError");
			expect(err.message).toBe("test");
			expect(err.status).toBe(500);
			expect(err.cause.message).toBe("root");
		});
	});

	describe("submitJob", () => {
		it("returns jobId on success", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ job_id: "j-1" }),
			});

			const result = await submitJob("1UBQ");
			expect(result).toEqual({ jobId: "j-1" });
			expect(global.fetch).toHaveBeenCalledWith(
				"http://test-api.local/jobs/submit",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						fasta_sequence: "1UBQ",
						fasta_filename: "sequence.fasta",
					}),
				}),
			);
		});

		it("throws ApiError when response lacks job_id", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({}),
			});

			await expect(submitJob("test")).rejects.toThrow(ApiError);
		});

		it("throws ApiError on HTTP error", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			await expect(submitJob("test")).rejects.toThrow(/500/);
		});

		it("throws ApiError on network failure", async () => {
			global.fetch = vi
				.fn()
				.mockRejectedValue(new TypeError("Failed to fetch"));

			await expect(submitJob("test")).rejects.toThrow(/Network error/);
		});
	});

	describe("getJob", () => {
		it("returns validated data on success", async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ status: "COMPLETED", job_id: "j-1" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () =>
						Promise.resolve({ status: "COMPLETED", job_id: "j-1", out: true }),
				});

			const result = await getJob("j-1");
			expect(result.status).toBe("COMPLETED");
			expect(result.out).toBe(true);
		});

		it("throws ApiError on invalid schema", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ invalid: true }),
			});

			await expect(getJob("j-1")).rejects.toThrow(/inválida/);
		});

		it("encodes jobId in URL", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ status: "PENDING" }),
			});

			await getJob("job/special");
			expect(global.fetch).toHaveBeenCalledWith(
				"http://test-api.local/jobs/job%2Fspecial/status",
				expect.anything(),
			);
		});
	});

	describe("pollJob", () => {
		it("returns immediately if job is COMPLETED", async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ status: "COMPLETED", job_id: "j-1" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ status: "COMPLETED", job_id: "j-1" }),
				});

			const result = await pollJob("j-1", { intervalMs: 10 });
			expect(result.status).toBe("COMPLETED");
		});

		it("polls until COMPLETED", async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ status: "PENDING", job_id: "j-1" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ status: "RUNNING", job_id: "j-1" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ status: "COMPLETED", job_id: "j-1" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ status: "COMPLETED", job_id: "j-1" }),
				});

			const result = await pollJob("j-1", { intervalMs: 10 });
			expect(result.status).toBe("COMPLETED");
			expect(global.fetch).toHaveBeenCalledTimes(4);
		});

		it("stops on FAILED status", async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ status: "PENDING", job_id: "j-1" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ status: "FAILED", job_id: "j-1" }),
				});

			const result = await pollJob("j-1", { intervalMs: 10 });
			expect(result.status).toBe("FAILED");
		});

		it("fails when timeout is reached", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ status: "PENDING", job_id: "j-1" }),
			});

			await expect(
				pollJob("j-1", { intervalMs: 5, timeoutMs: 20 }),
			).rejects.toThrow(/timeout/);
		});

		it("respects AbortSignal", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ status: "PENDING" }),
			});

			const controller = new AbortController();
			controller.abort();

			await expect(
				pollJob("j-1", { signal: controller.signal, intervalMs: 10 }),
			).rejects.toThrow();
		});
	});
});
