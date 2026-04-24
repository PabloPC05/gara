import { ChevronRight } from "lucide-react";

export function ExpandSidebarHint() {
  return (
    <div className="duration-[120ms] pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:opacity-100">
      <ChevronRight
        className="duration-[120ms] h-5 w-5 text-slate-400 transition-colors hover:text-[#e31e24]"
        strokeWidth={2.5}
      />
    </div>
  );
}
