import { useCallback, useMemo, useRef, useState } from 'react'
import { useProteinLoader } from './useProteinLoader'
import { MOCK_HELIX_LAYOUTS } from '@/data/mockProteinCatalog'

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

const toEntrySignature = (value = '') => value.trim().toUpperCase()

const createEntry = ({ value = '', proteinId = null, submittedSignature = null } = {}) => ({
  id: crypto.randomUUID(),
  value,
  proteinId,
  submittedSignature,
})

const INITIAL_ENTRY_COUNT = 3

const createInitialEntries = (isMock) => {
  if (isMock) {
    return MOCK_HELIX_LAYOUTS.map((layout) => createEntry({ proteinId: layout.id }))
  }
  return Array.from({ length: INITIAL_ENTRY_COUNT }, () => createEntry())
}

/**
 * Estado y operaciones de la lista de entradas híbridas del sidebar.
 * Sólo permite añadir una nueva entrada si todas las existentes son válidas.
 */
export function useCommandEntries() {
  const { load, isMock } = useProteinLoader()
  const [entries, setEntries] = useState(() => createInitialEntries(isMock))
  const [focusedId, setFocusedId] = useState(() => entries[0]?.id ?? null)
  const inFlightByEntryIdRef = useRef(new Set())

  const updateEntry = useCallback((id, value) => {
    const nextSignature = toEntrySignature(value)
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry
        if (entry.submittedSignature && entry.submittedSignature !== nextSignature) {
          return { ...entry, value, proteinId: null, submittedSignature: null }
        }
        return { ...entry, value }
      }),
    )
  }, [])

  const canAppend = useMemo(() => entries.every((entry) => isValidEntry(entry.value)), [entries])

  const appendEntry = useCallback(() => {
    if (!canAppend) return

    if (!isMock) {
      for (const entry of entries) {
        const signature = toEntrySignature(entry.value)
        if (!signature) continue
        if (inFlightByEntryIdRef.current.has(entry.id)) continue
        if (entry.proteinId && entry.submittedSignature === signature) continue

        inFlightByEntryIdRef.current.add(entry.id)
        load(entry.value)
          .then((proteinId) => {
            if (!proteinId) return
            setEntries((prev) =>
              prev.map((current) => {
                if (current.id !== entry.id) return current
                if (toEntrySignature(current.value) !== signature) return current
                return { ...current, proteinId, submittedSignature: signature }
              }),
            )
          })
          .catch(() => {
            // el error queda registrado en el store (errorById);
            // aquí solo evitamos romper el flujo de append.
          })
          .finally(() => {
            inFlightByEntryIdRef.current.delete(entry.id)
          })
      }
    }

    const nextMockProteinId = isMock ? MOCK_HELIX_LAYOUTS[entries.length]?.id ?? null : null
    const newEntry = createEntry({ proteinId: nextMockProteinId })
    setEntries((prev) => [...prev, newEntry])
    setFocusedId(newEntry.id)
  }, [canAppend, entries, isMock, load])

  const focusEntry = useCallback((id) => {
    setFocusedId(id)
  }, [])

  return {
    entries,
    focusedId,
    canAppend,
    updateEntry,
    appendEntry,
    focusEntry,
  }
}
