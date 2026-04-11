import { useEffect, useRef } from 'react';
import { Mat4, Vec3 } from 'molstar/lib/mol-math/linear-algebra.js';
import { StructureElement, StructureProperties } from 'molstar/lib/mol-model/structure.js';
import { applyRotation, applyTranslation } from '../lib/math/matrixUtils';
import { commitTransform, DRAG_SCALE } from '../lib/molstar/structurePipeline';

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
      
      const loci = plugin.canvas3d.getLoci(pick.id);
      if (!loci || loci.kind !== 'element-loci') return null;

      let seqId = null;
      try {
        const loc = StructureElement.Loci.getFirstLocation(loci);
        if (loc) {
          const labelSeqId = StructureProperties.residue.label_seq_id(loc);
          if (Number.isFinite(labelSeqId) && labelSeqId > 0) {
            seqId = labelSeqId;
          } else {
            const authSeqId = StructureProperties.residue.auth_seq_id(loc);
            seqId = Number.isFinite(authSeqId) ? authSeqId : null;
          }
        }
      } catch (_) {
        seqId = null;
      }
      
      const pickedModel = loci.structure?.model;
      for (const [id, entry] of entriesRef.current) {
        const s = plugin.state.data.cells.get(entry.transformedRef.ref)?.obj?.data;
        if (s && (s === loci.structure || s.model === pickedModel)) {
          return { id, seqId };
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

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      const hit = pickAt(event.clientX, event.clientY);
      
      // Click en fondo vacío: limpia el residuo enfocado para quitar la selección activa.
      if (!hit) {
        setFocusedResidue(null);
        return;
      }
      const { id: hitId, seqId } = hit;

      event.stopImmediatePropagation();
      event.preventDefault();

      // Si pulsamos CTRL, entramos en modo rotación local de la proteína seleccionada
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

      // Si no, seleccionamos la proteína y preparamos traslación
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

    const handleMouseMove = async (event) => {
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

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    container.addEventListener('mousedown', handleMouseDown, true);
    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [containerRef, pluginRef, entriesRef, selectedIdsRef, setSelectedProteinIds, setFocusedResidue]);
}
