import type { JobOutputsResponse } from "../api/types";

interface UnifiedProteinBio {
  solubility: number;
  solubilityLabel: string;
  instabilityIndex: number;
  instabilityLabel: string;
  toxicityAlert: boolean;
  toxicityLabel: string;
  molecularWeight: number;
}

interface UnifiedProtein {
  id: string;
  name: string;
  uniprotId: string | null;
  pdbId: string | null;
  length: number;
  organism: string;
  plddtMean: number | null;
  biological: UnifiedProteinBio | null;
  source: "mock" | "api";
}

function classifyPlddt(mean: number): string {
  if (mean > 90) return "muy alta (> 90)";
  if (mean > 70) return "alta (70–90)";
  if (mean > 50) return "media (50–70)";
  return "baja (< 50)";
}

function buildExplanationPrompt(outputs: JobOutputsResponse): string {
  const {
    protein_metadata: meta,
    structural_data,
    biological_data: bio,
  } = outputs;
  const conf = structural_data.confidence;
  const ss = bio.secondary_structure_prediction;

  const identitySection = meta?.protein_name
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

  return `Eres un experto en biología molecular y bioinformática estructural redactando un informe técnico conciso.

AUDIENCIA: Biólogo con formación en biología molecular sin experiencia en bioinformática computacional.
TONO: Formal, riguroso y preciso. Científico pero comprensible. Sin lenguaje coloquial ni apelativos informales.
IDIOMA: Español.
FORMATO: Exactamente dos párrafos separados por una línea en blanco. Sin títulos, sin viñetas, sin markdown.
- Párrafo 1: Identidad y función biológica — qué es la proteína, cuál es su papel fisiológico y por qué es relevante. Si está identificada, incluir contexto biológico real. Mencionar la calidad de la predicción estructural (pLDDT) de forma concisa.
- Párrafo 2: Propiedades biológicas clave (solubilidad, estabilidad, toxicidad si aplica) y limitaciones concretas del modelo de predicción. Qué puede y qué no puede inferirse de estos datos.${unknownNote}

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

// ─── Builders para UnifiedProtein (datos ya normalizados en el store) ──────────

export function buildExplanationPromptFromUnified(
  protein: UnifiedProtein,
): string {
  const identitySection =
    protein.name && protein.name !== "Unknown"
      ? [
          `Proteína: ${protein.name}${protein.organism && protein.organism !== "Unknown" ? ` (${protein.organism})` : ""}.`,
          protein.uniprotId ? `UniProt ID: ${protein.uniprotId}.` : null,
          protein.pdbId ? `PDB ID: ${protein.pdbId}.` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "Proteína NO identificada en la base de datos. Los datos biológicos pueden ser sintéticos.";

  const unknownNote =
    protein.name === "Unknown"
      ? "\nIMPORTANTE: deja claro que los datos biológicos son sintéticos y que la predicción es menos fiable."
      : "";

  const plddtLine =
    protein.plddtMean != null
      ? `- pLDDT medio: ${protein.plddtMean.toFixed(1)} — confianza ${classifyPlddt(protein.plddtMean)}`
      : "- Confianza estructural: no disponible";

  const bioLines = protein.biological
    ? [
        `- Solubilidad: ${protein.biological.solubility.toFixed(1)}% (${protein.biological.solubilityLabel}).`,
        `- Estabilidad: índice de inestabilidad ${protein.biological.instabilityIndex.toFixed(1)} — ${protein.biological.instabilityLabel}.`,
        `- Toxicidad: ${protein.biological.toxicityLabel}.`,
        `- Peso molecular: ${(protein.biological.molecularWeight / 1000).toFixed(1)} kDa.`,
      ].join("\n")
    : "- Propiedades biológicas: no disponibles.";

  return `Eres un experto en biología molecular y bioinformática estructural redactando un informe técnico conciso.

AUDIENCIA: Biólogo con formación en biología molecular sin experiencia en bioinformática computacional.
TONO: Formal, riguroso y preciso. Científico pero comprensible. Sin lenguaje coloquial ni apelativos informales.
IDIOMA: Español.
FORMATO: Exactamente dos párrafos separados por una línea en blanco. Sin títulos, sin viñetas, sin markdown.
- Párrafo 1: Identidad y función biológica — qué es la proteína, cuál es su papel fisiológico y por qué es relevante. Si está identificada, incluir contexto biológico real. Mencionar la calidad de la predicción estructural (pLDDT) de forma concisa.
- Párrafo 2: Propiedades biológicas clave (solubilidad, estabilidad, toxicidad si aplica) y limitaciones concretas del modelo de predicción. Qué puede y qué no puede inferirse de estos datos.${unknownNote}

DATOS:

${identitySection}

Confianza estructural:
${plddtLine}

Propiedades biológicas:
${bioLines}`;
}

export function buildChatPrompt(
  protein: UnifiedProtein | null,
  history: { role: "user" | "ai"; content: string }[],
  userMessage: string,
): string {
  const baseContext = `Eres un experto en biología molecular y bioinformática integrado en un portal de predicción de estructuras proteicas.
Responde en español, de forma formal, rigurosa y clara. Sin lenguaje coloquial.
Puedes mantener conversación general aunque no haya ninguna proteína seleccionada.

CAPACIDADES REALES DE LA APP:
- Cuando el usuario pide cargar, enviar, visualizar o buscar una proteína por nombre, el sistema la busca automáticamente en el catálogo interno o en UniProt, obtiene la FASTA y la carga en el portal sin que el usuario pegue nada.
- El usuario también puede pegar una secuencia FASTA directamente (empieza por ">") y el sistema la carga igualmente.
- NUNCA indiques que no puedes interactuar con APIs ni cargar proteínas: la app lo hace automáticamente cuando el usuario lo solicita.

No inventes resultados experimentales, anotaciones de base de datos ni predicciones estructurales que no se te hayan proporcionado.`;

  const proteinContext = protein
    ? (() => {
        const proteinDesc =
          protein.name && protein.name !== "Unknown"
            ? `${protein.name}${protein.organism && protein.organism !== "Unknown" ? ` (${protein.organism})` : ""}`
            : "proteína desconocida";

        const bioSummary = protein.biological
          ? `Solubilidad: ${protein.biological.solubilityLabel}. Estabilidad: ${protein.biological.instabilityLabel}. Toxicidad: ${protein.biological.toxicityLabel}. Peso molecular: ${(protein.biological.molecularWeight / 1000).toFixed(1)} kDa.`
          : "Propiedades biológicas no disponibles.";

        const plddtSummary =
          protein.plddtMean != null
            ? `Confianza estructural (pLDDT medio): ${protein.plddtMean.toFixed(1)}.`
            : "Confianza estructural no disponible.";

        return `Hay una proteína seleccionada en la app. Usa este contexto cuando sea relevante, pero no fuerces la conversación a girar alrededor de ella si el usuario pregunta otra cosa.
Si el usuario menciona "la proteína seleccionada", "esta proteína" o algo equivalente, se refiere a la siguiente:

Proteína actual: ${proteinDesc}
${plddtSummary}
${bioSummary}`;
      })()
    : "No hay ninguna proteína seleccionada ahora mismo. Responde como asistente general.";

  const historyText = history
    .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
    .join("\n");

  return `${baseContext}

${proteinContext}

${historyText ? `Conversación:\n${historyText}\n` : ""}Usuario: ${userMessage}
Asistente:`;
}
