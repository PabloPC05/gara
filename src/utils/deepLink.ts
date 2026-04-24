const DEEP_LINK_TYPE = "camelia-view";
const DEEP_LINK_VERSION = 1;

export function serializeViewerState({
  proteinsById,
  selectedProteinIds,
  plugin,
  focusedResidue,
  viewerSettings,
}) {
  const camera = extractCameraSnapshot(plugin);

  const proteins = selectedProteinIds
    .map((id) => proteinsById[id])
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      pdbId: p.pdbId || null,
      sequence: p.sequence || null,
      pdbData: p.pdbData || p.structureData || null,
      structureFormat: p.structureFormat || null,
      structureData: p.structureData || null,
      cifData: p.cifData || null,
    }));

  const payload = {
    type: DEEP_LINK_TYPE,
    version: DEEP_LINK_VERSION,
    proteins,
    selectedProteinIds,
    camera,
    focusedResidue: focusedResidue || null,
    viewerSettings: viewerSettings || {},
    exportedAt: new Date().toISOString(),
  };

  return encodePayload(payload);
}

function extractCameraSnapshot(plugin) {
  if (!plugin?.canvas3d) return null;
  try {
    const snap = plugin.canvas3d.camera.getSnapshot();
    return {
      position: vec3ToArray(snap.position),
      target: vec3ToArray(snap.target),
      up: vec3ToArray(snap.up),
    };
  } catch {
    return null;
  }
}

function vec3ToArray(v) {
  if (!v) return null;
  return [v[0], v[1], v[2]];
}

function encodePayload(payload) {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodePayload(encoded) {
  const json = decodeURIComponent(escape(atob(encoded)));
  return JSON.parse(json);
}

function deserializeViewerState(encoded) {
  try {
    const payload = decodePayload(encoded);
    if (payload.type !== DEEP_LINK_TYPE) return null;
    if (payload.version !== DEEP_LINK_VERSION) return null;
    if (!Array.isArray(payload.proteins) || payload.proteins.length === 0)
      return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildShareUrl(encoded) {
  return `${window.location.origin}${window.location.pathname}?view=${encoded}`;
}

export function parseShareUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("view");
    if (!encoded) return null;
    return deserializeViewerState(encoded);
  } catch {
    return null;
  }
}

export function cleanShareUrl() {
  window.history.replaceState({}, "", window.location.pathname);
}
