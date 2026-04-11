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
