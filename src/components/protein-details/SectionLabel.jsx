export function SectionLabel({ icon: Icon, children }) {
  return (
    <h4 className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2.5} /> : null}
      {children}
    </h4>
  )
}
