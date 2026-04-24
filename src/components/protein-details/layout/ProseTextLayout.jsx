export function ProseTextLayout({ label, children }) {
  return (
    <div className="overflow-hidden">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-[11px] leading-snug text-slate-700">
        {children}
      </dd>
    </div>
  );
}
