import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useProteinStore } from '../../stores/useProteinStore';
import { useProteinLoader } from '../../hooks/useProteinLoader';
import { streamExplanation, extractProteinQuery } from '../../ai/geminiClient';
import { buildExplanationPromptFromUnified, buildChatPrompt } from '../../ai/prompts';
import { validateFasta } from '../../utils/fasta';
import { searchUniprotFasta } from '../../lib/uniprotClient';
import { searchCatalogProteins, getCatalogProteinDetail } from '../../lib/apiClient';
import { GeminiIcon } from '../ui/GeminiIcon';

// Keywords and phrases that signal the user wants to load/visualize a protein.
const PROTEIN_LOAD_KEYWORDS = [
  // Fetch / search
  'busca', 'buscar', 'búscame', 'buscame',
  'trae', 'traer', 'tráeme', 'traeme',
  'fetch', 'find',
  // Send / submit to API
  'envía', 'envia', 'enviar',
  'manda', 'mandar', 'mándame', 'mandame',
  'sube', 'subir',
  'load', 'submit', 'send',
  // Load into portal
  'carga', 'cargar', 'cárgame', 'cargame',
  // Show / visualize
  'enseña', 'enseñar', 'enséñame', 'ensename',
  'muestra', 'mostrar', 'muéstrame', 'muestrame',
  'visualiza', 'visualizar',
  'quiero ver',
  'show', 'display', 'visualize',
];

function detectsProteinLoadIntent(message) {
  const lower = message.toLowerCase();
  return PROTEIN_LOAD_KEYWORDS.some((kw) => lower.includes(kw));
}

export function AiSection() {
  const activeProteinId = useProteinStore((s) => s.activeProteinId);
  const protein = useProteinStore((s) =>
    activeProteinId ? s.proteinsById[activeProteinId] : null
  );
  const setSelectedProteinIds = useProteinStore((s) => s.setSelectedProteinIds);
  const { load } = useProteinLoader();

  // ── Chat state ───────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loadingProtein, setLoadingProtein] = useState(false);
  const [notice, setNotice] = useState(null);
  const chatEndRef = useRef(null);
  const streamTokenRef = useRef(0);
  const contextKey = activeProteinId ?? '__general__';
  const busy = streaming || loadingProtein;
  const trimmedInput = chatInput.trim();
  const isFastaInput = trimmedInput.startsWith('>');

  // Reset chat when the selected protein context changes.
  useEffect(() => {
    streamTokenRef.current += 1;
    setMessages([]);
    setChatInput('');
    setStreaming(false);
  }, [contextKey]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamAssistantReply = async ({ prompt, userMessage = null }) => {
    if (busy) return;
    const runToken = streamTokenRef.current;
    setStreaming(true);
    setMessages((prev) => {
      const next = [...prev];
      if (userMessage) next.push({ role: 'user', content: userMessage });
      next.push({ role: 'ai', content: '' });
      return next;
    });

    try {
      await streamExplanation(prompt, (chunk) => {
        if (streamTokenRef.current !== runToken) return;
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i -= 1) {
            if (next[i]?.role === 'ai') {
              next[i] = { ...next[i], content: next[i].content + chunk };
              break;
            }
          }
          return next;
        });
      });
    } catch (err) {
      if (streamTokenRef.current !== runToken) return;
      const errorMessage = err?.message ?? 'Error al conectar con Gemini.';
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i]?.role === 'ai') {
            next[i] = { ...next[i], content: next[i].content || errorMessage };
            return next;
          }
        }
        return [...next, { role: 'ai', content: errorMessage }];
      });
    } finally {
      if (streamTokenRef.current === runToken) setStreaming(false);
    }
  };

  const handleExplain = async () => {
    if (!protein || busy) return;
    setNotice(null);
    await streamAssistantReply({
      prompt: buildExplanationPromptFromUnified(protein),
    });
  };

  const handleFastaLoad = async (fastaInput) => {
    const validation = validateFasta(fastaInput);
    if (!validation.valid) {
      setNotice({
        tone: 'error',
        message: validation.reason ?? 'Secuencia FASTA no válida.',
      });
      return;
    }

    setChatInput('');
    setNotice({
      tone: 'info',
      message: 'Enviando FASTA a la API y cargando la proteína en el portal...',
    });
    setLoadingProtein(true);

    try {
      const proteinId = await load(fastaInput);
      if (!proteinId) {
        throw new Error('La carga no devolvió una proteína válida.');
      }

      setSelectedProteinIds([proteinId]);
      setNotice({
        tone: 'success',
        message: 'Proteína cargada correctamente. Ya debería aparecer en el portal.',
      });
    } catch (err) {
      setNotice({
        tone: 'error',
        message: err?.message ?? 'Error al procesar la secuencia FASTA.',
      });
    } finally {
      setLoadingProtein(false);
    }
  };

  const handleProteinSearch = async (userMessage) => {
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoadingProtein(true);

    try {
      // Step 1: Extract protein name from the natural-language message
      setNotice({ tone: 'info', message: 'Identificando proteína...' });
      const proteinQuery = await extractProteinQuery(userMessage);

      if (!proteinQuery) {
        // Gemini found no protein name — treat as normal chat
        setLoadingProtein(false);
        setNotice(null);
        await streamAssistantReply({
          prompt: buildChatPrompt(protein, messages, userMessage),
        });
        return;
      }

      // Step 2: Try the app catalog first (same reliable flow as SearchSection)
      let fasta = null;
      setNotice({ tone: 'info', message: `Buscando "${proteinQuery}" en el catálogo...` });
      try {
        const results = await searchCatalogProteins({ search: proteinQuery });
        if (results.length > 0) {
          const detail = await getCatalogProteinDetail(results[0].proteinId);
          if (detail?.fastaReady) {
            fasta = detail.fastaReady;
          }
        }
      } catch {
        // Catalog unavailable or empty — fall through to UniProt
      }

      // Step 3: Fall back to UniProt (canonical reviewed entries first)
      if (!fasta) {
        setNotice({ tone: 'info', message: `Buscando "${proteinQuery}" en UniProt...` });
        fasta = await searchUniprotFasta(proteinQuery);
      }

      // Step 4: Submit to the real API pipeline
      setNotice({ tone: 'info', message: 'Secuencia encontrada. Enviando a la API...' });
      const proteinId = await load(fasta);
      if (!proteinId) throw new Error('La API no devolvió una proteína válida.');

      setSelectedProteinIds([proteinId]);
      setNotice({ tone: 'success', message: 'Proteína cargada correctamente. Ya aparece en el portal.' });
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `He encontrado la secuencia FASTA de "${proteinQuery}" y la he cargado en el portal. ¡Ya puedes verla!`,
        },
      ]);
    } catch (err) {
      const msg = err?.message ?? 'No pude encontrar o cargar la proteína.';
      setNotice({ tone: 'error', message: msg });
      setMessages((prev) => [...prev, { role: 'ai', content: msg }]);
    } finally {
      setLoadingProtein(false);
    }
  };

  const handleChatSend = async () => {
    const userMessage = trimmedInput;
    if (!userMessage || busy) return;

    // Direct FASTA paste — existing flow
    if (userMessage.startsWith('>')) {
      await handleFastaLoad(userMessage);
      return;
    }

    // Natural-language protein load request — search catalog then UniProt
    if (detectsProteinLoadIntent(userMessage)) {
      await handleProteinSearch(userMessage);
      return;
    }

    // Normal chat
    setNotice(null);
    setChatInput('');
    await streamAssistantReply({
      prompt: buildChatPrompt(protein, messages, userMessage),
      userMessage,
    });
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const contextLabel = protein?.name || 'Asistente general';

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-1.5 overflow-hidden text-sm text-slate-700">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="flex-shrink-0 font-semibold text-xs uppercase tracking-wider text-slate-500">
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
              notice.tone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : notice.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-sky-200 bg-sky-50 text-sky-700'
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
                  : 'Escribe una pregunta o pide que cargue una proteína por nombre.'}
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-none px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700'
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
                    onClick={handleExplain}
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
                Se detectó FASTA. Al enviar se reutilizará el flujo real de carga de la app.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
