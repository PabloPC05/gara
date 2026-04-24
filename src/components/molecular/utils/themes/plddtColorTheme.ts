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
const NO_SCORE = Color(0xaaaaaa);

function getBfactor(
	unit: import("molstar/lib/mol-model/structure.js").Unit,
	element: import("molstar/lib/mol-model/structure.js").StructureElement,
) {
	if (Unit.isAtomic(unit)) {
		return unit.model.atomicConformation.B_iso_or_equiv.value(element);
	}
	return -1;
}

function plddtColor(b: number): number {
	if (b < 0) return NO_SCORE;
	if (b >= 90) return VERY_HIGH;
	if (b >= 70) return HIGH;
	if (b >= 50) return MEDIUM;
	return LOW;
}

function AlphafoldPlddtColorTheme(
	ctx: unknown,
	props: Record<string, unknown>,
) {
	function color(location: unknown): number {
		if (StructureElement.Location.is(location)) {
			return plddtColor(
				getBfactor((location as any).unit, (location as any).element),
			);
		}
		if (Bond.isLocation(location)) {
			return plddtColor(
				getBfactor(
					(location as any).aUnit,
					(location as any).aUnit.elements[(location as any).aIndex],
				),
			);
		}
		return NO_SCORE;
	}

	return {
		factory: AlphafoldPlddtColorTheme,
		granularity: "group",
		preferSmoothing: true,
		color,
		props,
		description:
			"Colors residues by AlphaFold pLDDT confidence stored in the B-factor column. " +
			">90: dark blue (#0053D6); 70-90: cyan (#65CBF3); 50-70: yellow (#FFE91E); <50: orange (#FF7D45).",
	};
}

const AlphafoldPlddtColorThemeParams = {};

const AlphafoldPlddtColorThemeProvider = {
	name: "alphafold-plddt",
	label: "AlphaFold pLDDT",
	category: ColorThemeCategory.Validation,
	factory: AlphafoldPlddtColorTheme,
	getParams: () => AlphafoldPlddtColorThemeParams,
	defaultValues: PD.getDefaultValues(AlphafoldPlddtColorThemeParams),
	isApplicable: (ctx: any) =>
		!!ctx.structure &&
		ctx.structure.models.some(
			(m: any) => m.atomicConformation.B_iso_or_equiv.isDefined,
		),
};

export function registerAlphafoldPlddtTheme(plugin: PluginContext): void {
	const registry = plugin.representation?.structure?.themes?.colorThemeRegistry;
	if (!registry) return;
	if (registry.has(AlphafoldPlddtColorThemeProvider)) return;
	registry.add(AlphafoldPlddtColorThemeProvider);
}
