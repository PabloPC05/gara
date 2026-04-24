import { useState, useRef, useEffect } from "react";
import { streamExplanation } from "../../../ai/geminiClient";
import {
	buildExplanationPromptFromUnified,
	buildChatPrompt,
} from "../../../ai/prompts";

const PROTEIN_LOAD_KEYWORDS = new Set([
	"busca",
	"buscar",
	"búscame",
	"buscame",
	"trae",
	"traer",
	"tráeme",
	"traeme",
	"fetch",
	"find",
	"envía",
	"envia",
	"enviar",
	"manda",
	"mandar",
	"mándame",
	"mandame",
	"sube",
	"subir",
	"load",
	"submit",
	"send",
	"carga",
	"cargar",
	"cárgame",
	"cargame",
	"enseña",
	"enseñar",
	"enséñame",
	"ensename",
	"muestra",
	"mostrar",
	"muéstrame",
	"muestrame",
	"visualiza",
	"visualizar",
	"quiero ver",
	"show",
	"display",
	"visualize",
]);

export function detectsProteinLoadIntent(message) {
	const lower = message.toLowerCase();
	for (const kw of PROTEIN_LOAD_KEYWORDS) {
		if (lower.includes(kw)) return true;
	}
	return false;
}

function updateLastAiMessage(messages, updateFn, fallback = null) {
	const next = [...messages];
	for (let i = next.length - 1; i >= 0; i -= 1) {
		if (next[i]?.role === "ai") {
			next[i] = { ...next[i], ...updateFn(next[i]) };
			return next;
		}
	}
	return fallback ? [...next, fallback] : next;
}

export function useAiChat({ protein, contextKey }) {
	const [messages, setMessages] = useState([]);
	const [chatInput, setChatInput] = useState("");
	const [streaming, setStreaming] = useState(false);
	const chatEndRef = useRef(null);
	const streamTokenRef = useRef(0);

	useEffect(() => {
		streamTokenRef.current += 1;
		setMessages([]);
		setChatInput("");
		setStreaming(false);
	}, [contextKey]);

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const streamAssistantReply = async ({ prompt, userMessage = null }) => {
		const runToken = streamTokenRef.current;
		setStreaming(true);
		setMessages((prev) => {
			const next = [...prev];
			if (userMessage) next.push({ role: "user", content: userMessage });
			next.push({ role: "ai", content: "" });
			return next;
		});

		try {
			await streamExplanation(prompt, (chunk) => {
				if (streamTokenRef.current !== runToken) return;
				setMessages((prev) =>
					updateLastAiMessage(prev, (msg) => ({
						content: msg.content + chunk,
					})),
				);
			});
		} catch (err) {
			if (streamTokenRef.current !== runToken) return;
			const errorMessage = err?.message ?? "Error al conectar con Gemini.";
			setMessages((prev) =>
				updateLastAiMessage(
					prev,
					(msg) => ({ content: msg.content || errorMessage }),
					{ role: "ai", content: errorMessage },
				),
			);
		} finally {
			if (streamTokenRef.current === runToken) setStreaming(false);
		}
	};

	const handleExplain = async () => {
		if (!protein) return;
		await streamAssistantReply({
			prompt: buildExplanationPromptFromUnified(protein),
		});
	};

	const streamChatReply = async (userMessage) => {
		await streamAssistantReply({
			prompt: buildChatPrompt(protein, messages, userMessage),
			userMessage,
		});
	};

	const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);
	const updateLastAi = (updateFn, fallback) =>
		setMessages((prev) => updateLastAiMessage(prev, updateFn, fallback));

	return {
		messages,
		chatInput,
		setChatInput,
		streaming,
		chatEndRef,
		busy: streaming,
		streamAssistantReply,
		handleExplain,
		streamChatReply,
		pushMessage,
		updateLastAi,
	};
}
