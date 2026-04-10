import { useEffect, useRef, useState } from 'react'
import { use3DmolViewer } from '../../hooks/use3DmolViewer'
import { buildHelixPdb } from '../../lib/helix'
import ViewerCanvas from './ViewerCanvas'

const HELICES = [
  { residues: 40, offset: { x: 0, y: 0, z: 0 }, color: 0x3b82f6 },
  { residues: 25, offset: { x: 40, y: 10, z: -10 }, color: 0x10b981 },
  { residues: 30, offset: { x: -35, y: -20, z: 15 }, color: 0xec4899 },
]

const PICK_RADIUS_PX = 45
const HALO_COLOR = 0xfde047

const baseStyle = (color) => ({
  sphere: { color, radius: 1.1 },
  stick: { color, radius: 0.4 },
})

const haloStyle = {
  sphere: { color: HALO_COLOR, radius: 1.6, opacity: 0.5 },
  stick: { color: HALO_COLOR, radius: 0.55, opacity: 0.5 },
}

const applyModelStyle = (entry, isSelected) => {
  entry.model.setStyle({}, baseStyle(entry.color))
  if (isSelected) entry.model.addStyle({}, haloStyle)
}

const translateModelAtoms = (model, dx, dy, dz) => {
  const atoms = model.selectedAtoms({})
  for (const atom of atoms) {
    atom.x += dx
    atom.y += dy
    atom.z += dz
  }
}

export default function MolecularUniverseMock({ background = '#ffffff' }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const selectedIdsRef = useRef(selectedIds)
  const modelsRef = useRef([])
  const dragStateRef = useRef(null)

  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])

  const { containerRef, viewerRef } = use3DmolViewer({
    config: { backgroundColor: background },
    setup: (viewer) => {
      const entries = HELICES.map((helix, index) => {
        const id = `helix-${index}`
        const model = viewer.addModel(buildHelixPdb(helix.residues, helix.offset), 'pdb')
        const entry = { id, color: helix.color, model }
        applyModelStyle(entry, selectedIdsRef.current.has(id))
        return entry
      })
      modelsRef.current = entries
      viewer.zoomTo()
      viewer.render()
      viewer.resize()
    },
    deps: [background],
  })

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || modelsRef.current.length === 0) return
    modelsRef.current.forEach((entry) => applyModelStyle(entry, selectedIds.has(entry.id)))
    viewer.render()
  }, [selectedIds, viewerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const pickEntryAt = (clientX, clientY) => {
      const viewer = viewerRef.current
      if (!viewer) return null
      const rect = container.getBoundingClientRect()
      const px = clientX - rect.left
      const py = clientY - rect.top
      let best = null
      let bestDist = PICK_RADIUS_PX

      for (const entry of modelsRef.current) {
        const atoms = entry.model.selectedAtoms({})
        for (const atom of atoms) {
          const screen = viewer.modelToScreen({ x: atom.x, y: atom.y, z: atom.z })
          const dist = Math.hypot(screen.x - px, screen.y - py)
          if (dist < bestDist) {
            bestDist = dist
            best = entry
          }
        }
      }
      return best
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

    const nextSelectionFor = (prev, hitId, shiftKey) => {
      if (shiftKey) {
        const next = new Set(prev)
        if (next.has(hitId)) next.delete(hitId)
        else next.add(hitId)
        return next
      }
      if (prev.has(hitId)) return prev
      return new Set([hitId])
    }

    const handleMouseDown = (event) => {
      if (event.button !== 0) return
      const hit = pickEntryAt(event.clientX, event.clientY)
      if (!hit) return

      event.stopImmediatePropagation()
      event.preventDefault()

      setSelectedIds((prev) => {
        const next = nextSelectionFor(prev, hit.id, event.shiftKey)
        if (next.has(hit.id)) {
          const basis = computeScreenBasis()
          if (basis) {
            dragStateRef.current = {
              lastX: event.clientX,
              lastY: event.clientY,
              basis,
              ids: new Set(next),
            }
          }
        }
        return next
      })
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

      const world = screenDeltaToWorld(dxPx, dyPx, drag.basis)
      drag.ids.forEach((id) => {
        const entry = modelsRef.current.find((m) => m.id === id)
        if (!entry) return
        translateModelAtoms(entry.model, world.x, world.y, 0)
        applyModelStyle(entry, true)
      })
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
  }, [containerRef, viewerRef])

  return (
    <ViewerCanvas containerRef={containerRef}>
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black uppercase tracking-widest pointer-events-none">
        Mock · Click para seleccionar · Shift para multi · Arrastra para mover
      </div>
    </ViewerCanvas>
  )
}
