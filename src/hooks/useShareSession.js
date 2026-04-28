import { useCallback } from "react";
import { toast } from "sonner";
import { useProteinStore } from "../stores/useProteinStore";
import { useMolstarStore } from "../stores/useMolstarStore";
import { useViewerConfigStore } from "../stores/useViewerConfigStore";
import { serializeViewerState, buildShareUrl } from "../utils/deepLink";

export function useShareSession() {
  const proteinsById = useProteinStore((s) => s.proteinsById);
  const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds);

  const handleShareSession = useCallback(async () => {
    const currentProteins = Object.values(proteinsById);
    if (currentProteins.length === 0) {
      toast.warning("No hay proteinas activas para compartir.");
      return;
    }
    const pluginRef = useMolstarStore.getState().pluginRef;
    const plugin = pluginRef?.current;
    const {
      focusedResidueByProtein,
      viewerRepresentation,
      viewerLighting,
      viewerBackground,
    } = useViewerConfigStore.getState();
    const activeProteinId = useProteinStore.getState().activeProteinId;
    const focusedResidue = activeProteinId
      ? focusedResidueByProtein[activeProteinId]
      : null;

    const encoded = serializeViewerState({
      proteinsById,
      selectedProteinIds,
      plugin,
      focusedResidue,
      viewerSettings: {
        representation: viewerRepresentation,
        lighting: viewerLighting,
        background: viewerBackground,
      },
    });

    const shareUrl = buildShareUrl(encoded);

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles", {
        description:
          "Cualquiera con este enlace vera la vista exacta que estas viendo.",
        duration: 4000,
      });
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.focus();
      input.select();

      toast.info("Enlace generado (copia manual requerida)", {
        description:
          "No se pudo copiar automaticamente. Seleccionamos el enlace para que uses Ctrl/Cmd + C.",
        duration: 6000,
      });

      window.alert(
        "No se pudo copiar automaticamente. Usa Ctrl/Cmd + C para copiar el enlace seleccionado.",
      );
      console.log("[Share URL]", shareUrl);

      window.setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 10000);
    }
  }, [proteinsById, selectedProteinIds]);

  return { handleShareSession };
}
