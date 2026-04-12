/**
 * Static biochemical data for "Biochemical Lenses" color themes.
 *
 * All values are from published literature — no network calls needed.
 *   - Kyte-Doolittle hydrophobicity:  J. Mol. Biol. 1982, 157, 105-132
 *   - Side-chain volumes:             Creighton, "Proteins" 2nd ed. (1993)
 *   - Charge at physiological pH 7.4
 */

// ─── Kyte-Doolittle hydrophobicity scale ──────────────────────────────────────
// Range: -4.5 (most hydrophilic) … +4.5 (most hydrophobic)
export const HYDROPHOBICITY = {
  ILE: 4.5, VAL: 4.2, LEU: 3.8, PHE: 2.8, CYS: 2.5,
  MET: 1.9, ALA: 1.8, GLY: -0.4, THR: -0.7, SER: -0.8,
  TRP: -0.9, TYR: -1.3, PRO: -1.6, HIS: -3.2, GLU: -3.5,
  GLN: -3.5, ASP: -3.5, ASN: -3.5, LYS: -3.9, ARG: -4.5,
}

// ─── Electrostatic charge at pH 7.4 ──────────────────────────────────────────
export const CHARGE = {
  ARG: +1, LYS: +1, HIS: +0.1,
  ASP: -1, GLU: -1,
  ALA: 0, ASN: 0, CYS: 0, GLN: 0, GLY: 0,
  ILE: 0, LEU: 0, MET: 0, PHE: 0, PRO: 0,
  SER: 0, THR: 0, TRP: 0, TYR: 0, VAL: 0,
}

// ─── Side-chain volume (Å³, Creighton 1993) ──────────────────────────────────
export const SIDECHAIN_VOLUME = {
  GLY: 0,   ALA: 28, SER: 32, CYS: 49, ASP: 52,
  ASN: 56,  PRO: 58, THR: 64, VAL: 72, MET: 84,
  ILE: 90,  LEU: 90, HIS: 91, PHE: 105, TYR: 116,
  TRP: 142, GLN: 85, GLU: 73, LYS: 105, ARG: 115,
}

// ─── Color interpolation helpers ──────────────────────────────────────────────

function lerp(a, b, t) {
  return a + (b - a) * t
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

function lerpRGB(r1, g1, b1, r2, g2, b2, t) {
  t = clamp01(t)
  return [lerp(r1, r2, t) | 0, lerp(g1, g2, t) | 0, lerp(b1, b2, t) | 0]
}

function toHex(r, g, b) {
  return (r << 16) | (g << 8) | b
}

// ─── Hydrophobicity → color (blue-white-red) ─────────────────────────────────
//   hydrophilic (-4.5) → deep blue  #1e40af
//   neutral      (0)   → white      #f8fafc
//   hydrophobic (+4.5) → deep red   #991b1b

const HYDRO_PHILIC = [30, 64, 175]
const HYDRO_NEUTRAL = [248, 250, 252]
const HYDRO_PHOBIC = [153, 27, 27]

export function hydrophobicityColor(code) {
  const v = HYDROPHOBICITY[code]
  if (v === undefined) return 0xaaaaaa
  const t = (v + 4.5) / 9.0
  if (t < 0.5) {
    const [r, g, b] = lerpRGB(...HYDRO_PHILIC, ...HYDRO_NEUTRAL, t * 2)
    return toHex(r, g, b)
  }
  const [r, g, b] = lerpRGB(...HYDRO_NEUTRAL, ...HYDRO_PHOBIC, (t - 0.5) * 2)
  return toHex(r, g, b)
}

// ─── Charge → discrete colors ────────────────────────────────────────────────
//   positive (+1)  → blue     #2563eb
//   negative (-1)  → red      #dc2626
//   neutral  (0)   → cool gray #94a3b8

export function chargeColor(code) {
  const c = CHARGE[code]
  if (c === undefined) return 0xaaaaaa
  if (c > 0.5) return 0x2563eb
  if (c < -0.5) return 0xdc2626
  return 0x94a3b8
}

// ─── Side-chain volume → color (yellow → orange → purple) ────────────────────
//   small  (0  Å³) → yellow #fbbf24
//   medium (72 Å³) → orange #ea580c
//   large  (142Å³) → purple #7c3aed

const VOL_SMALL = [251, 191, 36]
const VOL_MED = [234, 88, 12]
const VOL_LARGE = [124, 58, 237]

export function sidechainVolumeColor(code) {
  const v = SIDECHAIN_VOLUME[code]
  if (v === undefined) return 0xaaaaaa
  const t = clamp01(v / 142)
  if (t < 0.5) {
    const [r, g, b] = lerpRGB(...VOL_SMALL, ...VOL_MED, t * 2)
    return toHex(r, g, b)
  }
  const [r, g, b] = lerpRGB(...VOL_MED, ...VOL_LARGE, (t - 0.5) * 2)
  return toHex(r, g, b)
}

// ─── Lens registry (used by StyleMenu to build the UI) ────────────────────────
export const BIOCHEMICAL_LENSES = [
  {
    id: 'alphafold-plddt',
    label: 'pLDDT (AlphaFold)',
    description: 'Confianza de predicción por residuo',
  },
  {
    id: 'hydrophobicity-kyte-doolittle',
    label: 'Hidrofobicidad (Kyte-Doolittle)',
    description: 'Azul = hidrofílico, Rojo = hidrofóbico',
  },
  {
    id: 'electrostatic-charge',
    label: 'Carga Electrostática',
    description: 'Azul = positiva, Rojo = negativa, Gris = neutra',
  },
  {
    id: 'side-chain-size',
    label: 'Tamaño Cadena Lateral',
    description: 'Amarillo = pequeña, Naranja = media, Púrpura = grande',
  },
]
