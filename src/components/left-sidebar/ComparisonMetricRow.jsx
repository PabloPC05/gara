export function ComparisonRow({ label, val1, val2, isBetter }) {
  const b1 = isBetter && isBetter(val1, val2)
  const b2 = isBetter && isBetter(val2, val1)

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-300 text-center">
        {label}
      </span>
      <div className="flex justify-between items-center gap-2">
        <span
          className={`w-1/2 text-center text-[11px] font-bold ${
            b1 ? 'text-emerald-500' : 'text-slate-600'
          }`}
        >
          {val1}
        </span>
        <div className="w-px h-3 bg-slate-100" />
        <span
          className={`w-1/2 text-center text-[11px] font-bold ${
            b2 ? 'text-emerald-500' : 'text-slate-600'
          }`}
        >
          {val2}
        </span>
      </div>
    </div>
  )
}
