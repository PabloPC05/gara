const DEEP_LINK_TYPE = "camelia-view";
const DEEP_LINK_VERSION = 1;

// Estrategia de compartido:
// - "full": incluye datos estructurales completos en el payload.
// - "light": omite campos pesados (pdbData/cifData/structureData) para mantener la URL utilizable.
const SHARE_PAYLOAD_MAX_ENCODED_LENGTH = 6 * 1024;
const HEAVY_FIELDS = ["pdbData", "cifData", "structureData"];

export const SHARE_SERIALIZATION_STRATEGY = {
  FULL: "full",
  LIGHT: "light",
};

export function serializeViewerState({
  proteinsById,
  selectedProteinIds,
  plugin,
  focusedResidue,
  viewerSettings,
}) {
  const basePayload = buildPayload({
    proteinsById,
    selectedProteinIds,
    plugin,
    focusedResidue,
    viewerSettings,
    includeHeavyFields: true,
  });

  const fullEncoded = encodePayload(basePayload);
  if (fullEncoded.length <= SHARE_PAYLOAD_MAX_ENCODED_LENGTH) {
    return {
      encoded: fullEncoded,
      strategy: SHARE_SERIALIZATION_STRATEGY.FULL,
      encodedLength: fullEncoded.length,
      maxEncodedLength: SHARE_PAYLOAD_MAX_ENCODED_LENGTH,
    };
  }

  const lightPayload = buildPayload({
    proteinsById,
    selectedProteinIds,
    plugin,
    focusedResidue,
    viewerSettings,
    includeHeavyFields: false,
  });
  const lightEncoded = encodePayload(lightPayload);

  if (lightEncoded.length <= SHARE_PAYLOAD_MAX_ENCODED_LENGTH) {
    return {
      encoded: lightEncoded,
      strategy: SHARE_SERIALIZATION_STRATEGY.LIGHT,
      encodedLength: lightEncoded.length,
      maxEncodedLength: SHARE_PAYLOAD_MAX_ENCODED_LENGTH,
    };
  }

  return {
    encoded: null,
    strategy: SHARE_SERIALIZATION_STRATEGY.LIGHT,
    encodedLength: lightEncoded.length,
    maxEncodedLength: SHARE_PAYLOAD_MAX_ENCODED_LENGTH,
    error:
      "La sesión es demasiado grande para compartirla por URL, incluso en modo liviano.",
  };
}

function buildPayload({
  proteinsById,
  selectedProteinIds,
  plugin,
  focusedResidue,
  viewerSettings,
  includeHeavyFields,
}) {
  const camera = extractCameraSnapshot(plugin);

  const proteins = selectedProteinIds
    .map((id) => proteinsById[id])
    .filter(Boolean)
    .map((p) => {
      const protein: Record<string, unknown> = {
        id: p.id,
        name: p.name,
        pdbId: p.pdbId || null,
        sequence: p.sequence || null,
        structureFormat: p.structureFormat || null,
      };

      if (includeHeavyFields) {
        protein.pdbData = p.pdbData || p.structureData || null;
        protein.structureData = p.structureData || null;
        protein.cifData = p.cifData || null;
      }

      return protein;
    });

  return {
    type: DEEP_LINK_TYPE,
    version: DEEP_LINK_VERSION,
    strategy: includeHeavyFields
      ? SHARE_SERIALIZATION_STRATEGY.FULL
      : SHARE_SERIALIZATION_STRATEGY.LIGHT,
    proteins,
    selectedProteinIds,
    camera,
    focusedResidue: focusedResidue || null,
    viewerSettings: viewerSettings || {},
    exportedAt: new Date().toISOString(),
  };
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

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "El enlace compartido no contiene un payload válido.";
  }
  if (payload.type !== DEEP_LINK_TYPE) {
    return "El enlace no corresponde a una sesión compatible.";
  }
  if (payload.version !== DEEP_LINK_VERSION) {
    return "La versión del enlace compartido no es compatible.";
  }
  if (!Array.isArray(payload.proteins) || payload.proteins.length === 0) {
    return "El enlace no contiene proteínas para restaurar.";
  }

  for (const protein of payload.proteins) {
    if (!protein || typeof protein !== "object" || !protein.id) {
      return "El enlace compartido tiene proteínas incompletas o inválidas.";
    }
  }

  if (
    payload.strategy &&
    !Object.values(SHARE_SERIALIZATION_STRATEGY).includes(payload.strategy)
  ) {
    return "El enlace compartido usa una estrategia de serialización inválida.";
  }

  return null;
}

function deserializeViewerState(encoded) {
  try {
    const payload = decodePayload(encoded);
    const validationError = validatePayload(payload);
    if (validationError) {
      return { payload: null, error: validationError };
    }
    return { payload, error: null };
  } catch {
    return {
      payload: null,
      error:
        "No pudimos leer el enlace compartido. Puede estar truncado o dañado.",
    };
  }
}

export function buildShareUrl(encoded) {
  return `${window.location.origin}${window.location.pathname}?view=${encoded}`;
}

export function parseShareUrl({
  onError,
}: {
  onError?: (message: string) => void;
} = {}) {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("view");
    if (!encoded) return null;

    if (encoded.length > SHARE_PAYLOAD_MAX_ENCODED_LENGTH * 2) {
      onError?.("El enlace parece inválido: su tamaño excede el máximo esperado.");
      return null;
    }

    const { payload, error } = deserializeViewerState(encoded);
    if (error) {
      onError?.(error);
      return null;
    }
    return payload;
  } catch {
    onError?.("No pudimos procesar el enlace compartido.");
    return null;
  }
}

export function cleanShareUrl() {
  const params = new URLSearchParams(window.location.search);
  params.delete("view");

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

  window.history.replaceState({}, "", nextUrl);
}

export function getSharePayloadLimits() {
  return {
    maxEncodedLength: SHARE_PAYLOAD_MAX_ENCODED_LENGTH,
    heavyFields: [...HEAVY_FIELDS],
  };
}
