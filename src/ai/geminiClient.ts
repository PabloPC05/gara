import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

if (API_KEY && import.meta.env.DEV) {
	console.warn(
		"[geminiClient] VITE_GEMINI_API_KEY is embedded in the client bundle. " +
			"Move Gemini calls to a backend proxy to avoid exposing this key in production.",
	);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function streamExplanation(
	prompt: string,
	onChunk: (chunk: string) => void,
): Promise<void> {
	if (!API_KEY) throw new Error("Gemini API key not configured");
	const result = await model.generateContentStream(prompt);
	for await (const chunk of result.stream) {
		const text = chunk.text();
		if (text) onChunk(text);
	}
}

export async function extractProteinQuery(
	userMessage: string,
): Promise<string | null> {
	if (!API_KEY) throw new Error("Gemini API key not configured");

	const prompt = `Tarea: determinar si el usuario quiere VER, CARGAR o VISUALIZAR una proteína en un portal de bioinformática y, en ese caso, extraer su nombre.

Contexto: el portal puede buscar proteínas por nombre, obtener su FASTA y cargarlas para visualizarlas en 3D. Cualquier petición de ver, mostrar, enseñar, cargar, enviar o visualizar una proteína específica es una orden de carga.

Reglas:
- Si el mensaje es una petición de ver/cargar/visualizar/enseñar/mostrar una proteína concreta: devuelve SOLO su nombre en inglés en forma estándar UniProt (ej: "ubiquitin", "calmodulin", "SOD1", "insulin", "hemoglobin", "myoglobin").
- Si el mensaje menciona un organismo concreto, inclúyelo (ej: "human ubiquitin", "mouse insulin").
- Si el mensaje es una pregunta teórica, una solicitud de explicación textual, o no menciona una proteína concreta: devuelve exactamente: null
- Responde ÚNICAMENTE con el nombre de la proteína o con null. Sin explicaciones, sin puntuación extra.

Ejemplos — carga/visualización (devolver nombre):
Mensaje: "enséñame ubiquitin"
Respuesta: ubiquitin

Mensaje: "quiero ver hemoglobina en 3D"
Respuesta: hemoglobin

Mensaje: "muéstrame la mioglobina"
Respuesta: myoglobin

Mensaje: "visualiza la insulina"
Respuesta: insulin

Mensaje: "carga la calmodulina"
Respuesta: calmodulin

Mensaje: "busca la SOD1 humana"
Respuesta: human SOD1

Mensaje: "manda la insulina al CESGA"
Respuesta: insulin

Mensaje: "Quiero que envíes la secuencia fasta de la ubiquitina a la API"
Respuesta: ubiquitin

Mensaje: "ponme la hemoglobina"
Respuesta: hemoglobin

Ejemplos — preguntas teóricas (devolver null):
Mensaje: "explícame qué es la hemoglobina"
Respuesta: null

Mensaje: "qué diferencia hay entre ubiquitina y SUMO"
Respuesta: null

Mensaje: "cómo funciona el proteasoma"
Respuesta: null

Mensaje: "cuántos aminoácidos tiene la insulina"
Respuesta: null

Mensaje: "${userMessage.replace(/"/g, "'")}"
Respuesta:`;

	const result = await model.generateContent(prompt);
	const text = result.response.text().trim();
	if (!text || text.toLowerCase() === "null") return null;
	return text;
}
