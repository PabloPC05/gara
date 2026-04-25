import { Color } from "molstar/lib/mol-util/color/index.js";
import { StructureElement, Bond } from "molstar/lib/mol-model/structure.js";
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition.js";
import { ColorThemeCategory } from "molstar/lib/mol-theme/color/categories.js";
import { StructureProperties } from "molstar/lib/mol-model/structure.js";
import {
	hydrophobicityColor,
	chargeColor,
	sidechainVolumeColor,
} from "@/utils/biochemistry";
import type { PluginContext } from "molstar/lib/mol-plugin/context.js";

const NO_SCORE = Color(0xaaaaaa);

function makeBiochemTheme(
	colorFn: (code: string) => number,
	label: string,
	description: string,
) {
	function theme(ctx: unknown, props: Record<string, unknown>) {
		function color(location: unknown): number {
			let code: string | undefined;
			if (StructureElement.Location.is(location)) {
				code = StructureProperties.residue
					.label_comp_id(location as any)
					.toUpperCase();
			} else if (Bond.isLocation(location)) {
				code = StructureProperties.residue
					.label_comp_id({
						unit: (location as any).aUnit,
						element: (location as any).aUnit.elements[(location as any).aIndex],
					} as any)
					.toUpperCase();
			}
			return code ? Color(colorFn(code)) : NO_SCORE;
		}
		return {
			factory: theme,
			granularity: "group",
			preferSmoothing: true,
			color,
			props,
			description,
		};
	}
	return theme;
}

const HydrophobicityColorTheme = makeBiochemTheme(
	hydrophobicityColor,
	"HydrophobicityColorTheme",
	"Colors residues by Kyte-Doolittle hydrophobicity. Blue = hydrophilic, Red = hydrophobic.",
);

const HydrophobicityColorThemeProvider = {
	name: "hydrophobicity-kyte-doolittle",
	label: "Hydrophobicity (Kyte-Doolittle)",
	category: ColorThemeCategory.Residue,
	factory: HydrophobicityColorTheme,
	getParams: () => ({}),
	defaultValues: PD.getDefaultValues({}),
	isApplicable: (ctx: any) => !!ctx.structure,
};

const ElectrostaticChargeTheme = makeBiochemTheme(
	chargeColor,
	"ElectrostaticChargeTheme",
	"Colors residues by electrostatic charge at pH 7.4. Blue = positive, Red = negative, Gray = neutral.",
);

const ElectrostaticChargeThemeProvider = {
	name: "electrostatic-charge",
	label: "Electrostatic Charge",
	category: ColorThemeCategory.Residue,
	factory: ElectrostaticChargeTheme,
	getParams: () => ({}),
	defaultValues: PD.getDefaultValues({}),
	isApplicable: (ctx: any) => !!ctx.structure,
};

const SideChainSizeTheme = makeBiochemTheme(
	sidechainVolumeColor,
	"SideChainSizeTheme",
	"Colors residues by side-chain volume. Yellow = small, Orange = medium, Purple = large.",
);

const SideChainSizeThemeProvider = {
	name: "side-chain-size",
	label: "Side-Chain Size",
	category: ColorThemeCategory.Residue,
	factory: SideChainSizeTheme,
	getParams: () => ({}),
	defaultValues: PD.getDefaultValues({}),
	isApplicable: (ctx: any) => !!ctx.structure,
};

const ALL_PROVIDERS = [
	HydrophobicityColorThemeProvider,
	ElectrostaticChargeThemeProvider,
	SideChainSizeThemeProvider,
];

export function registerBiochemicalThemes(plugin: PluginContext): void {
	const registry = plugin.representation?.structure?.themes?.colorThemeRegistry;
	if (!registry) return;
	for (const provider of ALL_PROVIDERS) {
		// @ts-expect-error Mol* color theme registry — provider type mismatch with granularity
		if (!registry.has(provider)) {
			// @ts-expect-error Mol* color theme registry.add — granularity type mismatch
			registry.add(provider);
		}
	}
}
