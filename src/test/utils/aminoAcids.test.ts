import {
  calculateMolecularWeight,
  calculateNetCharge,
  calculateIsoelectricPoint,
  getChargeProfile,
  countIonizable,
} from "@/utils/aminoAcids";

describe("calculateMolecularWeight", () => {
  it("returns 0 for empty sequence", () => {
    expect(calculateMolecularWeight("")).toBe(0);
    expect(calculateMolecularWeight(null)).toBe(0);
    expect(calculateMolecularWeight(undefined)).toBe(0);
  });

  it("calculates MW for a single alanine", () => {
    const mw = calculateMolecularWeight("A");
    expect(mw).toBeCloseTo(71.0788 + 18.01524, 2);
  });

  it("calculates MW for insulin A-chain (21 aa)", () => {
    const seq = "GIVEQCCTSICSLYQLENYCN";
    const mw = calculateMolecularWeight(seq);
    expect(mw).toBeCloseTo(2383.7, 0);
  });

  it("ignores non-standard characters", () => {
    const mw1 = calculateMolecularWeight("A");
    const mw2 = calculateMolecularWeight("AXJ*A");
    expect(mw2).toBeCloseTo(mw1 * 2 - 18.01524, 2);
  });
});

describe("calculateNetCharge", () => {
  it("returns 0 for empty sequence", () => {
    expect(calculateNetCharge("", 7)).toBe(0);
  });

  it("positive charge at very low pH", () => {
    const charge = calculateNetCharge("KKKK", 1);
    expect(charge).toBeGreaterThan(0);
  });

  it("negative charge at very high pH", () => {
    const charge = calculateNetCharge("DDDD", 13);
    expect(charge).toBeLessThan(0);
  });

  it("net charge crosses zero between low and high pH", () => {
    const seq = "MSTRSSQMAK";
    const chargeLow = calculateNetCharge(seq, 0);
    const chargeHigh = calculateNetCharge(seq, 14);
    expect(chargeLow).toBeGreaterThan(0);
    expect(chargeHigh).toBeLessThan(0);
  });

  it("charge at pH 7 for a simple acidic protein", () => {
    const charge = calculateNetCharge("DDDDDD", 7);
    expect(charge).toBeLessThan(-3);
  });

  it("charge at pH 7 for a simple basic protein", () => {
    const charge = calculateNetCharge("KKKKKK", 7);
    expect(charge).toBeGreaterThan(3);
  });
});

describe("calculateIsoelectricPoint", () => {
  it("returns null for empty sequence", () => {
    expect(calculateIsoelectricPoint("")).toBeNull();
    expect(calculateIsoelectricPoint(null)).toBeNull();
  });

  it("returns a value between 0 and 14", () => {
    const pI = calculateIsoelectricPoint("MSTRSSQMAK");
    expect(pI).toBeGreaterThanOrEqual(0);
    expect(pI).toBeLessThanOrEqual(14);
  });

  it("gives acidic pI for protein rich in acidic residues", () => {
    const pI = calculateIsoelectricPoint("DDDDEEEE");
    expect(pI).toBeLessThan(5);
  });

  it("gives basic pI for protein rich in basic residues", () => {
    const pI = calculateIsoelectricPoint("KKKKRRRR");
    expect(pI).toBeGreaterThan(10);
  });

  it("pI is consistent with net charge ≈ 0", () => {
    const seq = "GIVEQCCTSICSLYQLENYCN";
    const pI = calculateIsoelectricPoint(seq);
    const charge = calculateNetCharge(seq, pI);
    expect(Math.abs(charge)).toBeLessThan(0.01);
  });
});

describe("getChargeProfile", () => {
  it("returns profile with correct number of points (step 0.5)", () => {
    const profile = getChargeProfile("MSTRSSQMAK", 0.5);
    expect(profile.length).toBe(29);
  });

  it("returns profile with correct number of points (step 0.25)", () => {
    const profile = getChargeProfile("MSTRSSQMAK", 0.25);
    expect(profile.length).toBe(57);
  });

  it("first point is at pH 0, last at pH 14", () => {
    const profile = getChargeProfile("AK", 1);
    expect(profile[0].pH).toBe(0);
    expect(profile[profile.length - 1].pH).toBe(14);
  });

  it("charge decreases monotonically for simple sequences", () => {
    const profile = getChargeProfile("KKKKDDDD", 1);
    for (let i = 1; i < profile.length; i++) {
      expect(profile[i].charge).toBeLessThanOrEqual(
        profile[i - 1].charge + 0.001,
      );
    }
  });
});

describe("countIonizable", () => {
  it("returns all zeros for empty sequence", () => {
    const counts = countIonizable("");
    expect(counts).toEqual({
      Asp: 0,
      Glu: 0,
      His: 0,
      Lys: 0,
      Arg: 0,
      Cys: 0,
      Tyr: 0,
    });
  });

  it("counts ionizable residues correctly", () => {
    const counts = countIonizable("DDDEEEHHKKRRRCCYY");
    expect(counts.Asp).toBe(3);
    expect(counts.Glu).toBe(3);
    expect(counts.His).toBe(2);
    expect(counts.Lys).toBe(2);
    expect(counts.Arg).toBe(3);
    expect(counts.Cys).toBe(2);
    expect(counts.Tyr).toBe(2);
  });

  it("ignores non-ionizable residues", () => {
    const counts = countIonizable("AAAAGGGG");
    expect(counts.Asp).toBe(0);
    expect(counts.Glu).toBe(0);
    expect(counts.His).toBe(0);
    expect(counts.Lys).toBe(0);
    expect(counts.Arg).toBe(0);
  });
});
