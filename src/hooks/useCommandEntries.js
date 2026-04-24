// ─── Validación de input ──────────────────────────────────────────────────────

const VALID_AMINO_ACIDS = new Set("GAVLIMFWPSTCYNQDEKRH".split(""));
const PDB_ID_PATTERN = /^[0-9][a-zA-Z0-9]{3}$/;
const MIN_SEQUENCE_LENGTH = 3;

/** Extrae la secuencia pura de un bloque FASTA (elimina cabeceras ">..."). */
const extractSequence = (value) =>
  value
    .split("\n")
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("")
    .replace(/\s/g, "");

const isValidSequence = (value) => {
  if (value.length < MIN_SEQUENCE_LENGTH) return false;
  return value
    .toUpperCase()
    .split("")
    .every((c) => VALID_AMINO_ACIDS.has(c));
};

/**
 * Entrada válida = PDB ID de 4 chars (e.g. "1ubq") ó secuencia ≥3 aa
 * usando las 20 letras estándar, con o sin cabecera FASTA.
 */
export const isValidEntry = (value) => {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  if (PDB_ID_PATTERN.test(trimmed)) return true;
  return isValidSequence(extractSequence(trimmed));
};
