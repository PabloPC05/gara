/**
 * Biochemical "Lens" color themes for Mol*.
 *
 * Each lens paints the protein by a different physical-chemical property
 * of its amino-acid residues, using only static lookup tables (zero API).
 *
 * Lenses:
 *   1. Hydrophobicity (Kyte-Doolittle)  — blue ↔ white ↔ red gradient
 *   2. Electrostatic charge              — blue / gray / red discrete
 *   3. Side-chain size                   — yellow ↔ orange ↔ purple gradient
 */

import { Color } from 'molstar/lib/mol-util/color/index.js'
import { StructureElement, Bond } from 'molstar/lib/mol-model/structure.js'
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition.js'
import { ColorThemeCategory } from 'molstar/lib/mol-theme/color/categories.js'
import { StructureProperties } from 'molstar/lib/mol-model/structure.js'
import {
  hydrophobicityColor,
  chargeColor,
  sidechainVolumeColor,
} from '../utils/biochemistry.js'

const NO_SCORE = Color(0xaaaaaa)

function makeBiochemTheme(colorFn, label, description) {
  function theme(ctx, props) {
    function color(location) {
      let code;
      if (StructureElement.Location.is(location)) {
        code = StructureProperties.residue.label_comp_id(location).toUpperCase();
      } else if (Bond.isLocation(location)) {
        code = StructureProperties.residue.label_comp_id({
          unit: location.aUnit,
          element: location.aUnit.elements[location.aIndex],
        }).toUpperCase();
      }
      return code ? Color(colorFn(code)) : NO_SCORE;
    }
    return {
      factory: theme,
      granularity: 'group',
      preferSmoothing: true,
      color,
      props,
      description,
    };
  }
  return theme;
}

// ─── 1. Hydrophobicity (Kyte-Doolittle) ──────────────────────────────────────

const HydrophobicityColorTheme = makeBiochemTheme(
  hydrophobicityColor,
  'HydrophobicityColorTheme',
  'Colors residues by Kyte-Doolittle hydrophobicity. Blue = hydrophilic, Red = hydrophobic.',
)

export const HydrophobicityColorThemeProvider = {
  name: 'hydrophobicity-kyte-doolittle',
  label: 'Hydrophobicity (Kyte-Doolittle)',
  category: ColorThemeCategory.Residue,
  factory: HydrophobicityColorTheme,
  getParams: () => ({}),
  defaultValues: PD.getDefaultValues({}),
  isApplicable: (ctx) => !!ctx.structure,
}

// ─── 2. Electrostatic Charge ─────────────────────────────────────────────────

const ElectrostaticChargeTheme = makeBiochemTheme(
  chargeColor,
  'ElectrostaticChargeTheme',
  'Colors residues by electrostatic charge at pH 7.4. Blue = positive, Red = negative, Gray = neutral.',
)

export const ElectrostaticChargeThemeProvider = {
  name: 'electrostatic-charge',
  label: 'Electrostatic Charge',
  category: ColorThemeCategory.Residue,
  factory: ElectrostaticChargeTheme,
  getParams: () => ({}),
  defaultValues: PD.getDefaultValues({}),
  isApplicable: (ctx) => !!ctx.structure,
}

// ─── 3. Side-Chain Size ──────────────────────────────────────────────────────

const SideChainSizeTheme = makeBiochemTheme(
  sidechainVolumeColor,
  'SideChainSizeTheme',
  'Colors residues by side-chain volume. Yellow = small, Orange = medium, Purple = large.',
)

export const SideChainSizeThemeProvider = {
  name: 'side-chain-size',
  label: 'Side-Chain Size',
  category: ColorThemeCategory.Residue,
  factory: SideChainSizeTheme,
  getParams: () => ({}),
  defaultValues: PD.getDefaultValues({}),
  isApplicable: (ctx) => !!ctx.structure,
}

// ─── Registration ─────────────────────────────────────────────────────────────

const ALL_PROVIDERS = [
  HydrophobicityColorThemeProvider,
  ElectrostaticChargeThemeProvider,
  SideChainSizeThemeProvider,
]

/**
 * Register all biochemical lens themes into the plugin's color registry.
 * Safe to call multiple times — skips already-registered providers.
 */
export function registerBiochemicalThemes(plugin) {
  const registry = plugin.representation?.structure?.themes?.colorThemeRegistry
  if (!registry) return
  for (const provider of ALL_PROVIDERS) {
    if (!registry.has(provider)) {
      registry.add(provider)
    }
  }
}
