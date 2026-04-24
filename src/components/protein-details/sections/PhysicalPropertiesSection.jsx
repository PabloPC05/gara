import { SectionContainerLayout } from "../layout/SectionContainerLayout";
import { SingleDataCellLayout } from "../layout/SingleDataCellLayout";
import { intFmt, num2Fmt, num3Fmt } from "../utils/dataFormatters";

export function PhysicalPropertiesSection({ v }) {
  const mwKda = v.mwDa != null ? v.mwDa / 1000 : null;
  const avgRes = v.length > 0 && v.mwDa != null ? v.mwDa / v.length : null;
  const pI = v.isoelectricPoint;
  const pINote =
    pI == null ? null : pI > 7.4 ? "básica" : pI < 6.6 ? "ácida" : "neutra";
  const pITone =
    pI == null
      ? null
      : pI > 7.4
        ? "text-blue-700"
        : pI < 6.6
          ? "text-rose-700"
          : "text-slate-800";

  const net =
    v.positiveCharges != null && v.negativeCharges != null
      ? v.positiveCharges - v.negativeCharges
      : null;
  const netTone =
    net == null
      ? "text-slate-800"
      : net > 0
        ? "text-blue-700"
        : net < 0
          ? "text-rose-700"
          : "text-slate-800";

  const hasAny =
    v.length != null ||
    mwKda != null ||
    pI != null ||
    v.positiveCharges != null ||
    v.negativeCharges != null ||
    v.cysteines != null ||
    v.halfLife != null ||
    v.extinctionCoefficient != null;

  if (!hasAny) return null;

  return (
    <SectionContainerLayout title="Propiedades físico-químicas">
      <dl className="flex flex-col divide-y divide-slate-100 border-y border-slate-100">
        {v.length != null && (
          <SingleDataCellLayout label="Longitud" value={intFmt.format(v.length)} unit="aa" />
        )}
        {mwKda != null && (
          <SingleDataCellLayout
            label="Peso molecular"
            value={num2Fmt.format(mwKda)}
            unit="kDa"
            sub={`${intFmt.format(Math.round(v.mwDa))} Da`}
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
            label="Punto isoel."
            value={num2Fmt.format(pI)}
            unit="pI"
            sub={pINote}
            tone={pITone}
          />
        )}
        {v.positiveCharges != null && (
          <SingleDataCellLayout
            label="Cargas (+)"
            value={intFmt.format(v.positiveCharges)}
            sub="Lys+Arg"
            tone="text-blue-700"
          />
        )}
        {v.negativeCharges != null && (
          <SingleDataCellLayout
            label="Cargas (−)"
            value={intFmt.format(v.negativeCharges)}
            sub="Asp+Glu"
            tone="text-rose-700"
          />
        )}
        {net != null && (
          <SingleDataCellLayout
            label="Carga neta"
            value={`${net > 0 ? "+" : ""}${net}`}
            unit="e⁻"
            sub={
              v.length > 0 ? `${num3Fmt.format(net / v.length)} e⁻/aa` : null
            }
            tone={netTone}
          />
        )}
        {v.cysteines != null && (
          <SingleDataCellLayout
            label="Cisteínas"
            value={intFmt.format(v.cysteines)}
            sub={
              Math.floor(v.cysteines / 2) > 0
                ? `máx. ${Math.floor(v.cysteines / 2)} S–S`
                : null
            }
          />
        )}
        {v.halfLife && <SingleDataCellLayout label="Vida media" value={v.halfLife} />}
        {v.extinctionCoefficient != null && (
          <SingleDataCellLayout
            label="ε₂₈₀"
            value={intFmt.format(v.extinctionCoefficient)}
            unit="M⁻¹·cm⁻¹"
          />
        )}
      </dl>
    </SectionContainerLayout>
  );
}
