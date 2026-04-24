import React, { useState } from "react";
import { Check } from "lucide-react";
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar";
import { useViewerConfigStore } from "../../stores/useViewerConfigStore";
import { useMolstarStore } from "../../stores/useMolstarStore";
import { useProteinStore } from "../../stores/useProteinStore";
import { exportViewerImage } from "../../lib/exportImage";
import { ExportImageDialog } from "../workspace/ExportImageDialog";

export function EnvironmentMenu() {
  const sceneBackground = useViewerConfigStore((s) => s.viewerBackground);
  const setSceneBackground = useViewerConfigStore((s) => s.setViewerBackground);
  const viewerLighting = useViewerConfigStore((s) => s.viewerLighting);
  const setViewerLighting = useViewerConfigStore((s) => s.setViewerLighting);
  const [exportImageOpen, setExportImageOpen] = useState(false);

  const itemClass =
    "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer flex justify-between items-center";

  return (
    <>
      <ExportImageDialog
        open={exportImageOpen}
        onOpenChange={setExportImageOpen}
        onExport={async ({ format, scale, transparent }) => {
          const pluginRef = useMolstarStore.getState().pluginRef;
          const plugin = pluginRef?.current;
          if (!plugin) return;
          const selectedProteinIds =
            useProteinStore.getState().selectedProteinIds;
          const proteinsById = useProteinStore.getState().proteinsById;
          const id = selectedProteinIds[0];
          const protein = id ? proteinsById[id] : null;
          await exportViewerImage(plugin, {
            format,
            scale,
            transparent,
            filename: protein?.name || null,
          });
        }}
      />

      <MenubarMenu>
        <MenubarTrigger>Entorno</MenubarTrigger>
        <MenubarContent className="w-[360px] rounded-xl border border-white/10 bg-[#111113] p-1.5 shadow-2xl backdrop-blur-md">
          <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Fondos
          </MenubarLabel>
          <MenubarItem
            className={itemClass}
            onClick={() => setSceneBackground("#ffffff")}
          >
            <span>Fondo Claro (Default)</span>
            {sceneBackground === "#ffffff" && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            )}
          </MenubarItem>
          <MenubarItem
            className={itemClass}
            onClick={() => setSceneBackground("#000000")}
          >
            <span>Fondo Oscuro</span>
            {sceneBackground === "#000000" && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            )}
          </MenubarItem>

          <MenubarSeparator className="mx-1 my-1 bg-white/10" />

          <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Iluminación
          </MenubarLabel>
          <MenubarItem
            className={itemClass}
            onClick={() => setViewerLighting("studio")}
          >
            <span>Iluminación de Estudio (Sombras suaves)</span>
            {viewerLighting === "studio" && (
              <Check className="h-3 w-3 shrink-0 text-blue-400" />
            )}
          </MenubarItem>
          <MenubarItem
            className={itemClass}
            onClick={() => setViewerLighting("flat")}
          >
            <span>Iluminación Plana (Sin sombras, mejor rendimiento)</span>
            {viewerLighting === "flat" && (
              <Check className="h-3 w-3 shrink-0 text-blue-400" />
            )}
          </MenubarItem>
          <MenubarItem
            className={itemClass}
            onClick={() => setViewerLighting("ao")}
          >
            <span>Ambient Occlusion (SSAO)</span>
            {viewerLighting === "ao" && (
              <Check className="h-3 w-3 shrink-0 text-blue-400" />
            )}
          </MenubarItem>

          <MenubarSeparator className="mx-1 my-1 bg-white/10" />

          <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Exportar
          </MenubarLabel>
          <MenubarItem
            className={itemClass}
            onClick={() => setExportImageOpen(true)}
          >
            <span>Imagen de Publicación (Render 4K)</span>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </>
  );
}
