import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms.js';
import { Mat4, Vec3 } from 'molstar/lib/mol-math/linear-algebra.js';
import { Color } from 'molstar/lib/mol-util/color/index.js';
import { Script } from 'molstar/lib/mol-script/script.js';
import { StructureSelection } from 'molstar/lib/mol-model/structure.js';

/**
 * Pipeline de procesamiento y carga de estructuras para Mol*.
 */

// --- Configuración y Constantes ---
export const DRAG_SCALE = 0.004;

/**
 * Configuración compartida de visibilidad de cámara para todos los presets.
 *
 * El plano far de Mol* se calcula como:
 *   far = cameraDistance + radiusMax
 *   radiusMax = scene.boundingSphere.radius × sceneRadiusFactor
 *
 * Con sceneRadiusFactor = 1 (defecto), el plano far está justo en el borde de la
 * esfera bounding. Las representaciones cartoon/ribbon sobresalen ligeramente más
 * allá del radio de átomos, quedando recortadas. Al hacer zoom el problema persiste
 * porque ambos (far y proteína) se desplazan proporcionalmente.
 *
 * Con sceneRadiusFactor = 3 y clipFar = false:
 *   far = cameraDistance + 3 × bspRadius   (fijo en espacio world respecto al centro)
 *   proteína visual ≤ cameraDistance + bspRadius + repr_padding
 *   → margen de ≥ 2×bspRadius → siempre visible sin importar el nivel de zoom
 */
const CAMERA_VISIBILITY = {
  cameraFog: { name: 'off', params: {} },        // sin niebla al fondo
  cameraClipping: { far: false, minNear: 0.1 },  // sin corte por plano far; plano near muy cercano
  sceneRadiusFactor: 3,                           // radiusMax = 3× bspRadius → far fijo y generoso
};

// Interacción de residuos: hover rojo y selección verde.
const RESIDUE_HOVER_COLOR = Color(0xef4444);
const RESIDUE_SELECT_COLOR = Color(0x22c55e);

const INTERACTION_RENDERER = {
  highlightColor: RESIDUE_HOVER_COLOR,
  selectColor: RESIDUE_SELECT_COLOR,
  highlightStrength: 0.45,
  selectStrength: 1.0,
  markerPriority: 2,
};

const INTERACTION_MARKING = {
  enabled: true,
  highlightEdgeColor: RESIDUE_HOVER_COLOR,
  selectEdgeColor: RESIDUE_SELECT_COLOR,
  highlightEdgeStrength: 1,
  selectEdgeStrength: 1,
};

export const LIGHTING_PRESETS = {
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
    renderer: {
      ...INTERACTION_RENDERER,
      ambientIntensity: 0.9,
      lightIntensity: 0.4,
      metalness: 0,
      roughness: 1.0,
    },
    marking: { ...INTERACTION_MARKING },
    ...CAMERA_VISIBILITY,
  },
  flat: {
    postprocessing: {
      occlusion: { name: 'off', params: {} },
      shadow: { name: 'off', params: {} },
    },
    renderer: {
      ...INTERACTION_RENDERER,
      ambientIntensity: 1.0,
      lightIntensity: 0.0,
      metalness: 0,
      roughness: 1.0,
    },
    marking: { ...INTERACTION_MARKING },
    ...CAMERA_VISIBILITY,
  },
  studio: {
    postprocessing: {
      occlusion: { name: 'off', params: {} },
      shadow: { name: 'off', params: {} },
    },
    renderer: {
      ...INTERACTION_RENDERER,
      ambientIntensity: 0.6,
      lightIntensity: 0.8,
      metalness: 0,
      roughness: 0.8,
    },
    marking: { ...INTERACTION_MARKING },
    ...CAMERA_VISIBILITY,
  },
};

/** 
 * Determina si un texto parece estar en formato CIF/mmCIF. 
 * @param {string} text Contenido del archivo.
 */
export function looksLikeCif(text) {
  if (!text) return false;
  return (
    /^\s*data_/m.test(text) ||
    /^\s*loop_\s*$/m.test(text) ||
    /^\s*_(entry|audit_conform|atom_site|struct)\./m.test(text)
  );
}

/** 
 * Resuelve el payload estructural (PDB o mmCIF) de un objeto proteína. 
 * @param {object} protein Objeto de proteína del store.
 */
export function resolveStructurePayload(protein) {
  const candidates = [
    { text: protein?.structureData, hintedFormat: protein?.structureFormat },
    { text: protein?.cifData, hintedFormat: 'cif' },
    { text: protein?.pdbData, hintedFormat: protein?.structureFormat },
  ];

  const candidate = candidates.find(({ text }) => typeof text === 'string' && text.trim().length > 0);
  if (!candidate) return null;

  const isCif = candidate.hintedFormat === 'cif' || looksLikeCif(candidate.text);
  return { text: candidate.text, format: isCif ? 'mmcif' : 'pdb' };
}

/**
 * Reescribe la columna B-factor de un PDB clásico con los valores pLDDT.
 * Mapea auth_seq_id (1-based, columnas 23-26) al índice del array (0-based).
 * @param {string} pdbText  Contenido en formato PDB
 * @param {number[]} plddt  Array plddt_per_residue (valores 0-100)
 * @returns {string} PDB con B-factors corregidos
 */
export function injectPlddtBfactors(pdbText, plddt) {
  if (!pdbText || !plddt?.length) return pdbText
  return pdbText.split('\n').map(line => {
    const rec = line.substring(0, 6)
    if (rec !== 'ATOM  ' && rec !== 'HETATM') return line
    const seqNum = parseInt(line.substring(22, 26).trim(), 10)
    if (isNaN(seqNum)) return line
    const idx = seqNum - 1
    if (idx < 0 || idx >= plddt.length) return line
    const bStr = plddt[idx].toFixed(2).padStart(6, ' ')
    return line.substring(0, 60) + bStr + line.substring(66)
  }).join('\n')
}

/**
 * Reescribe la columna B_iso_or_equiv de un mmCIF con los valores pLDDT.
 * Parsea los encabezados del loop _atom_site para localizar dinámicamente
 * las columnas de secuencia (auth_seq_id > label_seq_id) y B_iso_or_equiv.
 * @param {string} cifText  Contenido en formato mmCIF
 * @param {number[]} plddt  Array plddt_per_residue (valores 0-100)
 * @returns {string} mmCIF con B_iso_or_equiv corregidos
 */
export function injectPlddtBfactorsCif(cifText, plddt) {
  if (!cifText || !plddt?.length) return cifText

  const lines = cifText.split('\n')
  const result = []

  let headers = []
  let bIdx = -1
  let seqIdx = -1

  for (const line of lines) {
    const trimmed = line.trim()

    // Inicio de un bloque loop_ — resetear estado de cabeceras
    if (trimmed === 'loop_') {
      headers = []
      bIdx = -1
      seqIdx = -1
      result.push(line)
      continue
    }

    // Cabecera de columna _atom_site.*
    if (trimmed.startsWith('_atom_site.')) {
      const col = trimmed.split(/\s+/)[0]
      if (col === '_atom_site.B_iso_or_equiv') bIdx = headers.length
      // Preferir auth_seq_id; aceptar label_seq_id como fallback
      if (col === '_atom_site.auth_seq_id') seqIdx = headers.length
      else if (col === '_atom_site.label_seq_id' && seqIdx === -1) seqIdx = headers.length
      headers.push(col)
      result.push(line)
      continue
    }

    // Fila de datos de átomo: sustituir B_iso_or_equiv si tenemos los índices
    if (bIdx >= 0 && seqIdx >= 0 && (trimmed.startsWith('ATOM') || trimmed.startsWith('HETATM'))) {
      const tokens = trimmed.split(/\s+/)
      const seqNum = parseInt(tokens[seqIdx], 10)
      if (!isNaN(seqNum)) {
        const i = seqNum - 1
        if (i >= 0 && i < plddt.length) {
          tokens[bIdx] = plddt[i].toFixed(2)
          result.push(tokens.join(' '))
          continue
        }
      }
    }

    result.push(line)
  }

  return result.join('\n')
}

/**
 * Devuelve la propiedad de secuencia preferida: label_seq_id con fallback a auth_seq_id.
 * @param {object} Q Mol* query language builder.
 * @returns Expresión de propiedad de secuencia.
 */
function getPreferredSeqId(Q) {
  return Q.struct.atomProperty.macromolecular.label_seq_id();
}

/**
 * Carga una estructura en el plugin de Mol*.
 * @param {import('molstar/lib/mol-plugin/context').PluginContext} plugin
 * @param {string} id Identificador único.
 * @param {object} protein Datos de la proteína.
 * @param {string} reprType Tipo de representación (cartoon, ball-and-stick, etc).
 * @param {string} [colorScheme] Esquema de color (default: alphafold-plddt).
 */
export async function loadStructureEntry(plugin, id, protein, reprType, colorScheme) {
  const payload = resolveStructurePayload(protein);
  if (!payload) throw new Error(`No structural payload available for protein ${id}`);

  const { text: rawText, format } = payload;
  // Inyectar pLDDT en la columna B-factor/B_iso_or_equiv.
  // El backend genera el fichero de estructura con esa columna a 0; los valores
  // reales de confianza llegan por separado en plddt_per_residue.
  let text = rawText;
  if (protein.plddtPerResidue?.length) {
    if (format === 'pdb') text = injectPlddtBfactors(rawText, protein.plddtPerResidue);
    else if (format === 'mmcif') text = injectPlddtBfactorsCif(rawText, protein.plddtPerResidue);
  }
  const dataRef = await plugin.builders.data.rawData({ data: text, label: id });
  const traj = await plugin.builders.structure.parseTrajectory(dataRef, format);
  const model = await plugin.builders.structure.createModel(traj);
  const baseRef = await plugin.builders.structure.createStructure(model);

  // Nodo de transformación (identidad inicial)
  const transformedRef = await plugin
    .build()
    .to(baseRef)
    .apply(StateTransforms.Model.TransformStructureConformation, {
      transform: { name: 'matrix', params: { data: Array.from(Mat4.identity()), transpose: false } },
    })
    .commit();

  // Representación visual
  const reprRef = await plugin.builders.structure.representation.addRepresentation(
    transformedRef,
    { type: reprType ?? 'cartoon', typeParams: { alpha: 1, quality: 'high' }, color: colorScheme ?? 'alphafold-plddt' }
  );

  // Centro geométrico para rotaciones locales
  const structObj = plugin.state.data.cells.get(transformedRef.ref)?.obj?.data;
  const center = structObj?.boundary?.sphere?.center;
  const centroid = center ? Vec3.clone(center) : Vec3.create(0, 0, 0);

  return { id, dataRef, baseRef, transformedRef, reprRef, mat: Mat4.identity(), centroid };
}

/** 
 * Sincroniza las estructuras cargadas con la selección actual.
 * @returns {Promise<boolean>} True si ha habido cambios en la escena.
 */
export async function syncStructures(plugin, entriesMap, proteinsById, selectedIds, reprType, colorScheme) {
  let dirty = false;

  // 1. Limpieza: Eliminar lo que ya no está seleccionado
  for (const [id, entry] of entriesMap) {
    if (!proteinsById[id] || !selectedIds.includes(id)) {
      try {
        await plugin.build().delete(entry.dataRef.ref).commit();
      } catch (e) {
        console.warn(`[Mol*] Failed to delete entry ${id}:`, e);
      }
      entriesMap.delete(id);
      dirty = true;
    }
  }

  // 2. Carga: Añadir lo que falta
  for (const id of selectedIds) {
    if (entriesMap.has(id)) continue;
    const protein = proteinsById[id];
    if (!protein) continue;
    
    try {
      const entry = await loadStructureEntry(plugin, id, protein, reprType, colorScheme);
      entriesMap.set(id, entry);
      dirty = true;
    } catch (error) {
      console.error(`[Mol*] Could not load structure for ${id}`, error);
    }
  }

  return dirty;
}

/** 
 * Persiste una transformación de matriz en el nodo correspondiente del plugin. 
 */
export async function commitTransform(plugin, entry) {
  await plugin
    .build()
    .to(entry.transformedRef.ref)
    .update(StateTransforms.Model.TransformStructureConformation, () => ({
      transform: { name: 'matrix', params: { data: Array.from(entry.mat), transpose: false } },
    }))
    .commit();
}

/**
 * Selecciona un residuo por label_seq_id (con fallback a auth_seq_id) y enfoca la cámara sobre él.
 * @param {import('molstar/lib/mol-plugin/context').PluginContext} plugin
 * @param {object} entry Entrada del mapa de estructuras (con transformedRef).
 * @param {number} seqId Número de secuencia del residuo.
 */
export function selectResidueBySeqId(plugin, entry, seqId) {
  const structure = plugin.state.data.cells.get(entry.transformedRef.ref)?.obj?.data;
  if (!structure) return null;

  try {
    const sel = Script.getStructureSelection(
      (Q) => Q.struct.generator.atomGroups({
        'residue-test': Q.core.rel.eq([
          getPreferredSeqId(Q),
          seqId,
        ]),
        'group-by': Q.struct.atomProperty.macromolecular.residueKey(),
      }),
      structure,
    );
    const loci = StructureSelection.toLociWithSourceUnits(sel);
    plugin.managers.interactivity.lociSelects.selectOnly({ loci });
    // Activa la representación atómica (ball-and-stick) igual que al hacer clic en el visor
    plugin.managers.structure.focus.setFromLoci(loci);
    plugin.managers.camera.focusLoci(loci, { minRadius: 8, extraRadius: 4, durationMs: 500 });
    return loci;
  } catch (e) {
    console.warn('[Mol*] selectResidueBySeqId failed:', e);
    return null;
  }
}

/**
 * Limpia la selección y la representación de foco atómico.
 * @param {import('molstar/lib/mol-plugin/context').PluginContext} plugin
 */
export function clearResidueSelection(plugin) {
  plugin.managers.interactivity.lociSelects.deselectAll();
  plugin.managers.structure.focus.clear();
}

/**
 * Actualiza el tipo de representación visual para todas las estructuras.
 *
 * Cuando el tipo cambia (ej. cartoon → gaussian-surface), se descartan los
 * params previos porque cada tipo tiene su propio conjunto de parámetros.
 * Mantener params de cartoon en gaussian-surface causaría errores silenciosos
 * o renders incorrectos.
 */
export async function updateAllRepresentations(plugin, entriesMap, reprType) {
  for (const [, entry] of entriesMap) {
    await plugin
      .build()
      .to(entry.reprRef.ref)
      .update(StateTransforms.Representation.StructureRepresentation3D, (old) => {
        const sameType = old.type?.name === reprType;
        return {
          ...old,
          type: {
            name: reprType,
            // Preservar params solo si el tipo no cambia; si cambia, dejar
            // que Mol* aplique los defaults del nuevo tipo.
            params: sameType ? (old.type?.params ?? {}) : {},
          },
        };
      })
      .commit();
  }
}

export async function updateAllColorSchemes(plugin, entriesMap, colorScheme, customParams = null) {
  for (const [, entry] of entriesMap) {
    await plugin
      .build()
      .to(entry.reprRef.ref)
      .update(StateTransforms.Representation.StructureRepresentation3D, (old) => {
        const baseParams = old.colorTheme?.params ?? {};
        const newParams = customParams ? { ...baseParams, ...customParams } : baseParams;
        return {
          ...old,
          colorTheme: { name: colorScheme, params: newParams },
        };
      })
      .commit();
  }
}
