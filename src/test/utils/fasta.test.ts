import { validateFasta } from "@/utils/fasta";

describe("validateFasta", () => {
  it("rejects empty input", () => {
    const result = validateFasta("");
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("rejects whitespace-only input", () => {
    const result = validateFasta("   ");
    expect(result.valid).toBe(false);
  });

  it("rejects input without header line", () => {
    const result = validateFasta("ACGT");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('">"');
  });

  it("rejects header without sequence", () => {
    const result = validateFasta(">my_sequence");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("secuencia");
  });

  it("accepts a valid FASTA with single-line sequence", () => {
    const result = validateFasta(">sp|P0CG47|UBC\nMKQVESTAGL");
    expect(result.valid).toBe(true);
    expect(result.length).toBe(10);
  });

  it("accepts a valid FASTA with multi-line sequence", () => {
    const input = ">my_protein\nMKQVE\nSTAGL\nVVPTS";
    const result = validateFasta(input);
    expect(result.valid).toBe(true);
    expect(result.length).toBe(15);
  });

  it("strips whitespace from sequence when counting length", () => {
    const input = ">test\nMKQ VE\nSTAG L";
    const result = validateFasta(input);
    expect(result.valid).toBe(true);
    expect(result.length).toBe(10);
  });

  it("rejects input exceeding 100k characters", () => {
    const longSeq = "A".repeat(100_001);
    const input = `>test\n${longSeq}`;
    const result = validateFasta(input);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("100.000");
  });

  it("accepts input at exactly 100k characters", () => {
    const header = ">t";
    const seq = "A".repeat(100_000 - header.length - 1);
    const input = `${header}\n${seq}`;
    const result = validateFasta(input);
    expect(result.valid).toBe(true);
  });

  it("handles Windows line endings (CRLF)", () => {
    const input = ">test\r\nMKQVESTAGL";
    const result = validateFasta(input);
    expect(result.valid).toBe(true);
    expect(result.length).toBe(10);
  });
});
