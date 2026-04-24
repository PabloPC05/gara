import { useEffect, useMemo } from "react";
import { PanelRight } from "lucide-react";
import { Sidebar, SidebarContent, SidebarProvider } from "../ui/sidebar.tsx";
import { useProteinStore } from "../../stores/useProteinStore";
import { useLayoutStore } from "../../stores/useLayoutStore";
import {
  SingleProteinOrchestrator,
  ComparisonGridOrchestrator,
} from "../protein-details";
import { useSidebarResize } from "../left-sidebar/hooks/useSidebarResize";

export function ProteinDetailsSidebar({ children }) {
  const selectedProteinIds = useProteinStore(
    (state) => state.selectedProteinIds,
  );
  const proteinsById = useProteinStore((state) => state.proteinsById);

  const detailsPanelOpen = useLayoutStore((s) => s.detailsPanelOpen);
  const setDetailsPanelOpen = useLayoutStore((s) => s.setDetailsPanelOpen);

  const proteins = useMemo(
    () =>
      selectedProteinIds
        .map((id) => proteinsById[id])
        .filter((p) => p && p.name),
    [selectedProteinIds, proteinsById],
  );

  const hasProteins = proteins.length > 0;
  const isComparison = proteins.length >= 2;

  // Auto-open the panel when a protein is selected
  useEffect(() => {
    if (hasProteins) setDetailsPanelOpen(true);
  }, [hasProteins, setDetailsPanelOpen]);

  // Close panel with Escape
  useEffect(() => {
    if (!detailsPanelOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDetailsPanelOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailsPanelOpen, setDetailsPanelOpen]);

  // Dynamic width based on comparison mode
  const defaultWidth = isComparison
    ? `min(${Math.min(proteins.length, 4) * 16}rem, calc(100vw - 4rem))`
    : "26rem";

  const { handleResizeStart } = useSidebarResize({
    side: "right",
    minWidth: 300,
    maxWidth: 900,
    cssVars: [
      "--sidebar-width",
      "--right-sidebar-width",
      "--details-sidebar-width",
    ],
  });

  return (
    <SidebarProvider
      open={detailsPanelOpen}
      onOpenChange={setDetailsPanelOpen}
      style={{
        "--sidebar-width": defaultWidth,
        "--right-sidebar-width": defaultWidth,
        "--sidebar-width-icon": "0px",
        // Variables consumed by FastaBar for margin coordination
        "--details-sidebar-width": defaultWidth,
        "--details-sidebar-collapsed-width": "2.5rem",
      }}
      className="flex min-h-0 w-full min-w-0 flex-1"
    >
      {/* Main content (passed via children) */}
      {children}

      {/* Right Sidebar */}
      <Sidebar
        side="right"
        collapsible="offcanvas"
        className="bg-[#0c0c0e]"
        style={{ borderColor: "#27272a" }}
      >
        {/* Handle de redimensión — arrastra el borde izquierdo de la sidebar */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute left-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors duration-150 hover:bg-slate-300 dark:hover:bg-slate-600"
        />
        <SidebarContent className="bg-transparent p-0">
          {hasProteins ? (
            <div className="flex h-full flex-col overflow-hidden">
              {isComparison ? (
                <ComparisonGridOrchestrator proteins={proteins} />
              ) : (
                <SingleProteinOrchestrator protein={proteins[0]} />
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-transparent p-8 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-sm border border-white/5 bg-white/[0.02] text-slate-700 shadow-inner">
                <PanelRight className="h-8 w-8 opacity-20" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Sin selección
              </h3>
              <p className="mt-2 max-w-[180px] text-[10px] font-medium leading-relaxed text-slate-600">
                Seleccione una o varias proteínas en el panel izquierdo para ver
                sus propiedades y análisis.
              </p>
            </div>
          )}
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
