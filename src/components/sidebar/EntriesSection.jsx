import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../ui/sidebar.tsx'
import { EntryRow } from './EntryRow'
import { AppendEntryButton } from './AppendEntryButton'
import { LABEL_CLASS } from './constants'

export function EntriesSection({
  entries,
  focusedId,
  canAppend,
  selectedProteinIds,
  onChangeEntry,
  onFocusEntry,
  onAppend,
  onToggleProteinSelection,
  onSetSelectedProteinIds,
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className={`${LABEL_CLASS} mb-3 px-1`}>
        Entradas Activas
        <span className="ml-auto text-[9px] font-bold text-slate-300 tabular-nums">
          {entries.length}
        </span>
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <div className="flex flex-col gap-2">
          {entries.map((entry, index) => {
            const proteinId = entry.proteinId ?? null
            const isSelectable = Boolean(proteinId)
            const isActive = proteinId ? selectedProteinIds.includes(proteinId) : false
            return (
              <EntryRow
                key={entry.id}
                index={index}
                entry={entry}
                isSelectable={isSelectable}
                isFocused={focusedId === entry.id}
                isActive={isActive}
                canAppend={canAppend}
                onChange={onChangeEntry}
                onFocus={() => {
                  onFocusEntry(entry.id)
                  if (proteinId) onSetSelectedProteinIds([proteinId])
                }}
                onActivate={(e) => {
                  if (!proteinId) return
                  if (e.shiftKey) {
                    onToggleProteinSelection(proteinId)
                  } else {
                    onSetSelectedProteinIds([proteinId])
                  }
                }}
                onSubmit={onAppend}
              />
            )
          })}
        </div>

        <AppendEntryButton onClick={onAppend} disabled={!canAppend} />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
