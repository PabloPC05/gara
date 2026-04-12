/**
 * Metadata for standard amino acids.
 * Maps 3-letter codes to full names, categories, and signature colors.
 */
export const AMINO_ACIDS = {
  'ALA': { name: 'Alanina', category: 'No polar', color: '#94a3b8' },
  'ARG': { name: 'Arginina', category: 'Básico (+)', color: '#2563eb' },
  'ASN': { name: 'Asparagina', category: 'Polar', color: '#06b6d4' },
  'ASP': { name: 'Ácido Aspártico', category: 'Ácido (-)', color: '#dc2626' },
  'CYS': { name: 'Cisteína', category: 'Polar (S)', color: '#fbbf24' },
  'GLN': { name: 'Glutamina', category: 'Polar', color: '#06b6d4' },
  'GLU': { name: 'Ácido Glutámico', category: 'Ácido (-)', color: '#dc2626' },
  'GLY': { name: 'Glicina', category: 'No polar', color: '#94a3b8' },
  'HIS': { name: 'Histidina', category: 'Básico (+)', color: '#3b82f6' },
  'ILE': { name: 'Isoleucina', category: 'No polar', color: '#94a3b8' },
  'LEU': { name: 'Leucina', category: 'No polar', color: '#94a3b8' },
  'LYS': { name: 'Lisina', category: 'Básico (+)', color: '#2563eb' },
  'MET': { name: 'Metionina', category: 'No polar (S)', color: '#94a3b8' },
  'PHE': { name: 'Fenilalanina', category: 'Aromático', color: '#6366f1' },
  'PRO': { name: 'Prolina', category: 'No polar', color: '#94a3b8' },
  'SER': { name: 'Serina', category: 'Polar', color: '#06b6d4' },
  'THR': { name: 'Treonina', category: 'Polar', color: '#06b6d4' },
  'TRP': { name: 'Triptófano', category: 'Aromático', color: '#6366f1' },
  'TYR': { name: 'Tirosina', category: 'Aromático', color: '#6366f1' },
  'VAL': { name: 'Valina', category: 'No polar', color: '#94a3b8' },
}

/**
 * Returns info for a given 3-letter code.
 * Falls back to generic info if the code is unknown.
 */
export function getAminoAcidInfo(code) {
  const normalized = code?.toUpperCase()
  return AMINO_ACIDS[normalized] || {
    name: normalized || 'Desconocido',
    category: 'Otro',
    color: '#cbd5e1'
  }
}

// ─── 1-letter → 3-letter mapping ─────────────────────────────────────────────

const ONE_TO_THREE = {
  A:'ALA', R:'ARG', N:'ASN', D:'ASP', C:'CYS',
  E:'GLU', Q:'GLN', G:'GLY', H:'HIS', I:'ILE',
  L:'LEU', K:'LYS', M:'MET', F:'PHE', P:'PRO',
  S:'SER', T:'THR', W:'TRP', Y:'TYR', V:'VAL',
}

// ─── Average residue masses (Da) + water for peptide bond ────────────────────

const RESIDUE_MASS = {
  A:71.0788, R:156.1875, N:114.1038, D:115.0886, C:103.1388,
  E:129.1155, Q:128.1307, G:57.0519, H:137.1411, I:113.1594,
  L:113.1594, K:128.1741, M:131.1926, F:147.1766, P:97.1167,
  S:87.0782, T:101.1051, W:186.2132, Y:163.1760, V:99.1326,
}

const WATER_MASS = 18.01524

/**
 * Molecular weight of a protein from its 1-letter sequence (Da).
 */
export function calculateMolecularWeight(sequence) {
  const seq = sanitizeSequence(sequence)
  if (seq.length === 0) return 0
  let mw = WATER_MASS
  for (const ch of seq) {
    mw += RESIDUE_MASS[ch] ?? 0
  }
  return mw
}

// ─── Ionizable group pKa values (Bjellqvist / Sillero) ──────────────────────

const PK_NTERM = 8.6
const PK_CTERM = 3.6
const PK_GROUPS = { D:3.65, E:4.25, C:8.18, Y:10.07, H:6.00, K:10.53, R:12.48 }

/**
 * Net charge of a protein at a given pH.
 * Positive groups (protonated): N-term, K, R, H
 * Negative groups (deprotonated): C-term, D, E, C, Y
 */
export function calculateNetCharge(sequence, pH) {
  const seq = sanitizeSequence(sequence)
  if (seq.length === 0) return 0

  let charge = 0

  charge += 10 ** (PK_NTERM - pH) / (1 + 10 ** (PK_NTERM - pH))
  charge -= 1 / (1 + 10 ** (PK_CTERM - pH))

  const counts = countResidues(seq)
  for (const [aa, pKa] of Object.entries(PK_GROUPS)) {
    const n = counts[aa] ?? 0
    if (n === 0) continue
    if (aa === 'K' || aa === 'R' || aa === 'H') {
      charge += n * 10 ** (pKa - pH) / (1 + 10 ** (pKa - pH))
    } else {
      charge -= n / (1 + 10 ** (pKa - pH))
    }
  }

  return charge
}

/**
 * Isoelectric point (pH where net charge = 0) via bisection.
 */
export function calculateIsoelectricPoint(sequence) {
  const seq = sanitizeSequence(sequence)
  if (seq.length === 0) return null

  let lo = 0, hi = 14
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const q = calculateNetCharge(seq, mid)
    if (q > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * Charge profile: array of {pH, charge} from pH 0 to 14.
 */
export function getChargeProfile(sequence, step = 0.5) {
  const seq = sanitizeSequence(sequence)
  const points = []
  for (let pH = 0; pH <= 14 + step * 0.5; pH += step) {
    points.push({ pH: Math.round(pH * 100) / 100, charge: calculateNetCharge(seq, pH) })
  }
  return points
}

/**
 * Counts of each ionizable residue type.
 */
export function countIonizable(sequence) {
  const seq = sanitizeSequence(sequence)
  const counts = countResidues(seq)
  return {
    Asp: counts['D'] ?? 0,
    Glu: counts['E'] ?? 0,
    His: counts['H'] ?? 0,
    Lys: counts['K'] ?? 0,
    Arg: counts['R'] ?? 0,
    Cys: counts['C'] ?? 0,
    Tyr: counts['Y'] ?? 0,
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function sanitizeSequence(seq) {
  if (!seq) return ''
  return String(seq).replace(/[^ACDEFGHIKLMNPQRSTVWY]/gi, '').toUpperCase()
}

function countResidues(seq) {
  const counts = {}
  for (const ch of seq) {
    counts[ch] = (counts[ch] ?? 0) + 1
  }
  return counts
}
