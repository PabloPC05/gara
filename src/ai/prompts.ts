import type { JobOutputsResponse } from "../api/types";

function classifyPlddt(mean: number): string {
  if (mean > 90) return "muy alta (> 90)";
  if (mean > 70) return "alta (70–90)";
  if (mean > 50) return "media (50–70)";
  return "baja (< 50)";
}

export function buildExplanationPrompt(outputs: JobOutputsResponse): string {
  const { protein_metadata: meta, structural_data, biological_data: bio } = outputs;
  const conf = structural_data.confidence;
  const ss = bio.secondary_structure_prediction;

  const identitySection =
    meta?.protein_name
      ? [
          `Proteína identificada: ${meta.protein_name}${meta.organism ? ` (${meta.organism})` : ""}.`,
          meta.description ? `Descripción: ${meta.description}.` : null,
          meta.data_source ? `Fuente de datos: ${meta.data_source}.` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "Proteína NO identificada en la base de datos. Los datos biológicos son sintéticos.";

  const unknownNote = !meta?.protein_name
    ? "\nIMPORTANTE: deja claro que los datos biológicos son sintéticos y que la predicción es menos fiable que para proteínas conocidas."
    : "";

  const toxLine =
    bio.toxicity_alerts.length > 0
      ? `Alertas de toxicidad: ${bio.toxicity_alerts.join("; ")}.`
      : "Sin alertas de toxicidad.";

  const allerLine =
    bio.allergenicity_alerts.length > 0
      ? `Alertas de alergenicidad: ${bio.allergenicity_alerts.join("; ")}.`
      : "Sin alertas de alergenicidad.";

  const ssLine = ss
    ? `\n- Estructura secundaria: α-hélice ${ss.helix_percent.toFixed(1)}%, β-lámina ${ss.strand_percent.toFixed(1)}%, coil ${ss.coil_percent.toFixed(1)}%.`
    : "";

  return `Eres un bioinformático experto explicando resultados de predicción de estructura proteica.

AUDIENCIA: Biólogo con conocimientos de biología molecular pero sin experiencia en bioinformática computacional.
TONO: Colega que explica de forma accesible y honesta, sin condescendencia.
IDIOMA: Español.
FORMATO: Exactamente dos párrafos separados por una línea en blanco. Sin títulos, sin viñetas, sin markdown.
- Párrafo 1: Calidad global de la predicción (pLDDT, PAE) y propiedades biológicas más relevantes (solubilidad, estabilidad, alertas si las hay).
- Párrafo 2: Para qué sirve este resultado y qué limitaciones tiene.${unknownNote}

DATOS DE LA PREDICCIÓN:

${identitySection}

Confianza estructural:
- pLDDT medio: ${conf.plddt_mean.toFixed(1)} — confianza ${classifyPlddt(conf.plddt_mean)}
- Distribución pLDDT: ${conf.plddt_histogram.very_high} residuos muy alta (>90), ${conf.plddt_histogram.high} alta (70–90), ${conf.plddt_histogram.medium} media (50–70), ${conf.plddt_histogram.low} baja (<50)
- PAE medio: ${conf.mean_pae.toFixed(2)} Å

Propiedades biológicas:
- Solubilidad: ${bio.solubility_score.toFixed(1)}%${bio.solubility_prediction ? ` (${bio.solubility_prediction})` : ""}.
- Índice de inestabilidad: ${bio.instability_index.toFixed(1)}${bio.stability_status ? ` — ${bio.stability_status}` : ""}.
- ${toxLine}
- ${allerLine}${ssLine}`;
}
