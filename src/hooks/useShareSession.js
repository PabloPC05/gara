import { useCallback } from "react";
import { toast } from "sonner";
import { useProteinStore } from "../stores/useProteinStore";
import { useMolstarStore } from "../stores/useMolstarStore";
import { useViewerConfigStore } from "../stores/useViewerConfigStore";
import { serializeViewerState, buildShareUrl } from "../utils/deepLink";

export function useShareSession() {
  const proteinsById = useProteinStore((s) => s.proteinsById);
  const selectedProteinIds = useProteinStore((s) => s.selectedProteinIds);

  const handleShareSession = useCallback(() => {
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

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast.success("Enlace copiado al portapapeles", {
          description:
            "Cualquiera con este enlace vera la vista exacta que estas viendo.",
          duration: 4000,
        });
      })
      .catch(() => {
        navigator.clipboard.writeText(shareUrl);
        toast.info("Enlace generado", {
          description:
            "No se pudo copiar automaticamente. El enlace esta en la consola.",
          duration: 5000,
        });
        console.log("[Share URL]", shareUrl);
      });
  }, [proteinsById, selectedProteinIds]);

  return { handleShareSession };
}
