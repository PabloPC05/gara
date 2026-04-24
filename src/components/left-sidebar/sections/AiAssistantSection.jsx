import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useProteinStore } from "../../../stores/useProteinStore";
import { useProteinLoader } from "../hooks/useProteinLoader";
import { useAiChat, detectsProteinLoadIntent } from "../hooks/useAiChat";
import { useProteinSearch } from "../hooks/useProteinSearch";
import { validateFasta } from "../../../utils/fasta";
import { GeminiIcon } from "../../ui/GeminiIcon";

export function AiAssistantSection() {
	const activeProteinId = useProteinStore((s) => s.activeProteinId);
	const protein = useProteinStore((s) =>
		activeProteinId ? s.proteinsById[activeProteinId] : null,
	);
	const setSelectedProteinIds = useProteinStore((s) => s.setSelectedProteinIds);
	const { load } = useProteinLoader();

	const contextKey = activeProteinId ?? "__general__";
	const [notice, setNotice] = useState(null);

	const {
		messages,
		chatInput,
		setChatInput,
		streaming,
		chatEndRef,
		busy: chatBusy,
		streamAssistantReply,
		handleExplain,
		streamChatReply,
		pushMessage,
	} = useAiChat({ protein, contextKey });

	const { loadingProtein, handleFastaLoad, handleProteinSearch } =
		useProteinSearch({
			load,
			onProteinLoaded: (id) => setSelectedProteinIds([id]),
		});

	const busy = chatBusy || loadingProtein;
	const trimmedInput = chatInput.trim();
	const isFastaInput = trimmedInput.startsWith(">");

	const handleChatSend = async () => {
		const userMessage = trimmedInput;
		if (!userMessage || busy) return;

		if (userMessage.startsWith(">")) {
			await handleFastaLoad(userMessage, {
				validateFasta,
				setNotice,
				setChatInput,
			});
			return;
		}

		if (detectsProteinLoadIntent(userMessage)) {
			await handleProteinSearch(userMessage, {
				setNotice,
				setChatInput,
				pushMessage,
				streamChatReply,
			});
			return;
		}

		setNotice(null);
		setChatInput("");
		await streamChatReply(userMessage);
	};

	const handleChatKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleChatSend();
		}
	};

	const handleExplainClick = async () => {
		if (!protein || busy) return;
		setNotice(null);
		await handleExplain();
	};

	const contextLabel = protein?.name || "Asistente general";

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden text-sm text-slate-700">
			<div className="flex items-center justify-between gap-3 px-1">
				<h2 className="flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
					AI Assistant
				</h2>
				<span
					className="min-w-0 truncate rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500"
					title={contextLabel}
				>
					{contextLabel}
				</span>
			</div>

			<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm">
				{notice ? (
					<div
						className={`mx-3 mt-3 rounded-none border px-3 py-2 text-xs leading-relaxed ${
							notice.tone === "error"
								? "border-rose-200 bg-rose-50 text-rose-700"
								: notice.tone === "success"
									? "border-emerald-200 bg-emerald-50 text-emerald-700"
									: "border-sky-200 bg-sky-50 text-sky-700"
						}`}
					>
						{notice.message}
					</div>
				) : null}

				<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-3 py-3">
					{messages.length === 0 && (
						<div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-slate-400">
							<GeminiIcon size={28} className="opacity-20" />
							<p className="max-w-[18rem] text-xs leading-relaxed">
								{protein
									? `Haz una pregunta sobre ${protein.name} o usa "Explicar proteína" para generar un resumen.`
									: "Escribe una pregunta o pide que cargue una proteína por nombre."}
							</p>
						</div>
					)}
					{messages.map((msg, i) => (
						<div
							key={i}
							className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[88%] whitespace-pre-wrap break-words rounded-none px-3 py-2 text-xs leading-relaxed ${
									msg.role === "user"
										? "bg-slate-900 text-white"
										: "bg-slate-100 text-slate-700"
								}`}
							>
								{msg.content || (
									<span className="flex items-center gap-1 text-slate-400">
										<Loader2 size={10} className="animate-spin" />
										Generando...
									</span>
								)}
							</div>
						</div>
					))}
					<div ref={chatEndRef} />
				</div>

				<div className="border-t border-slate-100 bg-slate-50/80 px-3 py-2">
					<div className="rounded-none border border-slate-200 bg-white shadow-sm">
						<textarea
							value={chatInput}
							onChange={(e) => setChatInput(e.target.value)}
							onKeyDown={handleChatKeyDown}
							placeholder="Pregunta algo o pide una proteína por nombre..."
							disabled={busy}
							rows={3}
							className="min-h-[64px] w-full resize-none rounded-none border-0 bg-transparent px-3 py-2.5 text-xs leading-relaxed text-slate-700 focus:outline-none disabled:opacity-50"
						/>

						<div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-1.5">
							<div className="min-w-0 flex-1">
								{protein ? (
									<button
										onClick={handleExplainClick}
										disabled={busy}
										className="inline-flex items-center gap-1.5 rounded-none border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{busy ? (
											<Loader2 size={12} className="animate-spin" />
										) : (
											<GeminiIcon size={12} />
										)}
										Explicar proteína
									</button>
								) : null}
							</div>

							<button
								onClick={handleChatSend}
								disabled={!trimmedInput || busy}
								aria-label="Enviar mensaje"
								className="inline-flex h-8 w-8 items-center justify-center rounded-none bg-slate-900 text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{busy ? (
									<Loader2 size={13} className="animate-spin" />
								) : (
									<Send size={13} />
								)}
							</button>
						</div>

						{isFastaInput ? (
							<div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
								Se detectó FASTA. Al enviar se reutilizará el flujo real de
								carga de la app.
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}
