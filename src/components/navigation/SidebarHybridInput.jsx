import React from 'react'

export function SidebarHybridInput({
  value,
  onChange,
  onSubmit,
  onFocus,
  className,
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit?.()
      }}
      placeholder="PDB ID o secuencia..."
      className={`w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-300 ${className || ''}`}
    />
  )
}
