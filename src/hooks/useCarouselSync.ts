import { useRef, useCallback, useEffect } from "react";

import type { CarouselApi } from "@/components/ui/carousel";

interface UseCarouselSyncParams {
  activeProteinId: string | null;
  selectedIndex: number | null;
  displaySequence: string;
  draftLength: number;
  canSelect: boolean;
  isComparison: boolean;
  validSelectedIds: string[];
  focusedResidueByProtein: Record<string, { seqId: number } | null>;
}

export function useCarouselSync({
  activeProteinId,
  selectedIndex,
  displaySequence,
  draftLength,
  canSelect,
  isComparison,
  validSelectedIds,
  focusedResidueByProtein,
}: UseCarouselSyncParams) {
  const apisRef = useRef<Record<string, CarouselApi>>({});

  const registerApi = useCallback((pid: string, api: CarouselApi) => {
    if (api) apisRef.current[pid] = api;
    else delete apisRef.current[pid];
  }, []);

  const scrollAllBy = useCallback((jump: number) => {
    Object.values(apisRef.current).forEach((api) => {
      if (!api) return;
      const target = Math.max(
        0,
        Math.min(
          api.scrollSnapList().length - 1,
          api.selectedScrollSnap() + jump,
        ),
      );
      api.scrollTo(target);
    });
  }, []);

  const getActiveApi = useCallback(() => {
    return (
      apisRef.current[activeProteinId ?? ""] ??
      Object.values(apisRef.current)[0]
    );
  }, [activeProteinId]);

  const scrollApiTo = useCallback((api: CarouselApi, index: number) => {
    if (!api) return;
    const snapCount = api.scrollSnapList().length;
    if (snapCount <= 1) return; // all items visible, no need to scroll
    api.scrollTo(Math.max(0, Math.min(index, snapCount - 1)));
  }, []);

  // Auto-scroll to focused residue or selectedIndex
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isComparison) {
        for (const pid of validSelectedIds) {
          const api = apisRef.current[pid];
          if (!api) continue;
          const fr = focusedResidueByProtein[pid];
          if (fr?.seqId) scrollApiTo(api, fr.seqId - 1);
        }
        return;
      }

      const api = getActiveApi();
      if (!api) return;

      if (selectedIndex !== null) {
        // Draft editing mode: scroll to the selected amino acid
        scrollApiTo(api, selectedIndex);
      } else if (draftLength > 0) {
        scrollApiTo(api, displaySequence.length - 1);
      } else {
        // View mode: scroll to the focused residue
        const fr = activeProteinId
          ? focusedResidueByProtein[activeProteinId]
          : null;
        if (fr?.seqId && canSelect) scrollApiTo(api, fr.seqId - 1);
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [
    focusedResidueByProtein,
    validSelectedIds,
    isComparison,
    activeProteinId,
    draftLength,
    displaySequence.length,
    canSelect,
    selectedIndex,
    getActiveApi,
    scrollApiTo,
  ]);

  // Wheel handler per carousel
  useEffect(() => {
    const apis = Object.values(apisRef.current);
    if (apis.length === 0) return;

    const cleanups: Array<() => void> = [];
    apis.forEach((api) => {
      if (!api) return;
      const container = api.containerNode();
      if (!container) return;
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const direction = Math.sign(e.deltaY || e.deltaX);
        if (direction === 0) return;
        const engine = api.internalEngine();
        engine.scrollBody.useBaseFriction().useDuration(0);
        engine.scrollTo.distance(direction * 40, false);
      };
      container.addEventListener("wheel", handleWheel, { passive: false });
      cleanups.push(() => container.removeEventListener("wheel", handleWheel));
    });
    return () => cleanups.forEach((fn) => fn());
  }, [validSelectedIds.join(","), isComparison]);

  return {
    registerApi,
    scrollAllBy,
    getActiveApi,
  } as const;
}
