export interface FastaValidation {
  valid: boolean;
  reason?: string;
  length?: number; // number of residues (excluding header and whitespace)
}

export function validateFasta(input: string): FastaValidation {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, reason: 'La secuencia está vacía.' };
  if (!trimmed.startsWith('>')) {
    return { valid: false, reason: 'El FASTA debe empezar con ">" seguido de un encabezado.' };
  }
  const lines = trimmed.split(/\r?\n/);
  const sequence = lines.slice(1).join('').replace(/\s/g, '');
  if (!sequence) return { valid: false, reason: 'Falta la secuencia después del encabezado.' };
  if (trimmed.length > 100_000) return { valid: false, reason: 'Secuencia demasiado larga (máx. 100.000 caracteres).' };
  return { valid: true, length: sequence.length };
}
