export const TONE_CLASSES = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
}

export function Badge({ tone = 'slate', label, value }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-none border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${TONE_CLASSES[tone]}`}
    >
      <span className="opacity-60">{label}</span>
      <span>{value}</span>
    </span>
  )
}
