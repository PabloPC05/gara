import { isValidEntry } from '@/hooks/useCommandEntries'

describe('isValidEntry', () => {
  it('accepts valid 4-char PDB IDs', () => {
    expect(isValidEntry('1ubq')).toBe(true)
    expect(isValidEntry('6lu7')).toBe(true)
    expect(isValidEntry('1UBQ')).toBe(true)
  })

  it('accepts valid amino acid sequences >= 3 chars', () => {
    expect(isValidEntry('MKQ')).toBe(true)
    expect(isValidEntry('MKQVESTAGL')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidEntry('')).toBe(false)
  })

  it('rejects whitespace-only', () => {
    expect(isValidEntry('   ')).toBe(false)
  })

  it('rejects PDB IDs that do not match pattern', () => {
    expect(isValidEntry('1u')).toBe(false)
    expect(isValidEntry('12abc')).toBe(false)
    expect(isValidEntry('abcd')).toBe(false)
    expect(isValidEntry('12345')).toBe(false)
  })

  it('rejects sequences shorter than 3 residues', () => {
    expect(isValidEntry('MK')).toBe(false)
    expect(isValidEntry('A')).toBe(false)
  })

  it('rejects sequences with non-amino-acid characters', () => {
    expect(isValidEntry('MKQX')).toBe(false)
    expect(isValidEntry('MKQ!')).toBe(false)
    expect(isValidEntry('ABCD')).toBe(false)
  })

  it('trims whitespace before validation', () => {
    expect(isValidEntry('  1ubq  ')).toBe(true)
    expect(isValidEntry('  MKQ  ')).toBe(true)
  })

  it('accepts all 20 standard amino acids', () => {
    expect(isValidEntry('GAVLIMFWPSTCYNQDEKRH')).toBe(true)
  })

  it('rejects sequences with B, J, O, U, X, Z (non-standard)', () => {
    expect(isValidEntry('BJO')).toBe(false)
    expect(isValidEntry('UXZ')).toBe(false)
  })
})
