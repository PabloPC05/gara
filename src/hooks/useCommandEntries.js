import { useCallback, useMemo, useState } from 'react'

const VALID_AMINO_ACIDS = new Set('GAVLIMFWPSTCYNQDEKRH'.split(''))
const PDB_ID_PATTERN = /^[0-9][a-zA-Z0-9]{3}$/
const MIN_SEQUENCE_LENGTH = 3

const isValidSequence = (value) => {
  if (value.length < MIN_SEQUENCE_LENGTH) return false
  return value.toUpperCase().split('').every((char) => VALID_AMINO_ACIDS.has(char))
}

/**
 * Una entrada "con lógica" es un PDB ID de 4 caracteres (1ubq, 6lu7...)
 * o una secuencia de al menos 3 aminoácidos usando las 20 letras estándar.
 */
export const isValidEntry = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return false
  return PDB_ID_PATTERN.test(trimmed) || isValidSequence(trimmed)
}

const createEntry = () => ({ id: crypto.randomUUID(), value: '' })

/**
 * Estado y operaciones de la lista de entradas híbridas del sidebar.
 * Sólo permite añadir una nueva entrada si todas las existentes son válidas.
 */
export function useCommandEntries() {
  const [entries, setEntries] = useState(() => [createEntry()])
  const [focusedId, setFocusedId] = useState(() => entries[0].id)

  const updateEntry = useCallback((id, value) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, value } : entry)))
  }, [])

  const canAppend = useMemo(() => entries.every((entry) => isValidEntry(entry.value)), [entries])

  const appendEntry = useCallback(() => {
    setEntries((prev) => {
      if (!prev.every((entry) => isValidEntry(entry.value))) return prev
      const newEntry = createEntry()
      setFocusedId(newEntry.id)
      return [...prev, newEntry]
    })
  }, [])

  return {
    entries,
    focusedId,
    canAppend,
    updateEntry,
    appendEntry,
    focusEntry: setFocusedId,
  }
}
