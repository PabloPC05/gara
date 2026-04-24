import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubGlobal(
	"fetch",
	vi.fn(() =>
		Promise.resolve({
			ok: true,
			status: 200,
			statusText: "OK",
			text: () => Promise.resolve("ATOM  line data\nEND"),
			json: () => Promise.resolve({}),
		}),
	),
);

describe("rcsbClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("fetchStructureById rejects invalid PDB IDs", async () => {
		const { fetchStructureById } = await import("@/lib/rcsbClient");
		await expect(fetchStructureById("abc")).rejects.toThrow("PDB ID inv");
		await expect(fetchStructureById("12")).rejects.toThrow("PDB ID inv");
		await expect(fetchStructureById("")).rejects.toThrow("PDB ID inv");
	});

	it("fetchStructureById fetches from RCSB download URL", async () => {
		const { fetchStructureById } = await import("@/lib/rcsbClient");
		const result = await fetchStructureById("1CRN");

		expect(global.fetch).toHaveBeenCalledWith(
			"https://files.rcsb.org/download/1CRN.pdb",
		);
		expect(result.format).toBe("pdb");
		expect(result.text).toContain("ATOM");
	});

	it("fetchStructureById normalizes PDB ID to uppercase", async () => {
		const { fetchStructureById } = await import("@/lib/rcsbClient");
		await fetchStructureById("1crn");

		expect(global.fetch).toHaveBeenCalledWith(
			"https://files.rcsb.org/download/1CRN.pdb",
		);
	});

	it("fetchStructureById throws on non-ok response", async () => {
		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: "Not Found",
		});

		const { fetchStructureById } = await import("@/lib/rcsbClient");
		await expect(fetchStructureById("1CRN")).rejects.toThrow("404");
	});

	it("fetchStructureById caches results", async () => {
		const { fetchStructureById } = await import("@/lib/rcsbClient");
		await fetchStructureById("1CRN");
		await fetchStructureById("1CRN");

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it("fetchStructureById supports CIF format", async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve("data_test\nloop_\nEND"),
		});

		const { fetchStructureById } = await import("@/lib/rcsbClient");
		const result = await fetchStructureById("1CRN", "cif");

		expect(global.fetch).toHaveBeenCalledWith(
			"https://files.rcsb.org/download/1CRN.cif",
		);
		expect(result.format).toBe("mmcif");
	});

	it("fetchMetadataById returns normalized metadata", async () => {
		global.fetch
			.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						struct: { title: "Crambin" },
						exptl: [{ method: "X-RAY DIFFRACTION" }],
						rcsb_entry_info: { resolution_combined: [1.5] },
					}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						rcsb_entity_source_organism: [
							{ scientific_name: "Crambe hispanica" },
						],
						rcsb_polymer_entity: {
							pdbx_number_of_monomers_in_structure: 46,
						},
					}),
			});

		const { fetchMetadataById } = await import("@/lib/rcsbClient");
		const meta = await fetchMetadataById("1CRN");

		expect(meta.title).toBe("Crambin");
		expect(meta.organism).toBe("Crambe hispanica");
		expect(meta.method).toBe("X-RAY DIFFRACTION");
		expect(meta.resolution).toBe(1.5);
		expect(meta.length).toBe(46);
	});

	it("fetchMetadataById handles missing data gracefully", async () => {
		global.fetch
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) });

		const { fetchMetadataById } = await import("@/lib/rcsbClient");
		const meta = await fetchMetadataById("1CRN");

		expect(meta.title).toBe("1CRN");
		expect(meta.organism).toBeNull();
		expect(meta.method).toBeNull();
		expect(meta.resolution).toBeNull();
	});
});
