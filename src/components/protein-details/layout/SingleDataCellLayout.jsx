export function SingleDataCellLayout({ label, value, unit, sub, tone }) {
  return (
    <div className="flex flex-col gap-0.5 overflow-hidden py-2.5">
      <dt className="text-[9px] font-medium uppercase leading-none tracking-wider text-slate-400">
        {label}
      </dt>
      <dd
        className={`truncate font-mono text-[11px] font-semibold tabular-nums leading-tight ${
          tone || "text-slate-800"
        }`}
      >
        {value}
        {unit && (
          <span className="ml-0.5 text-[9px] font-normal text-slate-400">
            {unit}
          </span>
        )}
        {sub && (
          <span className="ml-1 text-[9px] font-normal normal-case text-slate-400">
            {sub}
          </span>
        )}
      </dd>
    </div>
  );
}
