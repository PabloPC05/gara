import { useCallback, useMemo, useState } from 'react'
import { useProteinLoader } from './useProteinLoader'

// ─── Validación de input ──────────────────────────────────────────────────────

const VALID_AMINO_ACIDS = new Set('GAVLIMFWPSTCYNQDEKRH'.split(''))
const PDB_ID_PATTERN    = /^[0-9][a-zA-Z0-9]{3}$/
const MIN_SEQUENCE_LENGTH = 3

/** Extrae la secuencia pura de un bloque FASTA (elimina cabeceras ">..."). */
const extractSequence = (value) =>
  value
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('>'))
    .join('')
    .replace(/\s/g, '')

const isValidSequence = (value) => {
  if (value.length < MIN_SEQUENCE_LENGTH) return false
  return value.toUpperCase().split('').every((c) => VALID_AMINO_ACIDS.has(c))
}

/**
 * Entrada válida = PDB ID de 4 chars (e.g. "1ubq") ó secuencia ≥3 aa
 * usando las 20 letras estándar, con o sin cabecera FASTA.
 */
export const isValidEntry = (value) => {
  const trimmed = value?.trim()
  if (!trimmed) return false
  if (PDB_ID_PATTERN.test(trimmed)) return true
  return isValidSequence(extractSequence(trimmed))
}

// ─── Fábrica de entradas ──────────────────────────────────────────────────────

/**
 * @typedef {Object} Entry
 * @property {string}   id         UUID local
 * @property {string}   value      Texto que el usuario escribió (secuencia / PDB ID)
 * @property {'idle'|'loading'|'loaded'|'error'} status
 * @property {string|null} proteinId  ID en proteinsById una vez cargada
 * @property {string|null} error      Mensaje de error si status === 'error'
 */

/** @returns {Entry} */
const createEntry = (value = '') => ({
  id: crypto.randomUUID(),
  value,
  status: 'idle',
  proteinId: null,
  error: null,
})

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Gestiona la lista de entradas del sidebar y su ciclo de vida completo:
 *   escribir → validar → enviar a API → mostrar resultado en el visor 3D.
 *
 * Cada entrada lleva su propio estado (idle/loading/loaded/error) y el
 * `proteinId` que la enlaza con `proteinsById` en el store global.
 */
export function useCommandEntries() {
  const { load } = useProteinLoader()

  const [entries,  setEntries]  = useState(() => [createEntry()])
  const [focusedId, setFocusedId] = useState(null)

  // ── Edición de texto ────────────────────────────────────────────────────────
  const updateEntry = useCallback((id, value) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e
        // Si el usuario edita una entrada ya cargada/con error, la reinicia
        if (e.status !== 'idle' && e.value !== value) {
          return { ...e, value, status: 'idle', proteinId: null, error: null }
        }
        return { ...e, value }
      }),
    )
  }, [])

  // ── Submit: dispara la carga API ────────────────────────────────────────────
  /**
   * Lanza la carga de la proteína para la entrada `id` con el `value` dado.
   * Actualiza el estado de la entrada durante todo el ciclo.
   */
  const submitEntry = useCallback(async (id, value) => {
    const trimmed = value?.trim()
    if (!trimmed || !isValidEntry(trimmed)) return

    setEntries((prev) =>
      prev.map((e) => e.id === id ? { ...e, status: 'loading', error: null } : e),
    )

    try {
      const proteinId = await load(trimmed)
      if (proteinId) {
        setEntries((prev) =>
          prev.map((e) => e.id === id ? { ...e, status: 'loaded', proteinId } : e),
        )
      } else {
        setEntries((prev) =>
          prev.map((e) => e.id === id
            ? { ...e, status: 'error', error: 'Sin respuesta del servidor' }
            : e,
          ),
        )
      }
    } catch (err) {
      setEntries((prev) =>
        prev.map((e) => e.id === id
          ? { ...e, status: 'error', error: err?.message ?? 'Error desconocido' }
          : e,
        ),
      )
    }
  }, [load])

  // ── Añadir nueva entrada ────────────────────────────────────────────────────
  /**
   * Crea una nueva entrada (opcionalmente con valor inicial) y la focaliza.
   * Si `value` es válido, dispara la carga inmediatamente.
   */
  const appendEntry = useCallback((value = '') => {
    const newEntry = createEntry(value)
    setEntries((prev) => [...prev, newEntry])
    setFocusedId(newEntry.id)

    if (value && isValidEntry(value)) {
      submitEntry(newEntry.id, value)
    }

    return newEntry.id
  }, [submitEntry])

  // ── Eliminar entrada ────────────────────────────────────────────────────────
  const removeEntry = useCallback((id) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      return next.length > 0 ? next : [createEntry()]
    })
    setFocusedId(null)
  }, [])

  const focusEntry = useCallback((id) => setFocusedId(id), [])

  /**
   * El botón "+" está habilitado cuando no hay ninguna entrada vacía idle.
   * Impide tener múltiples inputs vacíos al mismo tiempo.
   */
  const canAppend = useMemo(
    () => entries.every((e) => e.value.trim().length > 0 || e.status === 'loading'),
    [entries],
  )

  return {
    entries,
    focusedId,
    canAppend,
    updateEntry,
    submitEntry,
    appendEntry,
    removeEntry,
    focusEntry,
  }
}
