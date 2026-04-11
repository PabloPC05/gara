import { useEffect, useRef, useState } from 'react';
import { useMolstarViewer } from '../../hooks/useMolstarViewer';
import { registerAlphafoldPlddtTheme } from '../../hooks/plddtColorTheme';
import { useProteinStore } from '../../stores/useProteinStore';
import { useUIStore } from '../../stores/useUIStore';
import { useMolstarMouseControls } from '../../hooks/useMolstarMouseControls';
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

function getPreferredSeqId(loc) {
  const labelSeqId = StructureProperties.residue.label_seq_id(loc);
  if (Number.isFinite(labelSeqId) && labelSeqId > 0) return labelSeqId;
  const authSeqId = StructureProperties.residue.auth_seq_id(loc);
  return Number.isFinite(authSeqId) ? authSeqId : null;
}

/**
 * MolecularViewer — Orquestador principal del visor 3D.
 *
 * Responsabilidades:
 *  1. Inicializar el plugin Mol* (via useMolstarViewer)
 *  2. Sincronizar las proteínas del store con las estructuras cargadas en Mol*
 *  3. Reaccionar a cambios de representación, iluminación, fondo y residuo enfocado
 *  4. Gestionar el tooltip de hover sobre residuos
 *
 * Delega en:
 *  - structurePipeline.js → carga/descarga de estructuras, transformaciones
 *  - useMolstarMouseControls → eventos de ratón (picking, drag)
 *  - ViewerCanvas → capa visual React (grid, tooltip, overlay)
 */
export default function MolecularViewer() {
  // ── Store: proteínas ───────────────────────────────────────────────────────
  const proteinsById          = useProteinStore((s) => s.proteinsById);       // catálogo completo
  const selectedProteinIds    = useProteinStore((s) => s.selectedProteinIds); // IDs actualmente visibles
  const setSelectedProteinIds = useProteinStore((s) => s.setSelectedProteinIds);

  // ── Store: UI ──────────────────────────────────────────────────────────────
  const viewerRepresentation = useUIStore((s) => s.viewerRepresentation); // cartoon | ball-and-stick | …
  const viewerLighting       = useUIStore((s) => s.viewerLighting);       // ao | flat | studio
  const sceneBackground      = useUIStore((s) => s.viewerBackground);     // color hex del fondo
  const focusedResidue       = useUIStore((s) => s.focusedResidue);       // residuo seleccionado desde FastaBar
  const setFocusedResidue    = useUIStore((s) => s.setFocusedResidue);

  // ── Live refs ──────────────────────────────────────────────────────────────
  // Los callbacks async de Mol* cierran sobre estos refs, no sobre el estado
  // de React, para evitar stale closures en efectos de larga duración.
  const selectedIdsRef  = useRef(selectedProteinIds);
  const proteinsByIdRef = useRef(proteinsById);
  const reprTypeRef     = useRef(viewerRepresentation);
  const entriesRef      = useRef(new Map()); // Map<id, entry> — estructuras cargadas en Mol*

  useEffect(() => { selectedIdsRef.current  = selectedProteinIds; }, [selectedProteinIds]);
  useEffect(() => { proteinsByIdRef.current = proteinsById; }, [proteinsById]);
  useEffect(() => { reprTypeRef.current     = viewerRepresentation; }, [viewerRepresentation]);

  // ── Tooltip de residuos (hover + selección) ───────────────────────────────
  // - hoverTooltip: prioriza lo que está bajo el cursor en tiempo real.
  // - selectedTooltip: mantiene visible la info del residuo seleccionado.
  const [hoverTooltip, setHoverTooltip] = useState(null);
  const [selectedTooltip, setSelectedTooltip] = useState(null);
  const tooltip = hoverTooltip ?? selectedTooltip;

  // ── 1. Inicialización del plugin ───────────────────────────────────────────
  // useMolstarViewer crea el PluginContext, monta el canvas WebGL y llama a
  // setup() una sola vez tras la inicialización.
  const { containerRef, pluginRef } = useMolstarViewer({
    setup: async (plugin) => {
      // Registrar el tema de color pLDDT de AlphaFold (azul→cyan→amarillo→naranja)
      registerAlphafoldPlddtTheme(plugin);

      // Configurar iluminación inicial y desactivar niebla/clipping para que
      // la proteína se renderice completa sin desvanecerse en los extremos.
      // - cameraFog: off         → sin niebla al fondo
      // - cameraClipping.far: false → sin corte por plano far
      // - cameraClipping.radius: 0  → plano near al máximo del campo de visión
      plugin.canvas3d?.setProps({
        ...LIGHTING_PRESETS.ao,
        renderer: {
          ...LIGHTING_PRESETS.ao.renderer,
          backgroundColor: Color.fromHexStyle(sceneBackground),
        },
      });

      // Cargar las proteínas que ya estuvieran seleccionadas al montar el componente
      const dirty = await syncStructures(
        plugin, entriesRef.current,
        proteinsByIdRef.current, selectedIdsRef.current, reprTypeRef.current,
      );
      if (dirty && entriesRef.current.size > 0) plugin.managers.camera.reset();

      // Suscripción al evento hover de Mol*:
      // Cada vez que el cursor pasa sobre un átomo, extraemos el aminoácido,
      // la posición en la cadena y el pLDDT para mostrar en el tooltip.
      const hoverSub = plugin.behaviors.interaction.hover.subscribe(({ current }) => {
        if (!current?.loci || current.loci.kind !== 'element-loci') {
          setHoverTooltip(null);
          return;
        }
        try {
          const loc = StructureElement.Loci.getFirstLocation(current.loci);
          if (!loc) { setHoverTooltip(null); return; }
          const seqId = getPreferredSeqId(loc);
          if (seqId == null) { setHoverTooltip(null); return; }

          setHoverTooltip({
            code:    StructureProperties.residue.auth_comp_id(loc),    // p.ej. "GLY"
            seqId,                                                     // nº en la cadena
            chainId: StructureProperties.chain.auth_asym_id(loc),      // "A", "B", …
            plddt:   StructureProperties.atom.B_iso_or_equiv(loc).toFixed(1), // confianza AlphaFold
          });
        } catch (_) {
          setHoverTooltip(null);
        }
      });

      // Devolvemos la limpieza de la suscripción para cuando se desmonte
      return () => hoverSub.unsubscribe();
    },
    deps: [],
  });

  // ── 2. Controles de ratón ──────────────────────────────────────────────────
  // Picking (clic sobre átomo → selecciona proteína) y drag (rota estructura).
  useMolstarMouseControls({
    containerRef,
    pluginRef,
    entriesRef,
    selectedIdsRef,
    setSelectedProteinIds,
    setFocusedResidue,
  });

  // ── 3. Efectos reactivos ───────────────────────────────────────────────────

  // Sincronización de estructuras:
  // Cuando cambia el catálogo de proteínas o la selección, syncStructures elimina
  // lo que ya no está y carga lo que falta. Si hubo cambios, resetea la cámara.
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin) return;
    let cancelled = false;
    (async () => {
      const dirty = await syncStructures(
        plugin, entriesRef.current,
        proteinsById, selectedProteinIds, reprTypeRef.current,
      );
      if (cancelled) return;
      if (dirty && entriesRef.current.size > 0) plugin.managers.camera.reset();
    })();
    return () => { cancelled = true; };
  }, [proteinsById, selectedProteinIds, pluginRef]);

  // Color de fondo del canvas (hex → Color de Mol*)
  useEffect(() => {
    pluginRef.current?.canvas3d?.setProps({
      renderer: { backgroundColor: Color.fromHexStyle(sceneBackground) },
    });
  }, [sceneBackground, pluginRef]);

  // Tipo de representación visual (cartoon, ball-and-stick, surface…)
  // Actualiza todas las estructuras cargadas simultáneamente.
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || entriesRef.current.size === 0) return;
    updateAllRepresentations(plugin, entriesRef.current, viewerRepresentation).catch(console.error);
  }, [viewerRepresentation, pluginRef]);

  // Residuo enfocado desde la FastaBar:
  // Selecciona el residuo en Mol* y mueve la cámara hacia él con animación.
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

    const selectedProteinId = selectedProteinIds[0];
    const activeId =
      focusedResidue?.proteinId && focusedResidue.proteinId === selectedProteinId
        ? focusedResidue.proteinId
        : selectedProteinId;
    if (!activeId) {
      setSelectedTooltip(null);
      return;
    }
    const entry = entriesRef.current.get(activeId);
    if (!entry) {
      setSelectedTooltip(null);
      return;
    }

    const loci = selectResidueBySeqId(plugin, entry, focusedResidue.seqId);
    const loc = loci ? StructureElement.Loci.getFirstLocation(loci) : null;
    if (!loc) {
      setSelectedTooltip(null);
      return;
    }

    const seqId = getPreferredSeqId(loc);
    if (seqId == null) {
      setSelectedTooltip(null);
      return;
    }

    if (focusedResidue.seqId !== seqId || focusedResidue.proteinId !== activeId) {
      setFocusedResidue({ proteinId: activeId, seqId });
    }

    const plddt = StructureProperties.atom.B_iso_or_equiv(loc);
    setSelectedTooltip({
      code: StructureProperties.residue.auth_comp_id(loc),
      seqId,
      chainId: StructureProperties.chain.auth_asym_id(loc),
      plddt: Number.isFinite(plddt) ? plddt.toFixed(1) : '0.0',
    });
  }, [focusedResidue, pluginRef, selectedProteinIds, setFocusedResidue]);

  // Esquema de iluminación (ao / flat / studio):
  // Aplica el preset completo, incluyendo oclusión ambiental, sombras,
  // intensidades de luz, niebla desactivada y clipping sin corte.
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin) return;
    plugin.canvas3d?.setProps(LIGHTING_PRESETS[viewerLighting] ?? LIGHTING_PRESETS.ao);
  }, [viewerLighting, pluginRef]);

  // ── 4. Props para ViewerCanvas ─────────────────────────────────────────────
  const drawerOpen       = selectedProteinIds.length > 0;
  const isComparison     = selectedProteinIds.length >= 2;
  const visibleCount     = isComparison ? Math.min(selectedProteinIds.length, 4) : 1;

  return (
    <ViewerCanvas
      containerRef={containerRef}
      tooltip={tooltip}
      drawerOpen={drawerOpen}
      isComparison={isComparison}
      drawerVisibleCount={visibleCount}
    >
      <div />
    </ViewerCanvas>
  );
}
