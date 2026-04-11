import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../ui/sidebar.tsx'
import { EntryRow } from './EntryRow'
import { AppendEntryButton } from './AppendEntryButton'
import { LABEL_CLASS, proteinIdForIndex } from './constants'

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
            const proteinId = proteinIdForIndex(index)
            const isActive = selectedProteinIds.includes(proteinId)
            return (
              <EntryRow
                key={entry.id}
                index={index}
                entry={entry}
                proteinId={proteinId}
                isFocused={focusedId === entry.id}
                isActive={isActive}
                canAppend={canAppend}
                onChange={onChangeEntry}
                onFocus={() => {
                  onFocusEntry(entry.id)
                  // focus also selects single
                  onSetSelectedProteinIds([proteinId])
                }}
                onActivate={(e) => {
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
