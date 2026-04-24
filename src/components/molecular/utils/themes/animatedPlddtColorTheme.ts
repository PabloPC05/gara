import { Color } from "molstar/lib/mol-util/color/index.js";
import {
	StructureElement,
	Unit,
	Bond,
} from "molstar/lib/mol-model/structure.js";
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition.js";
import { ColorThemeCategory } from "molstar/lib/mol-theme/color/categories.js";
import type { PluginContext } from "molstar/lib/mol-plugin/context.js";

const VERY_HIGH = Color(0x0053d6);
const HIGH = Color(0x65cbf3);
const MEDIUM = Color(0xffe91e);
const LOW = Color(0xff7d45);
const LOW_PULSE = Color(0xff2d2d);
const MID_PULSE = Color(0xff7d45);
const NO_SCORE = Color(0xaaaaaa);

function getBfactor(unit: any, element: any): number {
	if (Unit.isAtomic(unit)) {
		return unit.model.atomicConformation.B_iso_or_equiv.value(element);
	}
	return -1;
}

function lerpColor(a: number, b: number, t: number): number {
	const ar = (a >>> 16) & 0xff,
		ag = (a >>> 8) & 0xff,
		ab = a & 0xff;
	const br = (b >>> 16) & 0xff,
		bg = (b >>> 8) & 0xff,
		bb = b & 0xff;
	const rr = Math.round(ar + (br - ar) * t);
	const rg = Math.round(ag + (bg - ag) * t);
	const rb = Math.round(ab + (bb - ab) * t);
	return Color((rr << 16) | (rg << 8) | rb);
}

function AnimatedPlddtColorTheme(ctx: unknown, props: any) {
	const time = props.time ?? 0;

	function color(location: unknown): number {
		let b: number;
		if (StructureElement.Location.is(location)) {
			b = getBfactor((location as any).unit, (location as any).element);
		} else if (Bond.isLocation(location)) {
			b = getBfactor(
				(location as any).aUnit,
				(location as any).aUnit.elements[(location as any).aIndex],
			);
		} else {
			return NO_SCORE;
		}

		if (b < 0) return NO_SCORE;
		if (b >= 90) return VERY_HIGH;
		if (b >= 70) return HIGH;
		if (b >= 50) {
			const t = Math.sin(time) * 0.3 + 0.5;
			return lerpColor(MEDIUM, MID_PULSE, t);
		}
		const t = Math.sin(time) * 0.5 + 0.5;
		return lerpColor(LOW, LOW_PULSE, t);
	}

	return {
		factory: AnimatedPlddtColorTheme,
		granularity: "group",
		preferSmoothing: true,
		color,
		props,
		description:
			"Animated pLDDT color theme — flexible regions pulse orange<->red, stable core stays blue.",
	};
}

const AnimatedPlddtColorThemeParams = {
	time: PD.Numeric(0, { min: 0, max: Math.PI * 2, step: 0.01 }),
};

const AnimatedPlddtColorThemeProvider = {
	name: "alphafold-plddt-flex",
	label: "Animated pLDDT Flexibility",
	category: ColorThemeCategory.Validation,
	factory: AnimatedPlddtColorTheme,
	getParams: () => AnimatedPlddtColorThemeParams,
	defaultValues: PD.getDefaultValues(AnimatedPlddtColorThemeParams),
	isApplicable: (ctx: any) =>
		!!ctx.structure &&
		ctx.structure.models.some(
			(m: any) => m.atomicConformation.B_iso_or_equiv.isDefined,
		),
};

export function registerAnimatedPlddtTheme(plugin: PluginContext): void {
	const registry = plugin.representation?.structure?.themes?.colorThemeRegistry;
	if (!registry) return;
	if (registry.has(AnimatedPlddtColorThemeProvider)) return;
	registry.add(AnimatedPlddtColorThemeProvider);
}
