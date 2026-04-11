import { useEffect, useRef } from 'react'
import { use3DmolViewer } from '../../hooks/use3DmolViewer'
import { buildHelixPdb } from '../../lib/helix'
import { useProteinStore } from '../../stores/useProteinStore'
import ViewerCanvas from './ViewerCanvas'

const HELICES = [
  { residues: 40, offset: { x: 0, y: 0, z: 0 }, color: 0x3b82f6 },
  { residues: 25, offset: { x: 40, y: 10, z: -10 }, color: 0x10b981 },
  { residues: 30, offset: { x: -35, y: -20, z: 15 }, color: 0xec4899 },
]

// Padding del bounding box en píxeles: margen alrededor de la proyección
// 2D de la hélice dentro del cual un click cuenta como impacto directo.
const PICK_BBOX_PADDING_PX = 10
// Fallback cuando el click no cae dentro de ningún bbox: la hélice más
// cercana gana si su átomo más próximo está dentro de este radio.
const PICK_NEAREST_FALLBACK_PX = 25
const HALO_COLOR = 0xfde047

const baseStyle = (color) => ({
  sphere: { color, radius: 1.1 },
  stick: { color, radius: 0.4 },
})

const haloStyle = {
  sphere: { color: HALO_COLOR, radius: 1.6, opacity: 0.5 },
  stick: { color: HALO_COLOR, radius: 0.55, opacity: 0.5 },
}

const applyModelStyle = (entry, isActive) => {
  entry.model.setStyle({}, baseStyle(entry.color))
  if (isActive) entry.model.setStyle({}, haloStyle, true)
}

const translateModelAtoms = (model, dx, dy, dz) => {
  const atoms = model.selectedAtoms({})
  for (const atom of atoms) {
    atom.x += dx
    atom.y += dy
    atom.z += dz
  }
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

// Rotación rígida alrededor del centroide: yaw en torno al eje Y del mundo,
// pitch en torno al eje X. Preserva distancias entre átomos → la forma no
// se deforma, solo cambia el ángulo del modelo.
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

export default function MolecularUniverseMock({ background = '#ffffff' }) {
  const selectedProteinIds = useProteinStore((state) => state.selectedProteinIds)
  const setSelectedProteinIds = useProteinStore((state) => state.setSelectedProteinIds)
  const toggleProteinSelection = useProteinStore((state) => state.toggleProteinSelection)
  const clearSelection = useProteinStore((state) => state.clearSelection)

  // Ref en vivo para que los handlers de mouse (que se registran una sola vez)
  // siempre lean el valor actual del store sin cerrarse sobre uno viejo.
  const selectedProteinIdsRef = useRef(selectedProteinIds)
  useEffect(() => {
    selectedProteinIdsRef.current = selectedProteinIds
  }, [selectedProteinIds])

  const modelsRef = useRef([])
  const dragStateRef = useRef(null)

  const { containerRef, viewerRef } = use3DmolViewer({
    config: { backgroundColor: background },
    setup: (viewer) => {
      const entries = HELICES.map((helix, index) => {
        const id = `helix-${index}`
        const model = viewer.addModel(buildHelixPdb(helix.residues, helix.offset), 'pdb')
        const entry = { id, color: helix.color, model }
        applyModelStyle(entry, selectedProteinIdsRef.current.includes(id))
        return entry
      })
      modelsRef.current = entries
      viewer.zoomTo()
      viewer.render()
      viewer.resize()
    },
    deps: [background],
  })

  // Sidebar → 3D: cuando cambian los seleccionados, repinta los halos.
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || modelsRef.current.length === 0) return
    modelsRef.current.forEach((entry) =>
      applyModelStyle(entry, selectedProteinIds.includes(entry.id))
    )
    viewer.render()
  }, [selectedProteinIds, viewerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // `modelToScreen` de 3Dmol devuelve coordenadas **de página** (suma el
    // offset del canvas en el documento + pageXOffset). Por eso el cursor
    // se compara también en coordenadas de página, no viewport — así ambos
    // lados de la comparación están en el mismo sistema.
    const pickEntryAt = (pageX, pageY) => {
      const viewer = viewerRef.current
      if (!viewer) return null
      const px = pageX
      const py = pageY

      // Para cada hélice proyectamos todos sus átomos a pantalla y
      // calculamos bbox + distancia al átomo más cercano (en cuadrado,
      // sin sqrt para ahorrar trabajo en el bucle caliente).
      const infos = []
      for (const entry of modelsRef.current) {
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

      // Capa 1: impacto directo → hélices cuyo bbox (con padding) contiene
      // el cursor. Si hay varias (solapamiento), gana la que tenga el átomo
      // más cercano al cursor en 2D.
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

      // Capa 2: ningún bbox contiene el click, pero tal vez alguna hélice
      // está lo bastante cerca como para aceptarla (clicks justo al borde).
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
        // Click sobre zona vacía del visor → deselecciona todo.
        // Dejamos bubblear el evento para que Radix detecte el outside click
        // del drawer también, aunque con clearSelection el panel ya se cierra.
        clearSelection()
        return
      }

      event.stopImmediatePropagation()
      event.preventDefault()

      // Ctrl + click sobre una proteína ya seleccionada → rotación rígida.
      // No cambia la selección: conserva la activa y empieza el drag de rotación.
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

      // 3D → store: selecciona la hélice clickeada (shift = toggle multi).
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

      const entry = modelsRef.current.find((m) => m.id === drag.id)
      if (entry) {
        if (drag.mode === 'rotate') {
          const yaw = dxPx * 0.01
          const pitch = dyPx * 0.01
          rotateModelAroundCentroid(entry.model, drag.centroid, yaw, pitch)
        } else {
          const world = screenDeltaToWorld(dxPx, dyPx, drag.basis)
          translateModelAtoms(entry.model, world.x, world.y, 0)
        }
        applyModelStyle(entry, true)
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
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black uppercase tracking-widest pointer-events-none">
        Mock · Click para seleccionar · Arrastra para mover
      </div>
    </ViewerCanvas>
  )
}
