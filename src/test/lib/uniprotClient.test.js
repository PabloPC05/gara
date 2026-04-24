import { describe, it, expect, vi, beforeEach } from "vitest";

describe("uniprotClient", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("searchUniprotFasta returns reviewed entry first", async () => {
		const reviewedFasta =
			">sp|P0DJI8|HBA_HUMAN Hemoglobin subunit alpha\nMVLSPADKTN";
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(reviewedFasta),
				}),
			),
		);

		const { searchUniprotFasta } = await import("@/lib/uniprotClient");
		const result = await searchUniprotFasta("hemoglobin");
		expect(result).toBe(reviewedFasta);
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it("searchUniprotFasta falls back to any entry if reviewed returns nothing", async () => {
		const anyFasta = ">tr|XYZ|Some protein\nACDEF";
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve(""),
				})
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve(anyFasta),
				}),
		);

		const { searchUniprotFasta } = await import("@/lib/uniprotClient");
		const result = await searchUniprotFasta("myoglobin");
		expect(result).toBe(anyFasta);
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});

	it("searchUniprotFasta throws when nothing found", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve({
					ok: true,
					text: () => Promise.resolve(""),
				}),
			),
		);

		const { searchUniprotFasta } = await import("@/lib/uniprotClient");
		await expect(searchUniprotFasta("nonexistent")).rejects.toThrow(
			"No se encontró",
		);
	});

	it("searchUniprotFasta throws on non-ok response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve({
					ok: false,
					status: 500,
					text: () => Promise.resolve(""),
				}),
			),
		);

		const { searchUniprotFasta } = await import("@/lib/uniprotClient");
		await expect(searchUniprotFasta("test")).rejects.toThrow("500");
	});
});
