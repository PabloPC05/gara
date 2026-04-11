import type { JobOutputsResponse } from "../api/types";
import { useGeminiExplanation } from "../hooks/useGeminiExplanation";

export default function ExplanationPanel({ outputs }: { outputs: JobOutputsResponse }) {
  const { explanation, loading, error } = useGeminiExplanation(outputs);
  const paragraphs = explanation.split("\n\n").filter((p) => p.trim());
  const isStreaming = loading && explanation.length > 0;
  const isInitialLoad = !error && explanation.length === 0;

  // ── Error state ──
  if (error) {
    return (
      <div className="glass-card animate-fade-in-up" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Interpretación IA
          </h3>
        </div>
        <p style={{
          fontSize: 13,
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(100, 116, 139, 0.08)",
          border: "1px solid rgba(100, 116, 139, 0.15)",
        }}>
          La interpretación automática no está disponible en este momento. Los resultados del dashboard son completamente válidos.
        </p>
      </div>
    );
  }

  // ── Initial loading state ──
  if (isInitialLoad) {
    return (
      <div className="glass-card animate-fade-in-up" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "2px solid var(--color-border-secondary)",
            borderTopColor: "var(--color-accent-cyan)",
            animation: "spin-slow 0.8s linear infinite",
            flexShrink: 0,
          }} />
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Analizando resultados con IA...
          </p>
        </div>
      </div>
    );
  }

  // ── Streaming / completed state ──
  return (
    <div className="glass-card animate-fade-in-up" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>🤖</span>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>
          Interpretación IA
        </h3>
        {isStreaming && (
          <span style={{
            fontSize: 11,
            color: "var(--color-text-accent)",
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            opacity: 0.8,
          }}>
            generando...
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {paragraphs.map((paragraph, i) => (
          <p key={i} style={{
            fontSize: 13,
            color: "var(--color-text-secondary)",
            lineHeight: 1.75,
            margin: 0,
          }}>
            {paragraph}
            {isStreaming && i === paragraphs.length - 1 && (
              <span className="cursor-blink" />
            )}
          </p>
        ))}
      </div>
    </div>
  );
}
