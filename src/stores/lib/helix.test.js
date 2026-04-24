import { buildHelixPdb } from "@/lib/helix";

describe("buildHelixPdb", () => {
  it("generates PDB with correct number of ATOM records", () => {
    const pdb = buildHelixPdb(10);
    const atomLines = pdb.split("\n").filter((l) => l.startsWith("ATOM"));
    expect(atomLines).toHaveLength(10);
  });

  it("generates correct number of CONECT records (n-1 bonds)", () => {
    const pdb = buildHelixPdb(5);
    const conectLines = pdb.split("\n").filter((l) => l.startsWith("CONECT"));
    expect(conectLines).toHaveLength(4);
  });

  it("ends with END record", () => {
    const pdb = buildHelixPdb(3);
    const lines = pdb.split("\n");
    expect(lines[lines.length - 1]).toBe("END");
  });

  it("applies offset to coordinates", () => {
    const pdbNoOffset = buildHelixPdb(1, { x: 0, y: 0, z: 0 });
    const pdbOffset = buildHelixPdb(1, { x: 100, y: 200, z: 300 });

    const getCoords = (pdb) => {
      const atomLine = pdb.split("\n").find((l) => l.startsWith("ATOM"));
      return {
        x: parseFloat(atomLine.substring(30, 38)),
        y: parseFloat(atomLine.substring(38, 46)),
        z: parseFloat(atomLine.substring(46, 54)),
      };
    };

    const noOff = getCoords(pdbNoOffset);
    const withOff = getCoords(pdbOffset);

    expect(withOff.x - noOff.x).toBeCloseTo(100, 2);
    expect(withOff.y - noOff.y).toBeCloseTo(200, 2);
    expect(withOff.z - noOff.z).toBeCloseTo(300, 2);
  });

  it("produces valid PDB ATOM line format", () => {
    const pdb = buildHelixPdb(1);
    const atomLine = pdb.split("\n").find((l) => l.startsWith("ATOM"));

    expect(atomLine.substring(0, 6)).toBe("ATOM  ");
    expect(atomLine.substring(12, 16).trim()).toBe("CA");
    expect(atomLine.substring(17, 20).trim()).toBe("ALA");
    expect(atomLine.substring(21, 22)).toBe("A");
  });

  it("generates single residue without CONECT", () => {
    const pdb = buildHelixPdb(1);
    const conectLines = pdb.split("\n").filter((l) => l.startsWith("CONECT"));
    expect(conectLines).toHaveLength(0);
  });

  it("handles zero residues gracefully", () => {
    const pdb = buildHelixPdb(0);
    const atomLines = pdb.split("\n").filter((l) => l.startsWith("ATOM"));
    expect(atomLines).toHaveLength(0);
  });
});
