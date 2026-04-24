import React from "react";
import { Check, FlaskConical } from "lucide-react";
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar";
import { useViewerConfigStore } from "../../stores/useViewerConfigStore";
import { BIOCHEMICAL_LENSES } from "../../utils/biochemistry";

const REPR_OPTIONS = [
  { label: "Cartoon (Cintas)", value: "cartoon" },
  { label: "Superficie (SAS)", value: "gaussian-surface" },
  { label: "Esferas (VDW)", value: "spacefill" },
  { label: "Licorice (Palos y Bolas)", value: "ball-and-stick" },
  { label: "Malla (Mesh)", value: "molecular-surface" },
];

const DISCOVERY_LENSES = [
  { id: "electrostatic-charge", label: "Carga Electrostática" },
  {
    id: "hydrophobicity-kyte-doolittle",
    label: "Hidrofobicidad (Kyte-Doolittle)",
  },
];

export function StyleMenu() {
  const viewerRepresentation = useViewerConfigStore(
    (s) => s.viewerRepresentation,
  );
  const setViewerRepresentation = useViewerConfigStore(
    (s) => s.setViewerRepresentation,
  );
  const viewerColorScheme = useViewerConfigStore((s) => s.viewerColorScheme);
  const setViewerColorScheme = useViewerConfigStore(
    (s) => s.setViewerColorScheme,
  );

  const drugDiscoveryMode = useViewerConfigStore((s) => s.drugDiscoveryMode);
  const drugDiscoveryLens = useViewerConfigStore((s) => s.drugDiscoveryLens);
  const toggleDrugDiscovery = useViewerConfigStore(
    (s) => s.toggleDrugDiscovery,
  );
  const setDrugDiscoveryLens = useViewerConfigStore(
    (s) => s.setDrugDiscoveryLens,
  );

  const itemClass =
    "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer";
  const activeItemClass = `${itemClass} text-white`;

  return (
    <MenubarMenu>
      <MenubarTrigger>Estilo</MenubarTrigger>
      <MenubarContent className="w-72 rounded-xl border border-white/10 bg-[#111113] p-1.5 shadow-2xl backdrop-blur-md">
        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Drug Discovery
        </MenubarLabel>

        <MenubarItem
          className={drugDiscoveryMode ? activeItemClass : itemClass}
          onClick={toggleDrugDiscovery}
        >
          <FlaskConical className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">Superficie Gaussiana</span>
          {drugDiscoveryMode ? (
            <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400">
              ON
            </span>
          ) : (
            <span className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
              OFF
            </span>
          )}
        </MenubarItem>

        {drugDiscoveryMode && (
          <div className="mb-1 ml-5 mt-0.5 flex flex-col gap-0.5">
            {DISCOVERY_LENSES.map(({ id, label }) => (
              <MenubarItem
                key={id}
                className={
                  drugDiscoveryLens === id ? activeItemClass : itemClass
                }
                onClick={() => setDrugDiscoveryLens(id)}
              >
                <span className="flex-1">{label}</span>
                {drugDiscoveryLens === id && (
                  <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                )}
              </MenubarItem>
            ))}
          </div>
        )}

        <MenubarSeparator className="mx-1 my-1 bg-white/10" />

        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Representación
        </MenubarLabel>

        {REPR_OPTIONS.map(({ label, value }) => (
          <MenubarItem
            key={value}
            className={
              viewerRepresentation === value ? activeItemClass : itemClass
            }
            onClick={() => setViewerRepresentation(value)}
          >
            <span className="flex-1">{label}</span>
            {viewerRepresentation === value && (
              <Check className="h-3 w-3 shrink-0 text-blue-400" />
            )}
          </MenubarItem>
        ))}

        <MenubarSeparator className="mx-1 my-1 bg-white/10" />

        <MenubarLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Coloración
        </MenubarLabel>

        {BIOCHEMICAL_LENSES.map(({ id, label }) => (
          <MenubarItem
            key={id}
            className={viewerColorScheme === id ? activeItemClass : itemClass}
            onClick={() => setViewerColorScheme(id)}
          >
            <span className="flex-1">{label}</span>
            {viewerColorScheme === id && (
              <Check className="h-3 w-3 shrink-0 text-blue-400" />
            )}
          </MenubarItem>
        ))}
      </MenubarContent>
    </MenubarMenu>
  );
}
