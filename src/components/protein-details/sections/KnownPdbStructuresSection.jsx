import { SectionContainerLayout } from "../layout/SectionContainerLayout";
import { num2Fmt, pubmedUrl } from "../utils/dataFormatters";

export function KnownPdbStructuresSection({ v }) {
  if (v.knownStructures.length === 0) return null;

  const count = v.knownStructures.length;
  const countLabel = count === 1 ? "entrada" : "entradas";

  return (
    <SectionContainerLayout
      title="Estructuras experimentales"
      aside={`${count} ${countLabel}`}
    >
      <ul className="flex flex-col divide-y divide-slate-100">
        {v.knownStructures.map((s, i) => (
          <li
            key={s?.pdb_id ?? i}
            className="flex flex-col gap-0.5 overflow-hidden py-1"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex min-w-0 items-baseline gap-2">
                {s?.pdb_id ? (
                  <a
                    href={`https://www.rcsb.org/structure/${s.pdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    {s.pdb_id}
                  </a>
                ) : (
                  <span className="font-mono text-[11px] text-slate-400">
                    &mdash;
                  </span>
                )}
                {s?.method && (
                  <span className="text-[10px] text-slate-500">{s.method}</span>
                )}
              </div>
              {s?.resolution != null && (
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-600">
                  {num2Fmt.format(s.resolution)} Å
                </span>
              )}
            </div>
            {s?.publication && (
              <a
                href={pubmedUrl(s.publication)}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[10px] text-slate-500 hover:text-slate-800 hover:underline"
                title={s.publication}
              >
                {s.publication}
              </a>
            )}
          </li>
        ))}
      </ul>
    </SectionContainerLayout>
  );
}
