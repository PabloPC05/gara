import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, RefreshCw } from 'lucide-react';
import { useProteinStore } from '../../stores/useProteinStore';
import { streamExplanation } from '../../ai/geminiClient';
import { buildExplanationPromptFromUnified, buildChatPrompt } from '../../ai/prompts';

export function AiSection() {
  const activeProteinId = useProteinStore((s) => s.activeProteinId);
  const protein = useProteinStore((s) =>
    activeProteinId ? s.proteinsById[activeProteinId] : null
  );

  // ── Explanation state ────────────────────────────────────────────────
  const [explanation, setExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState(null);

  // ── Chat state ───────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [streamingChat, setStreamingChat] = useState(false);
  const chatEndRef = useRef(null);

  // Reset when protein changes
  useEffect(() => {
    setExplanation('');
    setExplanationError(null);
    setMessages([]);
    setChatInput('');
  }, [activeProteinId]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleExplain = async () => {
    if (!protein || loadingExplanation) return;
    setExplanation('');
    setExplanationError(null);
    setLoadingExplanation(true);
    try {
      const prompt = buildExplanationPromptFromUnified(protein);
      await streamExplanation(prompt, (chunk) => {
        setExplanation((prev) => prev + chunk);
      });
    } catch (err) {
      setExplanationError(err?.message ?? 'Error al conectar con Gemini.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleChatSend = async () => {
    if (!protein || !chatInput.trim() || streamingChat) return;
    const userMessage = chatInput.trim();
    setChatInput('');

    const updatedHistory = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedHistory);
    setStreamingChat(true);

    // Add placeholder AI message to stream into
    setMessages((prev) => [...prev, { role: 'ai', content: '' }]);

    try {
      const prompt = buildChatPrompt(protein, messages, userMessage);
      await streamExplanation(prompt, (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'ai') {
            next[next.length - 1] = { ...last, content: last.content + chunk };
          }
          return next;
        });
      });
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'ai') {
          next[next.length - 1] = {
            ...last,
            content: 'Error al conectar con Gemini.',
          };
        }
        return next;
      });
    } finally {
      setStreamingChat(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────
  if (!protein) {
    return (
      <div className="flex flex-col gap-4 text-sm text-slate-700 h-full">
        <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-wider px-1">
          AI Assistant
        </h2>
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 gap-3 px-4">
          <Bot size={32} className="opacity-20" />
          <p className="text-xs">Selecciona una proteína para activar el asistente IA.</p>
        </div>
      </div>
    );
  }

  const isExplaining = loadingExplanation;
  const isStreaming = loadingExplanation && explanation.length > 0;
  const paragraphs = explanation.split('\n\n').filter((p) => p.trim());

  return (
    <div className="flex flex-col gap-4 text-sm text-slate-700 h-full overflow-hidden">
      <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-wider px-1 flex-shrink-0">
        AI Assistant
      </h2>

      {/* ── Explanation block ── */}
      <div className="flex-shrink-0 border border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-medium text-slate-600 truncate" title={protein.name}>
            {protein.name}
          </span>
          <button
            onClick={handleExplain}
            disabled={isExplaining}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 ml-2"
          >
            {isExplaining && !explanation ? (
              <Loader2 size={12} className="animate-spin" />
            ) : explanation ? (
              <RefreshCw size={12} />
            ) : (
              <Bot size={12} />
            )}
            {explanation ? 'Regenerar' : 'Explicar proteína'}
          </button>
        </div>

        <div className="px-3 py-2 min-h-[56px]">
          {!explanation && !isExplaining && !explanationError && (
            <p className="text-xs text-slate-400 italic">
              Pulsa "Explicar proteína" para obtener un análisis con IA.
            </p>
          )}
          {!explanation && isExplaining && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={12} className="animate-spin" />
              Analizando con IA...
            </div>
          )}
          {explanationError && (
            <p className="text-xs text-rose-600">{explanationError}</p>
          )}
          {paragraphs.length > 0 && (
            <div className="flex flex-col gap-2">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-xs text-slate-700 leading-relaxed">
                  {p}
                  {isStreaming && i === paragraphs.length - 1 && (
                    <span className="inline-block w-1 h-3 ml-0.5 bg-slate-400 animate-pulse align-middle" />
                  )}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat block ── */}
      <div className="flex flex-col flex-1 min-h-0 border border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <span className="text-xs font-medium text-slate-600">Chat</span>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-auto px-3 py-2 flex flex-col gap-2">
          {messages.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center mt-4">
              Pregunta lo que quieras sobre {protein.name}.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-md px-2.5 py-1.5 text-xs leading-relaxed ${
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

        {/* Input */}
        <div className="flex-shrink-0 border-t border-slate-100 px-2 py-2 flex gap-1.5">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder="Escribe tu pregunta..."
            disabled={streamingChat}
            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white disabled:opacity-50"
          />
          <button
            onClick={handleChatSend}
            disabled={!chatInput.trim() || streamingChat}
            className="p-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
