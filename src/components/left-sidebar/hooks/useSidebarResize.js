import { useCallback } from "react";

export function useSidebarResize({
  side = "left",
  minWidth = 200,
  maxWidth = 600,
  cssVars = [],
}) {
  const handleResizeStart = useCallback(
    (e) => {
      e.preventDefault();

      let wrapper, container, gap;

      if (side === "left") {
        wrapper = document.querySelector('[data-slot="sidebar-wrapper"]');
        container = document.querySelector('[data-slot="sidebar-container"]');
        gap = document.querySelector('[data-slot="sidebar-gap"]');
      } else {
        wrapper = e.target.closest('[data-slot="sidebar-wrapper"]');
        if (wrapper) {
          container = wrapper.querySelector(
            '[data-slot="sidebar-container"][data-side="right"]',
          );
        }
      }

      if (!wrapper || !container) return;

      const startX = e.clientX;
      const startWidth = container.getBoundingClientRect().width;

      if (gap) gap.style.transition = "none";
      container.style.transition = "none";
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.body.dataset.resizing = "true";

      const onMouseMove = (ev) => {
        let newWidth;
        if (side === "left") {
          newWidth = Math.min(
            Math.max(startWidth + ev.clientX - startX, minWidth),
            maxWidth,
          );
        } else {
          newWidth = Math.min(
            Math.max(startWidth - (ev.clientX - startX), minWidth),
            maxWidth,
          );
        }

        const px = `${newWidth}px`;
        cssVars.forEach((v) => wrapper.style.setProperty(v, px));
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (gap) gap.style.transition = "";
        container.style.transition = "";
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        delete document.body.dataset.resizing;
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [side, minWidth, maxWidth, cssVars],
  ); // cssVars comparison might be an issue if it changes every render, but since we define it inline it's fine for simple usage, or better yet stringify it. To avoid deep comparison, we stringify it.

  // Let's refactor the dependency array slightly to prevent infinite loops if cssVars is passed inline
  // (We'll use JSON.stringify(cssVars) in the effect/callback dependencies internally)
  // Actually, wait, it's just a callback so it doesn't fire an effect, but it regenerates.
  // It's safe.

  return { handleResizeStart };
}
