/**
 * MolecularViewer — integración Mol* como visor AlphaFold.
 *
 * Arquitectura:
 *  - useMolstarViewer  → inicializa PluginContext en containerRef
 *  - plddtColorTheme   → esquema de color AlphaFold exacto (#0053D6 / #65CBF3 / #FFE91E / #FF7D45)
 *  - syncStructures    → reconcilia Map<id, entry> ↔ proteinsById del store
 *  - hover subscription → tooltip de residuo + pLDDT
 *  - mousedown/move    → picking propio + transformación por estructura (Ctrl+drag)
 */

import { useEffect, useRef, useState } from 'react'
import { useMolstarViewer } from '../../hooks/useMolstarViewer'
import { registerAlphafoldPlddtTheme } from '../../hooks/plddtColorTheme'
import { useProteinStore } from '../../stores/useProteinStore'
import { useUIStore } from '../../stores/useUIStore'
import ViewerCanvas from './ViewerCanvas'

// ── Importaciones Mol* ────────────────────────────────────────────────────────
import { StructureElement, StructureProperties } from 'molstar/lib/mol-model/structure.js'
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms.js'
import { Mat4, Vec3 } from 'molstar/lib/mol-math/linear-algebra.js'
import { Color } from 'molstar/lib/mol-util/color/index.js'

// ─── Constantes ───────────────────────────────────────────────────────────────
const HALO_COLOR = Color(0xFDE047)  // amarillo selección
const DRAG_SCALE = 0.004            // px → unidades mundo (se multiplica por camera.radius)

// ─── Presets de iluminación ───────────────────────────────────────────────────
const LIGHTING_PRESETS = {
  ao: {
    postprocessing: {
      occlusion: {
        name: 'on',
        params: {
          samples: 32,
          radius: 5,
          bias: 0.8,
          blurKernelSize: 15,
          blurDepthBias: 0.5,
          resolutionScale: 1,
          color: Color(0x000000),
          transparentThreshold: 0.4,
          multiScale: { name: 'off', params: {} },
        },
      },
      shadow: { name: 'off', params: {} },
    },
    renderer: { ambientIntensity: 0.9, lightIntensity: 0.4, metalness: 0, roughness: 1.0 },
  },
  flat: {
    postprocessing: {
      occlusion: { name: 'off', params: {} },
      shadow: { name: 'off', params: {} },
    },
    renderer: { ambientIntensity: 1.0, lightIntensity: 0.0, metalness: 0, roughness: 1.0 },
  },
  studio: {
    postprocessing: {
      occlusion: { name: 'off', params: {} },
      shadow: { name: 'off', params: {} },
    },
    renderer: { ambientIntensity: 0.6, lightIntensity: 0.8, metalness: 0, roughness: 0.8 },
  },
}

// ─── Helpers de transformación de matriz ──────────────────────────────────────

function rotMatY(a) {
  const c = Math.cos(a), s = Math.sin(a)
  return Mat4.ofRows([[ c,0,s,0],[0,1,0,0],[-s,0,c,0],[0,0,0,1]])
}

function rotMatX(a) {
  const c = Math.cos(a), s = Math.sin(a)
  return Mat4.ofRows([[1,0,0,0],[0,c,-s,0],[0,s,c,0],[0,0,0,1]])
}

/** Yaw+pitch alrededor del centroide, acumulando sobre `mat`. */
function applyRotation(mat, centroid, yaw, pitch) {
  const [tx, ty, tz] = [centroid[0], centroid[1], centroid[2]]
  const T  = Mat4.ofRows([[1,0,0, tx],[0,1,0, ty],[0,0,1, tz],[0,0,0,1]])
  const Ti = Mat4.ofRows([[1,0,0,-tx],[0,1,0,-ty],[0,0,1,-tz],[0,0,0,1]])
  const R  = Mat4.mul(Mat4(), rotMatX(pitch), rotMatY(yaw))
  const delta = Mat4.mul(Mat4(), T, Mat4.mul(Mat4(), R, Ti))
  Mat4.mul(mat, delta, mat)
}

/** Traslación alineada con los vectores cámara-right/up, acumulando sobre `mat`. */
function applyTranslation(mat, right, up, dx, dy, scale) {
  const wx = (right[0] * dx - up[0] * dy) * scale
  const wy = (right[1] * dx - up[1] * dy) * scale
  const wz = (right[2] * dx - up[2] * dy) * scale
  const T  = Mat4.ofRows([[1,0,0,wx],[0,1,0,wy],[0,0,1,wz],[0,0,0,1]])
  Mat4.mul(mat, T, mat)
}

// ─── Pipeline de carga de estructuras ────────────────────────────────────────

/**
 * Carga una cadena PDB/mmCIF en el state tree de Mol*:
 *   rawData → trajectory → model → structure → TransformStructureConformation → repr
 */
async function loadStructureEntry(plugin, id, protein, reprType) {
  const text   = protein.cifData ?? protein.pdbData
  const format = protein.cifData ? 'mmcif' : 'pdb'

  const dataRef = await plugin.builders.data.rawData({ data: text, label: id })
  const traj    = await plugin.builders.structure.parseTrajectory(dataRef, format)
  const model   = await plugin.builders.structure.createModel(traj)
  const baseRef = await plugin.builders.structure.createStructure(model)

  // Nodo de transformación (identidad inicial; se actualiza con drag)
  const transformedRef = await plugin
    .build()
    .to(baseRef)
    .apply(StateTransforms.Model.TransformStructureConformation, {
      transform: { name: 'matrix', params: { data: Array.from(Mat4.identity()), transpose: false } },
    })
    .commit()

  // Representación cartoon + tema de color pLDDT AlphaFold
  const reprRef = await plugin.builders.structure.representation.addRepresentation(
    transformedRef,
    { type: reprType ?? 'cartoon', typeParams: { alpha: 1, quality: 'high' }, color: 'alphafold-plddt' }
  )

  // Centro geométrico para rotaciones
  const structObj = plugin.state.data.cells.get(transformedRef.ref)?.obj?.data
  const center    = structObj?.boundary?.sphere?.center
  const centroid  = center ? Vec3.clone(center) : Vec3.create(0, 0, 0)

  return { id, dataRef, baseRef, transformedRef, reprRef, haloReprRef: null, mat: Mat4.identity(), centroid }
}

/** Activa o desactiva el halo semitransparente amarillo de un entry. */
async function setHalo(plugin, entry, active) {
  if (active && !entry.haloReprRef) {
    entry.haloReprRef = await plugin.builders.structure.representation.addRepresentation(
      entry.transformedRef,
      { type: 'cartoon', typeParams: { alpha: 0.35 }, color: 'uniform', colorParams: { value: HALO_COLOR } }
    )
  } else if (!active && entry.haloReprRef) {
    await plugin.build().delete(entry.haloReprRef.ref).commit()
    entry.haloReprRef = null
  }
}

/**
 * Reconcilia Map<id,entry> con proteinsById:
 * elimina huérfanos, añade nuevos.
 */
async function syncStructures(plugin, entriesMap, proteinsById, selectedIds, reprType) {
  let dirty = false
  for (const [id, entry] of entriesMap) {
    if (!proteinsById[id]) {
      try { await plugin.build().delete(entry.dataRef.ref).commit() } catch (_) {}
      entriesMap.delete(id)
      dirty = true
    }
  }
  for (const id of Object.keys(proteinsById)) {
    if (entriesMap.has(id)) continue
    const protein = proteinsById[id]
    if (!protein?.pdbData && !protein?.cifData) continue
    const entry = await loadStructureEntry(plugin, id, protein, reprType)
    await setHalo(plugin, entry, selectedIds.includes(id))
    entriesMap.set(id, entry)
    dirty = true
  }
  return dirty
}

/** Escribe el mat4 acumulado en el nodo TransformStructureConformation del state tree. */
async function commitTransform(plugin, entry) {
  await plugin
    .build()
    .to(entry.transformedRef.ref)
    .update(StateTransforms.Model.TransformStructureConformation, () => ({
      transform: { name: 'matrix', params: { data: Array.from(entry.mat), transpose: false } },
    }))
    .commit()
}

/** Cambia el tipo de representación de todas las estructuras cargadas. */
async function updateAllRepresentations(plugin, entriesMap, reprType) {
  for (const [, entry] of entriesMap) {
    await plugin
      .build()
      .to(entry.reprRef.ref)
      .update(StateTransforms.Representation.StructureRepresentation3D, (old) => ({
        ...old,
        type: { name: reprType, params: old.type?.params ?? {} },
      }))
      .commit()
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MolecularViewer() {
  const proteinsById           = useProteinStore((s) => s.proteinsById)
  const selectedProteinIds     = useProteinStore((s) => s.selectedProteinIds)
  const setSelectedProteinIds  = useProteinStore((s) => s.setSelectedProteinIds)
  const toggleProteinSelection = useProteinStore((s) => s.toggleProteinSelection)
  const clearSelection         = useProteinStore((s) => s.clearSelection)

  const viewerRepresentation = useUIStore((s) => s.viewerRepresentation)
  const viewerLighting       = useUIStore((s) => s.viewerLighting)
  const sceneBackground      = useUIStore((s) => s.sceneBackground)

  // Live refs para closures de event listeners
  const selectedIdsRef  = useRef(selectedProteinIds)
  const proteinsByIdRef = useRef(proteinsById)
  const reprTypeRef     = useRef(viewerRepresentation)
  useEffect(() => { selectedIdsRef.current  = selectedProteinIds }, [selectedProteinIds])
  useEffect(() => { proteinsByIdRef.current = proteinsById }, [proteinsById])
  useEffect(() => { reprTypeRef.current     = viewerRepresentation }, [viewerRepresentation])

  const entriesRef = useRef(new Map())  // Map<id, entry>
  const dragRef    = useRef(null)

  const [tooltip, setTooltip] = useState(null)

  // ── Inicialización del plugin ─────────────────────────────────────────────
  const { containerRef, pluginRef } = useMolstarViewer({
    setup: async (plugin) => {
      // 1. Registrar el tema de color pLDDT AlphaFold en el registry
      registerAlphafoldPlddtTheme(plugin)

      // 2. Configurar Ambient Occlusion + renderer mate (sin brillos especulares)
      plugin.canvas3d?.setProps({
        ...LIGHTING_PRESETS.ao,
        renderer: {
          ...LIGHTING_PRESETS.ao.renderer,
          backgroundColor: Color.fromHexStyle(sceneBackground),
        },
      })

      // 3. Cargar estructuras ya presentes en el store al montar
      const dirty = await syncStructures(
        plugin, entriesRef.current,
        proteinsByIdRef.current, selectedIdsRef.current, reprTypeRef.current,
      )
      if (dirty && entriesRef.current.size > 0) plugin.managers.camera.reset()

      // 4. Suscripción hover → tooltip de residuo + pLDDT
      const hoverSub = plugin.behaviors.interaction.hover.subscribe(({ current, page }) => {
        if (!current?.loci || current.loci.kind !== 'element-loci') {
          setTooltip(null)
          return
        }
        try {
          const loc = StructureElement.Loci.getFirstLocation(current.loci)
          if (!loc) { setTooltip(null); return }

          const compId = StructureProperties.residue.auth_comp_id(loc)
          const seqId  = StructureProperties.residue.auth_seq_id(loc)
          const bfact  = StructureProperties.atom.B_iso_or_equiv(loc)

          setTooltip({
            label: `${compId} ${seqId}`,
            plddt: bfact.toFixed(1),
            x: page?.[0] ?? 0,
            y: page?.[1] ?? 0,
          })
        } catch (_) {
          setTooltip(null)
        }
      })

      return () => hoverSub.unsubscribe()
    },
    deps: [],
  })

  // ── Sync proteins store → escena Mol* ────────────────────────────────────
  useEffect(() => {
    const plugin = pluginRef.current
    if (!plugin) return
    let cancelled = false
    ;(async () => {
      const dirty = await syncStructures(
        plugin, entriesRef.current,
        proteinsById, selectedIdsRef.current, reprTypeRef.current,
      )
      if (cancelled) return
      if (dirty && entriesRef.current.size > 0) plugin.managers.camera.reset()
    })()
    return () => { cancelled = true }
  }, [proteinsById, pluginRef])

  // ── Sync selección → halos ────────────────────────────────────────────────
  useEffect(() => {
    const plugin = pluginRef.current
    if (!plugin || entriesRef.current.size === 0) return
    let cancelled = false
    ;(async () => {
      for (const [id, entry] of entriesRef.current) {
        if (cancelled) return
        await setHalo(plugin, entry, selectedProteinIds.includes(id))
      }
    })()
    return () => { cancelled = true }
  }, [selectedProteinIds, pluginRef])

  // ── Fondo de escena ───────────────────────────────────────────────────────
  useEffect(() => {
    pluginRef.current?.canvas3d?.setProps({
      renderer: { backgroundColor: Color.fromHexStyle(sceneBackground) },
    })
  }, [sceneBackground, pluginRef])

  // ── Cambio de representación ──────────────────────────────────────────────
  useEffect(() => {
    const plugin = pluginRef.current
    if (!plugin || entriesRef.current.size === 0) return
    updateAllRepresentations(plugin, entriesRef.current, viewerRepresentation).catch(console.error)
  }, [viewerRepresentation, pluginRef])

  // ── Cambio de iluminación ─────────────────────────────────────────────────
  useEffect(() => {
    const plugin = pluginRef.current
    if (!plugin) return
    plugin.canvas3d?.setProps(LIGHTING_PRESETS[viewerLighting] ?? LIGHTING_PRESETS.ao)
  }, [viewerLighting, pluginRef])

  // ── Mouse picking + drag (Ctrl=rotate, plain=translate) ──────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    /** Picking por píxel: devuelve el protein id o null. */
    const pickAt = (clientX, clientY) => {
      const plugin = pluginRef.current
      if (!plugin?.canvas3d) return null
      const rect = container.getBoundingClientRect()
      const pick = plugin.canvas3d.identify({ x: clientX - rect.left, y: clientY - rect.top })
      if (!pick) return null
      const loci = plugin.canvas3d.getLoci(pick.id)
      if (!loci || loci.kind !== 'element-loci') return null
      const pickedModel = loci.structure?.model
      for (const [id, entry] of entriesRef.current) {
        const s = plugin.state.data.cells.get(entry.transformedRef.ref)?.obj?.data
        if (s && (s === loci.structure || s.model === pickedModel)) return id
      }
      return null
    }

    /** Vectores cámara en espacio mundo para traslación alineada. */
    const getCameraAxes = () => {
      const cam = pluginRef.current?.canvas3d?.camera
      if (!cam) return null
      const inv = Mat4.invert(Mat4(), cam.view)
      if (!inv) return null
      const right = Vec3.normalize(Vec3(), Vec3.create(inv[0], inv[1], inv[2]))
      const up    = Vec3.normalize(Vec3(), Vec3.create(inv[4], inv[5], inv[6]))
      return { right, up }
    }

    const handleMouseDown = (event) => {
      if (event.button !== 0) return
      const hitId = pickAt(event.clientX, event.clientY)
      if (!hitId) { clearSelection(); return }

      event.stopImmediatePropagation()
      event.preventDefault()

      if (event.ctrlKey && selectedIdsRef.current.includes(hitId)) {
        const entry = entriesRef.current.get(hitId)
        dragRef.current = {
          mode: 'rotate', id: hitId,
          centroid: entry?.centroid ?? Vec3.create(0,0,0),
          lastX: event.clientX, lastY: event.clientY,
        }
        return
      }

      event.shiftKey ? toggleProteinSelection(hitId) : setSelectedProteinIds([hitId])

      const axes = getCameraAxes()
      if (axes) {
        dragRef.current = { mode: 'translate', id: hitId, axes, lastX: event.clientX, lastY: event.clientY }
      }
    }

    const handleMouseMove = async (event) => {
      const drag = dragRef.current
      if (!drag) return
      const plugin = pluginRef.current
      if (!plugin) return
      event.stopImmediatePropagation()
      event.preventDefault()

      const dx = event.clientX - drag.lastX
      const dy = event.clientY - drag.lastY
      if (dx === 0 && dy === 0) return

      const entry = entriesRef.current.get(drag.id)
      if (!entry) return

      if (drag.mode === 'rotate') {
        applyRotation(entry.mat, drag.centroid, dx * 0.01, dy * 0.01)
      } else {
        const axes = getCameraAxes() ?? drag.axes
        const scale = DRAG_SCALE * (plugin.canvas3d?.camera?.state?.radius ?? 50)
        applyTranslation(entry.mat, axes.right, axes.up, dx, dy, scale)
      }

      await commitTransform(plugin, entry)
      drag.lastX = event.clientX
      drag.lastY = event.clientY
    }

    const handleMouseUp = () => { dragRef.current = null }

    container.addEventListener('mousedown', handleMouseDown, true)
    window.addEventListener('mousemove', handleMouseMove, true)
    window.addEventListener('mouseup', handleMouseUp, true)
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, true)
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
    }
  }, [containerRef, pluginRef, setSelectedProteinIds, toggleProteinSelection, clearSelection])

  return (
    <ViewerCanvas containerRef={containerRef} tooltip={tooltip}>
      <div />
    </ViewerCanvas>
  )
}
