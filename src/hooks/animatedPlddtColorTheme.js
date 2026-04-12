import { Color } from 'molstar/lib/mol-util/color/index.js'
import { StructureElement, Unit, Bond } from 'molstar/lib/mol-model/structure.js'
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition.js'
import { ColorThemeCategory } from 'molstar/lib/mol-theme/color/categories.js'

const VERY_HIGH = Color(0x0053D6)
const HIGH      = Color(0x65CBF3)
const MEDIUM    = Color(0xFFE91E)
const LOW       = Color(0xFF7D45)
const LOW_PULSE = Color(0xFF2D2D)
const MID_PULSE = Color(0xFF7D45)
const NO_SCORE  = Color(0xAAAAAA)

function getBfactor(unit, element) {
  if (Unit.isAtomic(unit)) {
    return unit.model.atomicConformation.B_iso_or_equiv.value(element)
  }
  return -1
}

function lerpColor(a, b, t) {
  const ar = (a >>> 16) & 0xff, ag = (a >>> 8) & 0xff, ab = a & 0xff
  const br = (b >>> 16) & 0xff, bg = (b >>> 8) & 0xff, bb = b & 0xff
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return Color((rr << 16) | (rg << 8) | rb)
}

export function AnimatedPlddtColorTheme(ctx, props) {
  const time = props.time ?? 0

  function color(location) {
    let b
    if (StructureElement.Location.is(location)) {
      b = getBfactor(location.unit, location.element)
    } else if (Bond.isLocation(location)) {
      b = getBfactor(location.aUnit, location.aUnit.elements[location.aIndex])
    } else {
      return NO_SCORE
    }

    if (b < 0) return NO_SCORE
    if (b >= 90) return VERY_HIGH
    if (b >= 70) return HIGH
    if (b >= 50) {
      const t = Math.sin(time) * 0.3 + 0.5
      return lerpColor(MEDIUM, MID_PULSE, t)
    }
    const t = Math.sin(time) * 0.5 + 0.5
    return lerpColor(LOW, LOW_PULSE, t)
  }

  return {
    factory: AnimatedPlddtColorTheme,
    granularity: 'group',
    preferSmoothing: true,
    color,
    props,
    description:
      'Animated pLDDT color theme — flexible regions pulse orange↔red, stable core stays blue.',
  }
}

export const AnimatedPlddtColorThemeParams = {
  time: PD.Numeric(0, { min: 0, max: Math.PI * 2, step: 0.01 }),
}

export const AnimatedPlddtColorThemeProvider = {
  name: 'alphafold-plddt-flex',
  label: 'Animated pLDDT Flexibility',
  category: ColorThemeCategory.Validation,
  factory: AnimatedPlddtColorTheme,
  getParams: () => AnimatedPlddtColorThemeParams,
  defaultValues: PD.getDefaultValues(AnimatedPlddtColorThemeParams),
  isApplicable: (ctx) =>
    !!ctx.structure &&
    ctx.structure.models.some((m) => m.atomicConformation.B_iso_or_equiv.isDefined),
}

export function registerAnimatedPlddtTheme(plugin) {
  const registry = plugin.representation?.structure?.themes?.colorThemeRegistry
  if (!registry) return
  if (registry.has(AnimatedPlddtColorThemeProvider)) return
  registry.add(AnimatedPlddtColorThemeProvider)
}
