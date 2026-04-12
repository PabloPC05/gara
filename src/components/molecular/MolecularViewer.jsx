import { useEffect, useRef, useState } from 'react';
import { useMolstarViewer } from '../../hooks/useMolstarViewer';
import { registerAlphafoldPlddtTheme } from '../../hooks/plddtColorTheme';
import { useProteinStore } from '../../stores/useProteinStore';
import { useUIStore } from '../../stores/useUIStore';
import { useMolstarMouseControls } from '../../hooks/useMolstarMouseControls';
import useAnalysisStore from '../../stores/useAnalysisStore';
import ViewerCanvas from './ViewerCanvas';

// --- Importaciones Mol* ---
import { StructureElement, StructureProperties } from 'molstar/lib/mol-model/structure.js';
import { Color } from 'molstar/lib/mol-util/color/index.js';

// --- Servicios y Configuración ---
import {
  syncStructures,
  updateAllRepresentations,
  selectResidueBySeqId,
  clearResidueSelection,
  LIGHTING_PRESETS
} from '../../lib/molstar/structurePipeline';

/**
 * MolecularViewer — Orquestador principal del visor 3D.
 *
 * Responsabilidades:
 *  1. Inicializar el plugin Mol* (via useMolstarViewer)
 *  2. Sincronizar las proteínas del store con las estructuras cargadas en Mol*
 *  3. Reaccionar a cambios de representación, iluminación, fondo y residuo enfocado
 *  4. Gestionar el tooltip de hover sobre residuos
 *  5. Gestionar modos de análisis (medición de distancias, puentes de hidrógeno)
 *
 * Estrategia de picking para medición de distancias:
 *  El hover de Mol* ya computa de forma fiable el átomo bajo el cursor
 *  (lo sabemos porque el tooltip funciona). Almacenamos el último loci
 *  del hover en un ref y lo usamos cuando el usuario hace clic, en lugar
 *  de intentar relanzar canvas3d.identify() en el evento mousedown (que
 *  puede tener problemas de sincronización con el pick buffer del GPU).
 */
export default function MolecularViewer({ proteinId }) {
  // ── Store: proteínas ───────────────────────────────────────────────────────
  const proteinsById          = useProteinStore((s) => s.proteinsById);
  const setSelectedProteinIds = useProteinStore((s) => s.setSelectedProteinIds);

  const proteinIdArray = proteinId ? [proteinId] : [];

  // ── Store: UI ──────────────────────────────────────────────────────────────
  const viewerRepresentation    = useUIStore((s) => s.viewerRepresentation);
  const viewerLighting          = useUIStore((s) => s.viewerLighting);
  const sceneBackground         = useUIStore((s) => s.viewerBackground);
  const focusedResidueByProtein = useUIStore((s) => s.focusedResidueByProtein);
  const focusedResidue          = proteinId ? focusedResidueByProtein[proteinId] : null;

  // ── Store: análisis ────────────────────────────────────────────────────────
  const analysisMode = useAnalysisStore((s) => s.mode);
  const pendingLoci  = useAnalysisStore((s) => s.pendingLoci);
  const clearTrigger = useAnalysisStore((s) => s.clearTrigger);
  const clearAll     = useAnalysisStore((s) => s.clearAll);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const selectedIdsRef  = useRef(proteinIdArray);
  const proteinsByIdRef = useRef(proteinsById);
  const reprTypeRef     = useRef(viewerRepresentation);
  const entriesRef      = useRef(new Map());

  // Loci del átomo/residuo actualmente bajo el cursor.
  // Actualizado por la suscripción al hover de Mol* y usado por el handler de click.
  const lastHoverLociRef = useRef(null);

  // Refs a las representaciones de H-bonds añadidas dinámicamente
  const hbondReprRefs = useRef([]);

  useEffect(() => { selectedIdsRef.current  = proteinIdArray; }, [proteinId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { proteinsByIdRef.current = proteinsById; },   [proteinsById]);
  useEffect(() => { reprTypeRef.current     = viewerRepresentation; }, [viewerRepresentation]);

  // ── Tooltip ────────────────────────────────────────────────────────────────
  const [hoverTooltip,    setHoverTooltip]    = useState(null);
  const [selectedTooltip, setSelectedTooltip] = useState(null);
  const tooltip = hoverTooltip ?? selectedTooltip;

  // ── 1. Inicialización del plugin ───────────────────────────────────────────
  const { containerRef, pluginRef } = useMolstarViewer({
    setup: async (plugin) => {
      registerAlphafoldPlddtTheme(plugin);

      plugin.canvas3d?.setProps({
        ...LIGHTING_PRESETS.ao,
        renderer: {
          ...LIGHTING_PRESETS.ao.renderer,
          backgroundColor: Color.fromHexStyle(sceneBackground),
        },
      });

      const dirty = await syncStructures(
        plugin, entriesRef.current,
        proteinsByIdRef.current, selectedIdsRef.current, reprTypeRef.current,
      );
      if (dirty && entriesRef.current.size > 0) plugin.managers.camera.reset();

      // Suscripción al hover de Mol*.
      // También almacenamos el loci en lastHoverLociRef para usarlo en el
      // handler de click de medición de distancias (ver useEffect abajo).
      const hoverSub = plugin.behaviors.interaction.hover.subscribe(({ current }) => {
        if (!current?.loci || current.loci.kind !== 'element-loci') {
          setHoverTooltip(null);
          lastHoverLociRef.current = null;
          return;
        }
        try {
          const loc = StructureElement.Loci.getFirstLocation(current.loci);
          if (!loc) {
            setHoverTooltip(null);
            lastHoverLociRef.current = null;
            return;
          }
          lastHoverLociRef.current = current.loci; // ← clave para la medición
          setHoverTooltip({
            code:    StructureProperties.residue.auth_comp_id(loc),
            seqId:   StructureProperties.residue.auth_seq_id(loc),
            chainId: StructureProperties.chain.auth_asym_id(loc),
            plddt:   StructureProperties.atom.B_iso_or_equiv(loc).toFixed(1),
          });
        } catch (_) {
          setHoverTooltip(null);
          lastHoverLociRef.current = null;
        }
      });

      return () => hoverSub.unsubscribe();
    },
    deps: [],
  });

  // ── 2. Controles de ratón (selección + drag) ───────────────────────────────
  useMolstarMouseControls({
    containerRef,
    pluginRef,
    entriesRef,
    selectedIdsRef,
    setSelectedProteinIds,
  });

  // ── 3. Medición de distancias — click handler ──────────────────────────────
  // Usamos el loci almacenado por el hover (siempre fiable porque el tooltip
  // funciona) en lugar de relanzar canvas3d.identify() en el click, que puede
  // fallar por sincronización con el pick buffer del GPU.
  //
  // Este useEffect escucha el evento 'click' del DOM en el container.
  // En modo distancia, useMolstarMouseControls devuelve sin preventDefault,
  // por lo que el evento 'click' del navegador llega aquí correctamente.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = () => {
      const { mode, pendingLoci: pending, addPendingLocus, clearPendingLoci } =
        useAnalysisStore.getState();

      if (mode !== 'distance') return;

      const loci = lastHoverLociRef.current;
      if (!loci) return; // cursor no está sobre ningún residuo

      const plugin = pluginRef.current;
      if (!plugin) return;

      if (pending.length === 0) {
        // Primer punto: guardar y resaltar visualmente en el visor
        addPendingLocus(loci);
        plugin.managers.interactivity.lociSelects.selectOnly({ loci });
      } else {
        // Segundo punto: verificar que no sea el mismo punto
        if (StructureElement.Loci.areEqual(pending[0], loci)) {
          plugin.managers.interactivity.lociSelects.deselectAll();
          clearPendingLoci();
          return;
        }

        // Crear la medida y limpiar selección temporal
        try {
          plugin.managers.structure.measurement.addDistance(pending[0], loci);
        } catch (err) {
          console.warn('[Analysis] addDistance failed:', err);
        }
        plugin.managers.interactivity.lociSelects.deselectAll();
        clearPendingLoci();
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [containerRef, pluginRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 4. Efectos reactivos ───────────────────────────────────────────────────

  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin) return;
    let cancelled = false;
    (async () => {
      const dirty = await syncStructures(
        plugin, entriesRef.current,
        proteinsById, proteinIdArray, reprTypeRef.current,
      );
      if (cancelled) return;
      if (dirty && entriesRef.current.size > 0) plugin.managers.camera.reset();
    })();
    return () => { cancelled = true; };
  }, [proteinsById, proteinId, pluginRef]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    pluginRef.current?.canvas3d?.setProps({
      renderer: { backgroundColor: Color.fromHexStyle(sceneBackground) },
    });
  }, [sceneBackground, pluginRef]);

  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || entriesRef.current.size === 0) return;
    updateAllRepresentations(plugin, entriesRef.current, viewerRepresentation).catch(console.error);
  }, [viewerRepresentation, pluginRef]);

  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || entriesRef.current.size === 0) {
      setSelectedTooltip(null);
      return;
    }
    if (!focusedResidue) {
      clearResidueSelection(plugin);
      setSelectedTooltip(null);
      return;
    }
    if (!proteinId) { setSelectedTooltip(null); return; }
    const entry = entriesRef.current.get(proteinId);
    if (!entry)   { setSelectedTooltip(null); return; }

    const loci = selectResidueBySeqId(plugin, entry, focusedResidue.seqId);
    const loc  = loci ? StructureElement.Loci.getFirstLocation(loci) : null;
    if (!loc)  { setSelectedTooltip(null); return; }

    const plddt = StructureProperties.atom.B_iso_or_equiv(loc);
    setSelectedTooltip({
      code:    StructureProperties.residue.auth_comp_id(loc),
      seqId:   StructureProperties.residue.auth_seq_id(loc),
      chainId: StructureProperties.chain.auth_asym_id(loc),
      plddt:   Number.isFinite(plddt) ? plddt.toFixed(1) : '0.0',
    });
  }, [focusedResidue, pluginRef, proteinId]);

  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin) return;
    plugin.canvas3d?.setProps(LIGHTING_PRESETS[viewerLighting] ?? LIGHTING_PRESETS.ao);
  }, [viewerLighting, pluginRef]);

  // ── 5. Análisis: puentes de hidrógeno ──────────────────────────────────────
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || entriesRef.current.size === 0) return;

    if (analysisMode !== 'hbonds') {
      if (hbondReprRefs.current.length > 0) {
        const builder = plugin.build();
        hbondReprRefs.current.forEach((ref) => {
          try { builder.delete(ref); } catch (_) { /* huérfana */ }
        });
        builder.commit().catch(console.error);
        hbondReprRefs.current = [];
      }
      return;
    }

    (async () => {
      const newRefs = [];
      for (const [, entry] of entriesRef.current) {
        try {
          const ref = await plugin.builders.structure.representation.addRepresentation(
            entry.transformedRef,
            { type: 'interactions' },
          );
          if (ref?.ref) newRefs.push(ref.ref);
        } catch (e) {
          console.warn('[Analysis] No se pudo añadir repr de interacciones:', e);
        }
      }
      hbondReprRefs.current = newRefs;
    })();
  }, [analysisMode, pluginRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 6. Análisis: limpiar todo ──────────────────────────────────────────────
  useEffect(() => {
    if (clearTrigger === 0) return;
    const plugin = pluginRef.current;
    if (!plugin) return;

    try { plugin.managers.structure.measurement.clear(); }
    catch (e) { console.warn('[Analysis] measurement.clear() failed:', e); }

    plugin.managers.interactivity.lociSelects.deselectAll();

    if (hbondReprRefs.current.length > 0) {
      const builder = plugin.build();
      hbondReprRefs.current.forEach((ref) => {
        try { builder.delete(ref); } catch (_) { /* huérfana */ }
      });
      builder.commit().catch(console.error);
      hbondReprRefs.current = [];
    }
  }, [clearTrigger, pluginRef]);

  // ── 7. Props para ViewerCanvas ─────────────────────────────────────────────
  return (
    <ViewerCanvas
      containerRef={containerRef}
      tooltip={tooltip}
      hasSelection={!!proteinId}
      analysisMode={analysisMode}
      pendingCount={pendingLoci.length}
      hasHoverTarget={!!hoverTooltip}
      onExitMode={clearAll}
    >
      <div />
    </ViewerCanvas>
  );
}
