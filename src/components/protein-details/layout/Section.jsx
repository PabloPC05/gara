export function Section({ title, aside, children }) {
  return (
    <section style={{ maxWidth: '100%', overflow: 'hidden', paddingTop: 16, paddingBottom: 16 }}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {title}
        </h3>
        {aside && (
          <span className="font-mono text-[9px] tabular-nums text-slate-400">
            {aside}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}
