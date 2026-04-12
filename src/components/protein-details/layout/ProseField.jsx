export function ProseField({ label, children }) {
  return (
    <div className="overflow-hidden">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-[11px] leading-snug text-slate-700 break-words">
        {children}
      </dd>
    </div>
  )
}
