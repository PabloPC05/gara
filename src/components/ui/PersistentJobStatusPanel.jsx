import React from "react";

import { JobStatusPanel } from "@/components/ui/JobStatusPanel";
import {
  DISMISSIBLE_JOB_STATUSES,
  useJobStatusStore,
} from "@/stores/useJobStatusStore";

export function PersistentJobStatusPanel({ panelKey }) {
  const panel = useJobStatusStore((s) => s.panelsByKey[panelKey] ?? null);
  const clearJobPanel = useJobStatusStore((s) => s.clearJobPanel);

  if (!panel?.status) return null;

  const isDismissible = DISMISSIBLE_JOB_STATUSES.has(panel.status);

  return (
    <div>
      <JobStatusPanel status={panel.status} />
      {isDismissible ? (
        <div className="mt-1 flex flex-col gap-1">
          {panel.error ? (
            <p className="px-1 text-xs text-rose-600">{panel.error}</p>
          ) : null}
          <button
            type="button"
            onClick={() => clearJobPanel(panelKey)}
            className="self-end text-xs text-slate-400 transition-colors hover:text-slate-600"
          >
            ✕ Descartar
          </button>
        </div>
      ) : null}
    </div>
  );
}
