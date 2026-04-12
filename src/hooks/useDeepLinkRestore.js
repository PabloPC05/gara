import { useEffect, useRef } from 'react';
import { useProteinStore } from '../stores/useProteinStore';
import { useUIStore } from '../stores/useUIStore';
import { parseShareUrl, cleanShareUrl } from '../utils/deepLink';

export function useDeepLinkRestore() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const state = parseShareUrl();
    if (!state) return;

    const { upsertProtein, setSelectedProteinIds } = useProteinStore.getState();
    const ui = useUIStore.getState();

    for (const p of state.proteins) {
      upsertProtein({
        id: p.id,
        name: p.name || p.id,
        pdbId: p.pdbId || null,
        sequence: p.sequence || null,
        pdbData: p.pdbData || null,
        structureData: p.structureData || p.pdbData || null,
        structureFormat: p.structureFormat || (p.pdbData ? 'pdb' : null),
        cifData: p.cifData || null,
      });
    }

    const ids = state.proteins.map((p) => p.id);
    setSelectedProteinIds(ids);

    if (state.viewerSettings) {
      const vs = state.viewerSettings;
      if (vs.representation) ui.setViewerRepresentation(vs.representation);
      if (vs.lighting) ui.setViewerLighting(vs.lighting);
      if (vs.background) ui.setViewerBackground(vs.background);
    }

    if (state.focusedResidue) {
      ui.setFocusedResidue(state.focusedResidue);
    }

    if (state.camera) {
      ui.setPendingCamera(state.camera);
    }

    cleanShareUrl();
  }, []);
}
