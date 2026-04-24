import { useMemo, useState } from "react";
import {
	XAxis,
	YAxis,
	ReferenceLine,
	ResponsiveContainer,
	Area,
	ComposedChart,
	Line,
} from "recharts";
import { Zap, SlidersHorizontal } from "lucide-react";
import {
	calculateMolecularWeight,
	calculateNetCharge,
	calculateIsoelectricPoint,
	getChargeProfile,
	countIonizable,
} from "../../../utils/aminoAcids";
import { SingleDataCellLayout } from "../layout/SingleDataCellLayout";
import { intFmt, num2Fmt } from "../utils/dataFormatters";

export function PiChargeCalculatorWidget({ v }) {
	const sequence = (v?.sequence ?? "").replace(/\s+/g, "").toUpperCase();

	const [sliderPh, setSliderPh] = useState(7.0);
	const isValidSequence = sequence.length > 0;

	const computed = useMemo(() => {
		if (!isValidSequence) return null;
		const mwDa = calculateMolecularWeight(sequence);
		const pI = calculateIsoelectricPoint(sequence);
		const profile = getChargeProfile(sequence, 0.25);
		const ionizable = countIonizable(sequence);
		const chargeAtSlider = calculateNetCharge(sequence, sliderPh);
		return { mwDa, pI, profile, ionizable, chargeAtSlider };
	}, [isValidSequence, sequence, sliderPh]);

	const sliderMarkerData = useMemo(() => {
		if (!computed) return [];
		return computed.profile.map((p) => ({
			...p,
			sliderCharge:
				p.pH === Math.round(sliderPh * 4) / 4 ? computed.chargeAtSlider : null,
		}));
	}, [computed, sliderPh]);

	if (!isValidSequence || !computed) return null;

	const { mwDa, pI, profile, ionizable, chargeAtSlider } = computed;
	const mwKda = mwDa / 1000;
	const avgRes = mwDa / sequence.length;

	const pINote =
		pI == null ? null : pI > 7.4 ? "básica" : pI < 6.6 ? "ácida" : "neutra";
	const pITone =
		pI == null
			? "text-slate-800"
			: pI > 7.4
				? "text-blue-700"
				: pI < 6.6
					? "text-rose-700"
					: "text-slate-800";

	const chargeTone =
		chargeAtSlider > 0.5
			? "text-blue-700"
			: chargeAtSlider < -0.5
				? "text-rose-700"
				: "text-slate-800";

	const chargeLabel =
		chargeAtSlider > 0.5
			? "positiva"
			: chargeAtSlider < -0.5
				? "negativa"
				: "neutra";

	const ionizableList = [
		{ key: "Asp", letter: "D", label: "Asp (D)", pka: "3.65" },
		{ key: "Glu", letter: "E", label: "Glu (E)", pka: "4.25" },
		{ key: "His", letter: "H", label: "His (H)", pka: "6.00" },
		{ key: "Cys", letter: "C", label: "Cys (C)", pka: "8.18" },
		{ key: "Tyr", letter: "Y", label: "Tyr (Y)", pka: "10.07" },
		{ key: "Lys", letter: "K", label: "Lys (K)", pka: "10.53" },
		{ key: "Arg", letter: "R", label: "Arg (R)", pka: "12.48" },
	];

	const totalPos =
		(ionizable.Lys || 0) + (ionizable.Arg || 0) + (ionizable.His || 0);
	const totalNeg = (ionizable.Asp || 0) + (ionizable.Glu || 0);

	return (
		<section
			style={{
				maxWidth: "100%",
				overflow: "hidden",
				paddingTop: 10,
				paddingBottom: 10,
			}}
		>
			<div className="mb-1.5 flex items-center justify-between gap-3">
				<h3 className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
					<Zap className="h-3 w-3" strokeWidth={2} />
					Calculadora pI y carga neta
				</h3>
				<span className="font-mono text-[9px] tabular-nums text-slate-400">
					desde secuencia
				</span>
			</div>

			<div className="flex flex-col divide-y divide-slate-100 border-y border-slate-100">
				{mwKda != null && (
					<SingleDataCellLayout
						label="Peso molecular (calc.)"
						value={num2Fmt.format(mwKda)}
						unit="kDa"
						sub={`${intFmt.format(Math.round(mwDa))} Da`}
					/>
				)}
				{avgRes != null && (
					<SingleDataCellLayout
						label="Masa/residuo"
						value={num2Fmt.format(avgRes)}
						unit="Da/aa"
					/>
				)}
				{pI != null && (
					<SingleDataCellLayout
						label="Punto isoeléctrico (calc.)"
						value={num2Fmt.format(pI)}
						unit="pI"
						sub={pINote}
						tone={pITone}
					/>
				)}
				<SingleDataCellLayout
					label="Cargas (+) / (−)"
					value={`${totalPos} / ${totalNeg}`}
					sub="K+R+H / D+E"
				/>
			</div>

			<div className="mt-3 min-w-0 overflow-hidden rounded-none border border-slate-200 bg-slate-50/40 p-3">
				<div className="mb-2 flex items-center justify-between">
					<span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
						Carga vs pH
					</span>
					{pI != null && (
						<span className="font-mono text-[9px] text-slate-500">
							pI = <span className={pITone}>{num2Fmt.format(pI)}</span>
						</span>
					)}
				</div>

				<div style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
					<ResponsiveContainer width="100%" height={160}>
						<ComposedChart
							data={profile}
							margin={{ top: 5, right: 10, left: -15, bottom: 2 }}
						>
							<defs>
								<linearGradient id="chargeGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#2563eb" stopOpacity={0.08} />
									<stop offset="50%" stopColor="#f8fafc" stopOpacity={0} />
									<stop offset="100%" stopColor="#dc2626" stopOpacity={0.08} />
								</linearGradient>
							</defs>
							<XAxis
								dataKey="pH"
								type="number"
								domain={[0, 14]}
								ticks={[0, 2, 4, 6, 7.4, 8, 10, 12, 14]}
								tick={{
									fontSize: 8,
									fontFamily: "ui-monospace, monospace",
									fill: "#94a3b8",
								}}
								axisLine={{ stroke: "#e2e8f0" }}
								tickLine={{ stroke: "#e2e8f0" }}
							/>
							<YAxis
								tick={{
									fontSize: 8,
									fontFamily: "ui-monospace, monospace",
									fill: "#94a3b8",
								}}
								axisLine={{ stroke: "#e2e8f0" }}
								tickLine={{ stroke: "#e2e8f0" }}
							/>
							<ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
							{pI != null && (
								<ReferenceLine
									x={pI}
									stroke="#7c3aed"
									strokeWidth={1.5}
									strokeDasharray="4 3"
									label={{
										value: `pI ${num2Fmt.format(pI)}`,
										position: "top",
										fontSize: 8,
										fontFamily: "ui-monospace, monospace",
										fill: "#7c3aed",
									}}
								/>
							)}
							<ReferenceLine
								x={sliderPh}
								stroke="#0ea5e9"
								strokeWidth={1}
								label={{
									value: `pH ${num2Fmt.format(sliderPh)}`,
									position: "insideTopRight",
									fontSize: 8,
									fontFamily: "ui-monospace, monospace",
									fill: "#0ea5e9",
								}}
							/>
							<Area
								type="monotone"
								dataKey="charge"
								stroke="none"
								fill="url(#chargeGrad)"
							/>
							<Line
								type="monotone"
								dataKey="charge"
								stroke="#334155"
								strokeWidth={1.5}
								dot={false}
								isAnimationActive={false}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="mt-3 min-w-0 overflow-hidden rounded-none border border-slate-200 bg-white p-3">
				<div className="mb-2 flex items-center justify-between">
					<span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
						<SlidersHorizontal className="h-3 w-3" strokeWidth={2} />
						Explorador de pH
					</span>
					<span
						className={`font-mono text-[11px] font-bold tabular-nums ${chargeTone}`}
					>
						{chargeAtSlider > 0 ? "+" : ""}
						{num2Fmt.format(chargeAtSlider)} e{" "}
						<span className="text-[9px] font-normal text-slate-400">
							({chargeLabel})
						</span>
					</span>
				</div>

				<input
					type="range"
					min="0"
					max="14"
					step="0.1"
					value={sliderPh}
					onChange={(e) => setSliderPh(parseFloat(e.target.value))}
					className="h-1.5 w-full cursor-pointer appearance-none rounded-none bg-gradient-to-r from-blue-200 via-slate-200 to-rose-200 accent-slate-800 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-slate-800 [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-slate-800 [&::-webkit-slider-thumb]:shadow-md"
				/>

				<div className="mt-1 flex items-center justify-between font-mono text-[8px] text-slate-400">
					<span>pH 0 (ácido)</span>
					<span className="text-slate-300">|</span>
					<span>pH 7.0</span>
					<span className="text-slate-300">|</span>
					<span>pH 14 (básico)</span>
				</div>

				<div className="mt-2 grid grid-cols-3 gap-2">
					<div className="min-w-0 overflow-hidden rounded-none border border-slate-100 px-2 py-1.5 text-center">
						<div className="text-[8px] uppercase tracking-wider text-slate-400">
							pH
						</div>
						<div className="truncate font-mono text-[12px] font-bold tabular-nums text-slate-800">
							{num2Fmt.format(sliderPh)}
						</div>
					</div>
					<div className="min-w-0 overflow-hidden rounded-none border border-slate-100 px-2 py-1.5 text-center">
						<div className="text-[8px] uppercase tracking-wider text-slate-400">
							Carga
						</div>
						<div
							className={`truncate font-mono text-[12px] font-bold tabular-nums ${chargeTone}`}
						>
							{chargeAtSlider > 0 ? "+" : ""}
							{num2Fmt.format(chargeAtSlider)}
						</div>
					</div>
					<div className="min-w-0 overflow-hidden rounded-none border border-slate-100 px-2 py-1.5 text-center">
						<div className="text-[8px] uppercase tracking-wider text-slate-400">
							Migración
						</div>
						<div className="truncate text-[10px] font-bold tabular-nums text-slate-700">
							{Math.abs(chargeAtSlider) < 0.5
								? "Isoeléctrico"
								: chargeAtSlider > 0
									? "→ Cátodo (−)"
									: "→ Ánodo (+)"}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-3">
				<span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
					Residuos ionizables
				</span>
				<div className="mt-1 grid min-w-0 grid-cols-3 gap-x-2 gap-y-1">
					{ionizableList.map(({ key, label, pka }) => {
						const count = ionizable[key] ?? 0;
						const isPositive = key === "Lys" || key === "Arg" || key === "His";
						return (
							<div
								key={key}
								className="flex min-w-0 items-baseline gap-1 overflow-hidden rounded-none border border-slate-100 px-1.5 py-1"
							>
								<span
									className={`font-mono text-[10px] font-bold ${
										isPositive ? "text-blue-600" : "text-rose-600"
									}`}
								>
									{count}
								</span>
								<span className="truncate text-[8px] text-slate-500">
									{label}
								</span>
							</div>
						);
					})}
				</div>
				<div className="mt-1 min-w-0 overflow-hidden font-mono text-[8px] leading-relaxed text-slate-400">
					<span className="break-all">
						pKa: Asp 3.65 · Glu 4.25 · His 6.00 · Cys 8.18 · Tyr 10.07 · Lys
						10.53 · Arg 12.48
					</span>
				</div>
			</div>
		</section>
	);
}
