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
    renderer: { ambientIntensity: 0.9, lightIntensity: 0.4, metalness: 0, roughness: 1.0 },
    ...CAMERA_VISIBILITY,
  },
  flat: {
    postprocessing: {
      occlusion: { name: 'off', params: {} },
      shadow: { name: 'off', params: {} },
    },
    renderer: { ambientIntensity: 1.0, lightIntensity: 0.0, metalness: 0, roughness: 1.0 },
    ...CAMERA_VISIBILITY,
  },
  studio: {
    postprocessing: {
      occlusion: { name: 'off', params: {} },
      shadow: { name: 'off', params: {} },
    },
    renderer: { ambientIntensity: 0.6, lightIntensity: 0.8, metalness: 0, roughness: 0.8 },
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
 * Carga una estructura en el plugin de Mol*.
 * @param {import('molstar/lib/mol-plugin/context').PluginContext} plugin
 * @param {string} id Identificador único.
 * @param {object} protein Datos de la proteína.
 * @param {string} reprType Tipo de representación (cartoon, ball-and-stick, etc).
 */
export async function loadStructureEntry(plugin, id, protein, reprType) {
  const payload = resolveStructurePayload(protein);
  if (!payload) throw new Error(`No structural payload available for protein ${id}`);
  
  const { text, format } = payload;
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
    { type: reprType ?? 'cartoon', typeParams: { alpha: 1, quality: 'high' }, color: 'alphafold-plddt' }
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
export async function syncStructures(plugin, entriesMap, proteinsById, selectedIds, reprType) {
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
      const entry = await loadStructureEntry(plugin, id, protein, reprType);
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
 * Selecciona un residuo por su auth_seq_id y enfoca la cámara sobre él.
 * @param {import('molstar/lib/mol-plugin/context').PluginContext} plugin
 * @param {object} entry Entrada del mapa de estructuras (con transformedRef).
 * @param {number} seqId Número de secuencia del residuo (auth_seq_id).
 */
export function selectResidueBySeqId(plugin, entry, seqId) {
  const structure = plugin.state.data.cells.get(entry.transformedRef.ref)?.obj?.data;
  if (!structure) return null;

  try {
    const sel = Script.getStructureSelection(
      (Q) => Q.struct.generator.atomGroups({
        'residue-test': Q.core.rel.eq([
          Q.struct.atomProperty.macromolecular.auth_seq_id(),
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
 */
export async function updateAllRepresentations(plugin, entriesMap, reprType) {
  for (const [, entry] of entriesMap) {
    await plugin
      .build()
      .to(entry.reprRef.ref)
      .update(StateTransforms.Representation.StructureRepresentation3D, (old) => ({
        ...old,
        type: { name: reprType, params: old.type?.params ?? {} },
      }))
      .commit();
  }
}
