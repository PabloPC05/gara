/**
 * Utilidades compartidas para extracción de secuencias de aminoácidos.
 * Usadas tanto por importStructure.js como por proteinAdapter.js.
 */

export const THREE_TO_ONE = {
  ALA: "A",
  ARG: "R",
  ASN: "N",
  ASP: "D",
  CYS: "C",
  GLN: "Q",
  GLU: "E",
  GLY: "G",
  HIS: "H",
  ILE: "I",
  LEU: "L",
  LYS: "K",
  MET: "M",
  PHE: "F",
  PRO: "P",
  SER: "S",
  THR: "T",
  TRP: "W",
  TYR: "Y",
  VAL: "V",
  SEC: "U",
  PYL: "O",
  MSE: "M",
};

/**
 * Extrae la secuencia de aminoácidos (letras simples) de un texto PDB
 * leyendo los átomos CA de los registros ATOM/HETATM.
 * @param {string|null} pdbData
 * @returns {string|null}
 */
export function extractSequenceFromPdb(pdbData) {
  if (!pdbData || typeof pdbData !== "string") return null;
  const residues = [];
  for (const line of pdbData.split("\n")) {
    if (line.length < 27) continue;
    const rec = line.substring(0, 6);
    if (rec !== "ATOM  " && rec !== "HETATM") continue;
    const atomName = line.substring(12, 16).trim();
    if (atomName !== "CA") continue;
    const resName = line.substring(17, 20).trim();
    const one = THREE_TO_ONE[resName];
    if (one) residues.push(one);
  }
  return residues.length > 0 ? residues.join("") : null;
}
