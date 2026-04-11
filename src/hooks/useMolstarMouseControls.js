import { useEffect, useRef } from 'react';
import { Mat4, Vec3 } from 'molstar/lib/mol-math/linear-algebra.js';
import { StructureElement, StructureProperties } from 'molstar/lib/mol-model/structure.js';
import { applyRotation, applyTranslation } from '../lib/math/matrixUtils';
import { commitTransform, DRAG_SCALE } from '../lib/molstar/structurePipeline';

function getPreferredSeqId(loc) {
  const labelSeqId = StructureProperties.residue.label_seq_id(loc);
  if (Number.isFinite(labelSeqId) && labelSeqId > 0) return labelSeqId;
  const authSeqId = StructureProperties.residue.auth_seq_id(loc);
  return Number.isFinite(authSeqId) && authSeqId > 0 ? authSeqId : null;
}

/**
 * Hook para manejar la interacción del ratón con las estructuras en Mol*.
 * Abstrae el picking, la rotación (Ctrl+Drag) y la traslación de proteínas individuales.
 */
export function useMolstarMouseControls({
  containerRef,
  pluginRef,
  entriesRef,
  selectedIdsRef,
  setSelectedProteinIds,
  setFocusedResidue,
}) {
  const dragRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /** Picking por píxel: devuelve protein id + residuo (si existe). */
    const pickAt = (clientX, clientY) => {
      const plugin = pluginRef.current;
      if (!plugin?.canvas3d) return null;
      const rect = container.getBoundingClientRect();
      const pick = plugin.canvas3d.identify({ x: clientX - rect.left, y: clientY - rect.top });
      if (!pick) return null;
      
      const reprLoci = plugin.canvas3d.getLoci(pick.id);
      if (!reprLoci?.loci || reprLoci.loci.kind !== 'element-loci') return null;

      let seqId = null;
      try {
        const loc = StructureElement.Loci.getFirstLocation(reprLoci.loci);
        if (loc) {
          seqId = getPreferredSeqId(loc);
        }
      } catch (_) {
        seqId = null;
      }
      
      const pickedModel = reprLoci.loci.structure?.model;
      for (const [id, entry] of entriesRef.current) {
        const s = plugin.state.data.cells.get(entry.transformedRef.ref)?.obj?.data;
        if (s && (s === reprLoci.loci.structure || s.model === pickedModel)) {
          return { id, seqId, reprLoci };
        }
      }
      return null;
    };

    /** Vectores cámara en espacio mundo para traslación alineada. */
    const getCameraAxes = () => {
      const cam = pluginRef.current?.canvas3d?.camera;
      if (!cam) return null;
      const inv = Mat4.invert(Mat4(), cam.view);
      if (!inv) return null;
      const right = Vec3.normalize(Vec3(), Vec3.create(inv[0], inv[1], inv[2]));
      const up = Vec3.normalize(Vec3(), Vec3.create(inv[4], inv[5], inv[6]));
      return { right, up };
    };

    const handlePointerDown = (event) => {
      if (event.button !== 0) return;
      const hit = pickAt(event.clientX, event.clientY);
      
      // Click en fondo vacío: limpia el residuo enfocado para quitar la selección activa.
      if (!hit) {
        setFocusedResidue(null);
        return;
      }
      const { id: hitId, seqId } = hit;

      // Esto ahora detendrá el evento de Mol* correctamente
      event.stopImmediatePropagation();
      event.preventDefault();

      if (event.ctrlKey && selectedIdsRef.current.includes(hitId)) {
        const entry = entriesRef.current.get(hitId);
        dragRef.current = {
          mode: 'rotate',
          id: hitId,
          centroid: entry?.centroid ?? Vec3.create(0, 0, 0),
          lastX: event.clientX,
          lastY: event.clientY,
        };
        return;
      }

      setSelectedProteinIds([hitId]);
      if (seqId != null) {
        setFocusedResidue({ proteinId: hitId, seqId });
      }

      const axes = getCameraAxes();
      if (axes) {
        dragRef.current = {
          mode: 'translate',
          id: hitId,
          axes,
          lastX: event.clientX,
          lastY: event.clientY,
        };
      }
    };

    const handlePointerMove = async (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      const plugin = pluginRef.current;
      if (!plugin) return;
      
      event.stopImmediatePropagation();
      event.preventDefault();

      const dx = event.clientX - drag.lastX;
      const dy = event.clientY - drag.lastY;
      if (dx === 0 && dy === 0) return;

      const entry = entriesRef.current.get(drag.id);
      if (!entry) return;

      if (drag.mode === 'rotate') {
        applyRotation(entry.mat, drag.centroid, dx * 0.01, dy * 0.01);
      } else {
        const axes = getCameraAxes() ?? drag.axes;
        const scale = DRAG_SCALE * (plugin.canvas3d?.camera?.state?.radius ?? 50);
        applyTranslation(entry.mat, axes.right, axes.up, dx, dy, scale);
      }

      await commitTransform(plugin, entry);
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
    };

    const handlePointerUp = () => {
      dragRef.current = null;
    };

    container.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    
    return () => {
      container.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
    };
  }, [containerRef, pluginRef, entriesRef, selectedIdsRef, setSelectedProteinIds, setFocusedResidue]);
}
