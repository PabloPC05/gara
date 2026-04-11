import { useEffect, useState } from "react";
import type { JobOutputsResponse } from "../api/types";
import { streamExplanation } from "../ai/geminiClient";
import { buildExplanationPrompt } from "../ai/prompts";

interface GeminiState {
  explanation: string;
  loading: boolean;
  error: string | null;
}

export function useGeminiExplanation(outputs: JobOutputsResponse | null): GeminiState {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!outputs) return;

    let cancelled = false;
    setExplanation("");
    setError(null);
    setLoading(true);

    const prompt = buildExplanationPrompt(outputs);

    streamExplanation(prompt, (chunk) => {
      if (!cancelled) setExplanation((prev) => prev + chunk);
    })
      .then(() => {
        if (!cancelled) setLoading(false);
      })
      .catch((err: unknown) => {
        console.error("[Gemini] Error:", err);
        if (!cancelled) {
          setError((err as Error)?.message ?? "Error al conectar con Gemini.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [outputs]);

  return { explanation, loading, error };
}
