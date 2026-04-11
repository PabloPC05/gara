import { useCallback, useMemo, useRef, useState } from 'react'
import { useProteinLoader } from './useProteinLoader'

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

const createEntry = (value = '') => ({ id: crypto.randomUUID(), value })

// Una entrada por cada hélice del mock (MolecularUniverseMock.HELICES).
// Cuando conectes proteínas reales, sustitúyelo por la lista canónica.
const INITIAL_ENTRY_COUNT = 3

const createInitialEntries = () =>
  Array.from({ length: INITIAL_ENTRY_COUNT }, () => createEntry())

/**
 * Estado y operaciones de la lista de entradas híbridas del sidebar.
 * Sólo permite añadir una nueva entrada si todas las existentes son válidas.
 */
export function useCommandEntries() {
  const [entries, setEntries] = useState(createInitialEntries)
  const [focusedId, setFocusedId] = useState(() => entries[0].id)
  const { load, isMock } = useProteinLoader()
  // IDs de entrada cuyo valor ya disparó un submit contra la API: evita
  // relanzar jobs cuando el usuario pulsa + varias veces o reenfoca.
  const submittedRef = useRef(new Set())

  const updateEntry = useCallback((id, value) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, value } : entry)))
  }, [])

  const canAppend = useMemo(() => entries.every((entry) => isValidEntry(entry.value)), [entries])

  const appendEntry = useCallback(() => {
    if (!canAppend) return
    // Modo real: lanza load() por cada entrada nueva que aún no se había
    // enviado. Modo mock: isMock=true y load es no-op, así que nada pasa.
    if (!isMock) {
      for (const entry of entries) {
        if (submittedRef.current.has(entry.id)) continue
        submittedRef.current.add(entry.id)
        load(entry.value).catch(() => {
          // el error queda registrado en el store (errorById);
          // aquí solo evitamos romper el flujo de append.
        })
      }
    }
    const newEntry = createEntry()
    setFocusedId(newEntry.id)
    setEntries((prev) => [...prev, newEntry])
  }, [canAppend, entries, isMock, load])

  return {
    entries,
    focusedId,
    canAppend,
    updateEntry,
    appendEntry,
    focusEntry: setFocusedId,
  }
}
