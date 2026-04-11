import { SidebarHybridInput } from '../navigation/SidebarHybridInput'

export function EntryRow({
  index,
  entry,
  isSelectable,
  isFocused,
  isActive,
  canAppend,
  onChange,
  onFocus,
  onActivate,
  onSubmit,
}) {
  const ringClass = isActive
    ? 'shadow-[0_0_0_2px_rgba(227,30,36,0.6)]'
    : isFocused
      ? 'shadow-[0_0_0_1px_rgba(227,30,36,0.4)]'
      : 'shadow-none'

  const indexClass = isActive
    ? 'text-[#e31e24]'
    : isSelectable
      ? 'text-slate-200'
      : 'text-slate-300'

  return (
    <div
      className={`relative flex items-center gap-1.5 rounded-2xl transition-colors ${
        isSelectable ? 'cursor-pointer' : 'cursor-default'
      } ${
        isActive
          ? 'bg-[#fde8e8]/60'
          : isSelectable
            ? 'bg-transparent hover:bg-slate-50'
            : 'bg-transparent'
      }`}
      onClick={(event) => {
        if (!isSelectable) return
        onActivate?.(event)
      }}
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? -1 : undefined}
    >
      <span
        className={`shrink-0 w-4 text-right text-[9px] font-black tabular-nums select-none transition-colors ${indexClass}`}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <SidebarHybridInput
          value={entry.value}
          onChange={(value) => onChange(entry.id, value)}
          onSubmit={canAppend ? onSubmit : undefined}
          onFocus={onFocus}
          className={`${ringClass} shadow-none bg-white`}
        />
      </div>
    </div>
  )
}
