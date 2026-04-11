/**
 * Custom AlphaFold pLDDT color theme for Mol*.
 *
 * Maps each atom's B-factor column (which stores the pLDDT confidence score
 * 0–100 in AlphaFold PDB/mmCIF outputs) to the official 4-tier palette used
 * on the AlphaFold Protein Structure Database (EMBL-EBI).
 *
 *   > 90  →  #0053D6  dark blue   (Very High confidence)
 *  70–90  →  #65CBF3  cyan        (Confident)
 *  50–70  →  #FFE91E  yellow      (Low confidence)
 *   < 50  →  #FF7D45  orange      (Very Low confidence)
 */

import { Color } from 'molstar/lib/mol-util/color/index.js'
import { StructureElement, Unit, Bond } from 'molstar/lib/mol-model/structure.js'
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition.js'
import { ColorThemeCategory } from 'molstar/lib/mol-theme/color/categories.js'

// ─── AlphaFold pLDDT palette (exact hex) ──────────────────────────────────────
const VERY_HIGH = Color(0x0053D6) // >90  – dark blue
const HIGH      = Color(0x65CBF3) // 70–90 – cyan
const MEDIUM    = Color(0xFFE91E) // 50–70 – yellow
const LOW       = Color(0xFF7D45) // <50  – orange
const NO_SCORE  = Color(0xAAAAAA) // fallback (non-atomic or undefined)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read the B-factor (= pLDDT) for one atom element inside a unit. */
function getBfactor(unit, element) {
  if (Unit.isAtomic(unit)) {
    return unit.model.atomicConformation.B_iso_or_equiv.value(element)
  }
  return -1
}

/** Map a pLDDT score to its AlphaFold colour. */
function plddtColor(b) {
  if (b < 0) return NO_SCORE
  if (b >= 90) return VERY_HIGH
  if (b >= 70) return HIGH
  if (b >= 50) return MEDIUM
  return LOW
}

// ─── Theme factory ────────────────────────────────────────────────────────────

export function AlphafoldPlddtColorTheme(ctx, props) {
  /**
   * `color` is called once per rendered geometry group (one call per residue
   * in cartoon mode).  The `location` can be either a StructureElement or a
   * Bond endpoint.
   */
  function color(location) {
    if (StructureElement.Location.is(location)) {
      return plddtColor(getBfactor(location.unit, location.element))
    }
    if (Bond.isLocation(location)) {
      // `aIndex` is an index into `aUnit.elements`, not a raw element index
      return plddtColor(getBfactor(location.aUnit, location.aUnit.elements[location.aIndex]))
    }
    return NO_SCORE
  }

  return {
    factory: AlphafoldPlddtColorTheme,
    granularity: 'group',
    preferSmoothing: true,
    color,
    props,
    description:
      'Colors residues by AlphaFold pLDDT confidence stored in the B-factor column. ' +
      '>90: dark blue (#0053D6); 70–90: cyan (#65CBF3); 50–70: yellow (#FFE91E); <50: orange (#FF7D45).',
  }
}

export const AlphafoldPlddtColorThemeParams = {}

export const AlphafoldPlddtColorThemeProvider = {
  name: 'alphafold-plddt',
  label: 'AlphaFold pLDDT',
  category: ColorThemeCategory.Validation,
  factory: AlphafoldPlddtColorTheme,
  getParams: () => AlphafoldPlddtColorThemeParams,
  defaultValues: PD.getDefaultValues(AlphafoldPlddtColorThemeParams),
  isApplicable: (ctx) =>
    !!ctx.structure &&
    ctx.structure.models.some((m) => m.atomicConformation.B_iso_or_equiv.isDefined),
}

/**
 * Register the theme into the plugin's colour registry.
 * Safe to call multiple times — checks for an existing registration first.
 */
export function registerAlphafoldPlddtTheme(plugin) {
  const registry = plugin.representation?.structure?.themes?.colorThemeRegistry
  if (!registry) return
  if (registry.has(AlphafoldPlddtColorThemeProvider)) return
  registry.add(AlphafoldPlddtColorThemeProvider)
}
