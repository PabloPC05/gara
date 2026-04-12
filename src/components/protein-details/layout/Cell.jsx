export function Cell({ label, value, unit, sub, tone }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 overflow-hidden">
      <dt className="text-[9px] font-medium uppercase tracking-wider text-slate-400 leading-none">
        {label}
      </dt>
      <dd
        className={`font-mono text-[11px] font-semibold tabular-nums leading-tight truncate ${
          tone || 'text-slate-800'
        }`}
      >
        {value}
        {unit && (
          <span className="ml-0.5 text-[9px] font-normal text-slate-400">
            {unit}
          </span>
        )}
        {sub && (
          <span className="ml-1 text-[9px] font-normal text-slate-400 normal-case">
            {sub}
          </span>
        )}
      </dd>
    </div>
  )
}
