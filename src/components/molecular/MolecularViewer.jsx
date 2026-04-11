import { useEffect, useRef } from 'react'
import { use3DmolViewer } from '../../hooks/use3DmolViewer'
import { useProteinStore } from '../../stores/useProteinStore'
import ViewerCanvas from './ViewerCanvas'

// Paleta cíclica para distinguir proteínas cuando hay varias en escena.
const PROTEIN_COLORS = [
  0x3b82f6, 0x10b981, 0xec4899, 0xf59e0b,
  0x8b5cf6, 0x06b6d4, 0xef4444, 0x14b8a6,
]
const HALO_COLOR = 0xfde047

// Radios de picking: idénticos al visor mock para coherencia UX.
const PICK_BBOX_PADDING_PX = 10
const PICK_NEAREST_FALLBACK_PX = 25

const baseStyle = (color) => ({
  cartoon: { color, opacity: 0.95, thickness: 0.6, style: 'edged' },
  stick: { color, radius: 0.15, hidden: false },
})

const haloStyle = {
  cartoon: { color: HALO_COLOR, opacity: 0.35 },
  sphere: { color: HALO_COLOR, radius: 1.1, opacity: 0.25 },
}

const applyEntryStyle = (entry, isActive) => {
  entry.model.setStyle({}, baseStyle(entry.color))
  if (isActive) entry.model.setStyle({}, haloStyle, true)
}

const computeCentroid = (model) => {
  const atoms = model.selectedAtoms({})
  if (atoms.length === 0) return { x: 0, y: 0, z: 0 }
  let x = 0, y = 0, z = 0
  for (const atom of atoms) {
    x += atom.x
    y += atom.y
    z += atom.z
  }
  return { x: x / atoms.length, y: y / atoms.length, z: z / atoms.length }
}

const translateModelAtoms = (model, dx, dy, dz) => {
  const atoms = model.selectedAtoms({})
  for (const atom of atoms) {
    atom.x += dx
    atom.y += dy
    atom.z += dz
  }
}

// Rotación rígida: yaw en torno al eje Y del mundo, pitch en torno al X.
// Preserva todas las distancias → la forma no se deforma, solo el ángulo.
const rotateModelAroundCentroid = (model, c, yaw, pitch) => {
  const atoms = model.selectedAtoms({})
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  for (const atom of atoms) {
    let dx = atom.x - c.x
    let dy = atom.y - c.y
    let dz = atom.z - c.z
    const rx = cy * dx + sy * dz
    const rz = -sy * dx + cy * dz
    dx = rx
    dz = rz
    const ry = cp * dy - sp * dz
    const rz2 = sp * dy + cp * dz
    dy = ry
    dz = rz2
    atom.x = c.x + dx
    atom.y = c.y + dy
    atom.z = c.z + dz
  }
}

/**
 * Sincroniza el Map de entries con el catálogo del store:
 *  - Quita los modelos cuya proteína ya no está en `proteinsById`.
 *  - Añade modelos nuevos para proteínas recién cargadas.
 * Devuelve `true` si hubo cambios, para disparar zoomTo desde fuera.
 */
function syncModels(viewer, modelMap, proteinsById, selectedIds) {
  let dirty = false

  for (const [id, entry] of modelMap) {
    if (!proteinsById[id]) {
      try {
        viewer.removeModel(entry.model)
      } catch (_) {
        // si el viewer ya descartó el modelo, ignoramos
      }
      modelMap.delete(id)
      dirty = true
    }
  }

  const ids = Object.keys(proteinsById)
  let colorIndex = 0
  for (const id of ids) {
    if (modelMap.has(id)) {
      colorIndex++
      continue
    }
    const protein = proteinsById[id]
    if (!protein?.pdbData) {
      colorIndex++
      continue
    }
    const color = PROTEIN_COLORS[colorIndex % PROTEIN_COLORS.length]
    const model = viewer.addModel(protein.pdbData, 'pdb')
    const entry = { id, model, color }
    applyEntryStyle(entry, selectedIds.includes(id))
    modelMap.set(id, entry)
    dirty = true
    colorIndex++
  }

  return dirty
}

export default function MolecularViewer({ background = '#ffffff' }) {
  const proteinsById = useProteinStore((state) => state.proteinsById)
  const selectedProteinIds = useProteinStore((state) => state.selectedProteinIds)
  const setSelectedProteinIds = useProteinStore((state) => state.setSelectedProteinIds)
  const toggleProteinSelection = useProteinStore((state) => state.toggleProteinSelection)
  const clearSelection = useProteinStore((state) => state.clearSelection)

  // Refs en vivo para que los listeners (registrados una vez) lean siempre
  // el estado actual del store sin capturarlo por closure.
  const selectedProteinIdsRef = useRef(selectedProteinIds)
  useEffect(() => {
    selectedProteinIdsRef.current = selectedProteinIds
  }, [selectedProteinIds])

  const proteinsByIdRef = useRef(proteinsById)
  useEffect(() => {
    proteinsByIdRef.current = proteinsById
  }, [proteinsById])

  // Map id → { model, color } con los modelos 3Dmol activos.
  const modelsRef = useRef(new Map())
  const dragStateRef = useRef(null)

  const { containerRef, viewerRef } = use3DmolViewer({
    config: { backgroundColor: background },
    setup: (viewer) => {
      syncModels(
        viewer,
        modelsRef.current,
        proteinsByIdRef.current,
        selectedProteinIdsRef.current,
      )
      viewer.zoomTo()
      viewer.render()
      viewer.resize()
    },
    deps: [background],
  })

  // Catálogo del store → escena: añade/quita modelos cuando cambia.
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const dirty = syncModels(
      viewer,
      modelsRef.current,
      proteinsById,
      selectedProteinIdsRef.current,
    )
    if (dirty && modelsRef.current.size > 0) {
      viewer.zoomTo()
    }
    viewer.render()
  }, [proteinsById, viewerRef])

  // Selección → escena: repinta halos sin tocar la geometría.
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || modelsRef.current.size === 0) return
    for (const [id, entry] of modelsRef.current) {
      applyEntryStyle(entry, selectedProteinIds.includes(id))
    }
    viewer.render()
  }, [selectedProteinIds, viewerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // `modelToScreen` devuelve coordenadas DE PÁGINA (incluye offset del
    // canvas en el documento), así que comparamos con event.pageX/pageY.
    const pickEntryAt = (pageX, pageY) => {
      const viewer = viewerRef.current
      if (!viewer) return null
      const px = pageX
      const py = pageY

      const infos = []
      for (const [, entry] of modelsRef.current) {
        const atoms = entry.model.selectedAtoms({})
        if (atoms.length === 0) continue

        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        let minAtomDistSq = Infinity

        for (const atom of atoms) {
          const s = viewer.modelToScreen({ x: atom.x, y: atom.y, z: atom.z })
          if (s.x < minX) minX = s.x
          if (s.x > maxX) maxX = s.x
          if (s.y < minY) minY = s.y
          if (s.y > maxY) maxY = s.y
          const ddx = s.x - px
          const ddy = s.y - py
          const d2 = ddx * ddx + ddy * ddy
          if (d2 < minAtomDistSq) minAtomDistSq = d2
        }
        infos.push({ entry, minX, maxX, minY, maxY, minAtomDistSq })
      }

      if (infos.length === 0) return null

      const pad = PICK_BBOX_PADDING_PX
      const insideHits = infos.filter(
        (h) =>
          px >= h.minX - pad &&
          px <= h.maxX + pad &&
          py >= h.minY - pad &&
          py <= h.maxY + pad,
      )
      if (insideHits.length > 0) {
        insideHits.sort((a, b) => a.minAtomDistSq - b.minAtomDistSq)
        return insideHits[0].entry
      }

      infos.sort((a, b) => a.minAtomDistSq - b.minAtomDistSq)
      const nearest = infos[0]
      const maxSq = PICK_NEAREST_FALLBACK_PX * PICK_NEAREST_FALLBACK_PX
      return nearest.minAtomDistSq <= maxSq ? nearest.entry : null
    }

    const computeScreenBasis = () => {
      const viewer = viewerRef.current
      if (!viewer) return null
      const origin = viewer.modelToScreen({ x: 0, y: 0, z: 0 })
      const xAxis = viewer.modelToScreen({ x: 1, y: 0, z: 0 })
      const yAxis = viewer.modelToScreen({ x: 0, y: 1, z: 0 })
      return {
        a: xAxis.x - origin.x,
        b: yAxis.x - origin.x,
        c: xAxis.y - origin.y,
        d: yAxis.y - origin.y,
      }
    }

    const screenDeltaToWorld = (dxPx, dyPx, basis) => {
      const { a, b, c, d } = basis
      const det = a * d - b * c
      if (Math.abs(det) < 1e-6) return { x: 0, y: 0 }
      return {
        x: (d * dxPx - b * dyPx) / det,
        y: (-c * dxPx + a * dyPx) / det,
      }
    }

    const handleMouseDown = (event) => {
      if (event.button !== 0) return
      const hit = pickEntryAt(event.pageX, event.pageY)

      if (!hit) {
        clearSelection()
        return
      }

      event.stopImmediatePropagation()
      event.preventDefault()

      // Ctrl + click sobre una seleccionada → rotación rígida en sitio.
      if (event.ctrlKey && selectedProteinIdsRef.current.includes(hit.id)) {
        dragStateRef.current = {
          mode: 'rotate',
          id: hit.id,
          centroid: computeCentroid(hit.model),
          lastX: event.clientX,
          lastY: event.clientY,
        }
        return
      }

      if (event.shiftKey) {
        toggleProteinSelection(hit.id)
      } else {
        setSelectedProteinIds([hit.id])
      }

      const basis = computeScreenBasis()
      if (basis) {
        dragStateRef.current = {
          mode: 'translate',
          lastX: event.clientX,
          lastY: event.clientY,
          basis,
          id: hit.id,
        }
      }
    }

    const handleMouseMove = (event) => {
      const drag = dragStateRef.current
      if (!drag) return
      const viewer = viewerRef.current
      if (!viewer) return

      event.stopImmediatePropagation()
      event.preventDefault()

      const dxPx = event.clientX - drag.lastX
      const dyPx = event.clientY - drag.lastY
      if (dxPx === 0 && dyPx === 0) return

      const entry = modelsRef.current.get(drag.id)
      if (entry) {
        if (drag.mode === 'rotate') {
          const yaw = dxPx * 0.01
          const pitch = dyPx * 0.01
          rotateModelAroundCentroid(entry.model, drag.centroid, yaw, pitch)
        } else {
          const world = screenDeltaToWorld(dxPx, dyPx, drag.basis)
          translateModelAtoms(entry.model, world.x, world.y, 0)
        }
        applyEntryStyle(entry, true)
      }
      drag.lastX = event.clientX
      drag.lastY = event.clientY
      viewer.render()
    }

    const handleMouseUp = () => {
      dragStateRef.current = null
    }

    container.addEventListener('mousedown', handleMouseDown, true)
    window.addEventListener('mousemove', handleMouseMove, true)
    window.addEventListener('mouseup', handleMouseUp, true)
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, true)
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
    }
  }, [containerRef, viewerRef, setSelectedProteinIds, toggleProteinSelection, clearSelection])

  return (
    <ViewerCanvas containerRef={containerRef}>
      <div />
    </ViewerCanvas>
  )
}
