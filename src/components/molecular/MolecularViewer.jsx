import { useEffect, useRef, useState } from 'react';
import { useMolstarViewer } from '../../hooks/useMolstarViewer';
import { registerAlphafoldPlddtTheme } from '../../hooks/plddtColorTheme';
import { registerAnimatedPlddtTheme } from '../../hooks/animatedPlddtColorTheme';
import { registerBiochemicalThemes } from '../../hooks/biochemicalColorThemes';
import { useFlexibilityAnimation } from '../../hooks/useFlexibilityAnimation';
import { useProteinStore } from '../../stores/useProteinStore';
import { useUIStore } from '../../stores/useUIStore';
import { useMolstarStore } from '../../stores/useMolstarStore';
import { useMolstarMouseControls } from '../../hooks/useMolstarMouseControls';
import useAnalysisStore from '../../stores/useAnalysisStore';
import ViewerCanvas from './ViewerCanvas';

// --- Importaciones Mol* ---
import { StructureElement, StructureProperties, StructureSelection } from 'molstar/lib/mol-model/structure.js';
import { Script } from 'molstar/lib/mol-script/script.js';
import { Color } from 'molstar/lib/mol-util/color/index.js';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra.js';

// --- Servicios y Configuración ---
import {
  syncStructures,
  updateAllRepresentations,
  updateAllColorSchemes,
  selectResidueBySeqId,
  clearResidueSelection,
  LIGHTING_PRESETS
} from '../../lib/molstar/structurePipeline';

function getPreferredSeqId(loc) {
  const labelSeqId = StructureProperties.residue.label_seq_id(loc);
  if (Number.isFinite(labelSeqId) && labelSeqId > 0) return labelSeqId;
  const authSeqId = StructureProperties.residue.auth_seq_id(loc);
  return Number.isFinite(authSeqId) && authSeqId > 0 ? authSeqId : null;
}

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
 * Recibe proteinId como prop para soportar split-screen (cada visor muestra una proteína).
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
  const viewerColorScheme       = useUIStore((s) => s.viewerColorScheme);
  const sceneBackground         = useUIStore((s) => s.viewerBackground);
  const focusedResidueByProtein = useUIStore((s) => s.focusedResidueByProtein);
  const focusedResidue          = proteinId ? focusedResidueByProtein[proteinId] : null;
  const setFocusedResidue       = useUIStore((s) => s.setFocusedResidue);
  const pendingCamera           = useUIStore((s) => s.pendingCamera);
  const clearPendingCamera      = useUIStore((s) => s.clearPendingCamera);

  // ── Global Mol* ref (para exportar imagen, PDF, etc.) ────────────────────
  const setMolstarPluginRef = useMolstarStore((s) => s.setPluginRef);

  // ── Store: análisis ────────────────────────────────────────────────────────
  const analysisMode = useAnalysisStore((s) => s.mode);
  const pendingLoci  = useAnalysisStore((s) => s.pendingLoci);
  const clearTrigger = useAnalysisStore((s) => s.clearTrigger);
  const clearAll     = useAnalysisStore((s) => s.clearAll);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const selectedIdsRef    = useRef(proteinIdArray);
  const proteinsByIdRef   = useRef(proteinsById);
  const reprTypeRef       = useRef(viewerRepresentation);
  const colorSchemeRef    = useRef(viewerColorScheme);
  const entriesRef        = useRef(new Map());
  const focusedResidueRef = useRef(focusedResidue);

  // Loci del átomo/residuo actualmente bajo el cursor.
  // Actualizado por la suscripción al hover de Mol* y usado por el handler de click.
  const lastHoverLociRef = useRef(null);

  // Refs a las representaciones de H-bonds añadidas dinámicamente
  const hbondReprRefs = useRef([]);

  useEffect(() => { selectedIdsRef.current    = proteinIdArray; }, [proteinId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { proteinsByIdRef.current   = proteinsById; },   [proteinsById]);
  useEffect(() => { reprTypeRef.current       = viewerRepresentation; }, [viewerRepresentation]);
  useEffect(() => { colorSchemeRef.current    = viewerColorScheme; }, [viewerColorScheme]);
  useEffect(() => { focusedResidueRef.current = focusedResidue; }, [focusedResidue]);

  // ── Tooltip ────────────────────────────────────────────────────────────────
  const [hoverTooltip,    setHoverTooltip]    = useState(null);
  const [selectedTooltip, setSelectedTooltip] = useState(null);
  const tooltip = hoverTooltip ?? selectedTooltip;

  // ── 1. Inicialización del plugin ───────────────────────────────────────────
  const { containerRef, pluginRef } = useMolstarViewer({
    setup: async (plugin) => {
      registerAlphafoldPlddtTheme(plugin);
      registerAnimatedPlddtTheme(plugin);
      registerBiochemicalThemes(plugin);

      plugin.canvas3d?.setProps({
        ...LIGHTING_PRESETS.ao,
        renderer: {
          ...LIGHTING_PRESETS.ao.renderer,
          backgroundColor: Color.fromHexStyle(sceneBackground),
        },
      });

      const dirty = await syncStructures(
        plugin, entriesRef.current,
        proteinsByIdRef.current, selectedIdsRef.current, reprTypeRef.current, colorSchemeRef.current,
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
          const seqId = getPreferredSeqId(loc);
          if (seqId == null) {
            setHoverTooltip(null);
            lastHoverLociRef.current = null;
            return;
          }

          lastHoverLociRef.current = current.loci; // clave para la medición
          setHoverTooltip({
            code:    StructureProperties.residue.auth_comp_id(loc),
            seqId,
            chainId: StructureProperties.chain.auth_asym_id(loc),
            plddt:   StructureProperties.atom.B_iso_or_equiv(loc).toFixed(1),
          });
        } catch (_) {
          setHoverTooltip(null);
          lastHoverLociRef.current = null;
        }
      });

      // Suscripción al evento click de Mol*:
      // Sincroniza la selección en el visor 3D con la FastaBar (bidireccional).
      // En modo medición de distancias, NO seleccionamos residuos para evitar que
      // la cámara se mueva al foco del residuo mientras el usuario mide.
      const clickSub = plugin.behaviors.interaction.click.subscribe(({ current }) => {
        if (useAnalysisStore.getState().mode === 'distance') return;

        if (!current?.loci || current.loci.kind !== 'element-loci') {
          // Al hacer clic en el vacío, re-aplicamos el foco visual si había un residuo seleccionado.
          const currentFocused = focusedResidueRef.current;
          const currentProteinId = selectedIdsRef.current[0];
          if (currentFocused && currentProteinId && entriesRef.current.has(currentProteinId)) {
            setTimeout(() => {
              if (!pluginRef.current) return;
              const entry = entriesRef.current.get(currentProteinId);
              if (!entry) return;
              const structure = pluginRef.current.state.data.cells.get(entry.transformedRef.ref)?.obj?.data;
              if (!structure) return;
              try {
                const sel = Script.getStructureSelection(
                  (Q) => Q.struct.generator.atomGroups({
                    'residue-test': Q.core.rel.eq([
                      Q.struct.atomProperty.macromolecular.label_seq_id(),
                      currentFocused.seqId,
                    ]),
                    'group-by': Q.struct.atomProperty.macromolecular.residueKey(),
                  }),
                  structure
                );
                const loci = StructureSelection.toLociWithSourceUnits(sel);
                pluginRef.current.managers.interactivity.lociSelects.selectOnly({ loci });
                pluginRef.current.managers.structure.focus.setFromLoci(loci);
              } catch (e) {
                console.error('[Mol*] Error re-aplicando selección:', e);
              }
            }, 30);
          }
          return;
        }
        try {
          const loc = StructureElement.Loci.getFirstLocation(current.loci);
          if (!loc) return;
          const seqId = getPreferredSeqId(loc);
          if (seqId == null) return;

          // Identificar a qué proteína pertenece la estructura clicada
          const structure = current.loci.structure;
          let clickedProteinId = selectedIdsRef.current[0];

          for (const [id, entry] of entriesRef.current.entries()) {
            const entryStructure = plugin.state.data.cells.get(entry.transformedRef.ref)?.obj?.data;
            if (entryStructure === structure) {
              clickedProteinId = id;
              break;
            }
          }

          if (clickedProteinId) {
            const currentFocused = focusedResidueRef.current;
            // Si hacemos clic en el mismo residuo que ya está seleccionado, lo deseleccionamos
            if (currentFocused && currentFocused.seqId === seqId) {
              setFocusedResidue(clickedProteinId, null);
            } else {
              setFocusedResidue(clickedProteinId, { seqId });
            }
          }
        } catch (e) {
          console.error('[Mol*] Error en click:', e);
        }
      });

      return () => {
        hoverSub.unsubscribe();
        clickSub.unsubscribe();
      };
    },
    deps: [],
  });

  // ── 2. Controles de ratón (selección + drag) ───────────────────────────────
  useEffect(() => { setMolstarPluginRef(pluginRef); }, [pluginRef, setMolstarPluginRef]);

  useMolstarMouseControls({
    containerRef,
    pluginRef,
    entriesRef,
    selectedIdsRef,
    setSelectedProteinIds,
  });

  // ── 2b. Simulación de flexibilidad (color animado + micro-shake) ──────────
  useFlexibilityAnimation(pluginRef, entriesRef);

  // ── 3. Medición de distancias — click handler ──────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = () => {
      const { mode, pendingLoci: pending, addPendingLocus, clearPendingLoci } =
        useAnalysisStore.getState();

      if (mode !== 'distance') return;

      const loci = lastHoverLociRef.current;
      if (!loci) return;

      const plugin = pluginRef.current;
      if (!plugin) return;

      if (pending.length === 0) {
        addPendingLocus(loci);
        plugin.managers.interactivity.lociSelects.selectOnly({ loci });
      } else {
        if (StructureElement.Loci.areEqual(pending[0], loci)) {
          plugin.managers.interactivity.lociSelects.deselectAll();
          clearPendingLoci();
          return;
        }

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

  // Sincronización de estructuras
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin) return;
    let cancelled = false;
    (async () => {
      const dirty = await syncStructures(
        plugin, entriesRef.current,
        proteinsById, proteinIdArray, reprTypeRef.current, colorSchemeRef.current,
      );
      if (cancelled) return;
      if (dirty && entriesRef.current.size > 0) plugin.managers.camera.reset();
    })();
    return () => { cancelled = true; };
  }, [proteinsById, proteinId, pluginRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restaurar cámara desde deep link (one-shot)
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || !pendingCamera || entriesRef.current.size === 0) return;
    const c = plugin.canvas3d;
    if (!c) return;
    c.camera.setState({
      position: Vec3.create(...pendingCamera.position),
      target: Vec3.create(...pendingCamera.target),
      up: Vec3.create(...pendingCamera.up),
    });
    clearPendingCamera();
  }, [pendingCamera, pluginRef, proteinId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Color de fondo del canvas
  useEffect(() => {
    pluginRef.current?.canvas3d?.setProps({
      renderer: { backgroundColor: Color.fromHexStyle(sceneBackground) },
    });
  }, [sceneBackground, pluginRef]);

  // Tipo de representación visual
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || entriesRef.current.size === 0) return;
    updateAllRepresentations(plugin, entriesRef.current, viewerRepresentation).catch(console.error);
  }, [viewerRepresentation, pluginRef]);

  // Esquema de coloración (pLDDT, hidrofobicidad, carga, tamaño)
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || entriesRef.current.size === 0) return;
    updateAllColorSchemes(plugin, entriesRef.current, viewerColorScheme).catch(console.error);
  }, [viewerColorScheme, pluginRef]);

  // Residuo enfocado desde la FastaBar
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

  // Esquema de iluminación
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin) return;
    plugin.canvas3d?.setProps(LIGHTING_PRESETS[viewerLighting] ?? LIGHTING_PRESETS.ao);
  }, [viewerLighting, pluginRef]);

  // ── 4b. Limpieza de mediciones al cambiar de proteína ────────────────────
  // Cuando cambia el proteinId, las mediciones previas referencian estructuras
  // que podrían haber sido descargadas. Las limpiamos para evitar errores.
  const prevProteinIdRef = useRef(proteinId);
  useEffect(() => {
    if (prevProteinIdRef.current === proteinId) return;
    prevProteinIdRef.current = proteinId;

    const plugin = pluginRef.current;
    if (!plugin) return;
    try { plugin.managers.structure.measurement.clear(); } catch (_) { /* no-op */ }
    plugin.managers.interactivity.lociSelects.deselectAll();
    useAnalysisStore.getState().clearPendingLoci();
  }, [proteinId, pluginRef]);

  // ── 4c. Esc para salir de modos de análisis ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const { mode } = useAnalysisStore.getState();
        if (mode) {
          e.preventDefault();
          clearAll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearAll]);

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
