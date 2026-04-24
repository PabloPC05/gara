import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../ui/sidebar.tsx'
import { EntryRow } from './EntryRow'
import { AppendEntryButton } from './AppendEntryButton'
import { LABEL_CLASS } from './constants'

export function EntriesSection({
  entries,
  selectedProteinIds,
  onAddEntry,
  onToggleProteinSelection,
}) {
  if (entries.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <AppendEntryButton onClick={onAddEntry} disabled={false} />
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

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
          {entries.map((protein, index) => {
            const isActive = selectedProteinIds.includes(protein.id)
            return (
              <EntryRow
                key={protein.id}
                index={index}
                protein={protein}
                isActive={isActive}
                onToggleSelection={onToggleProteinSelection}
              />
            )
          })}
        </div>

        <AppendEntryButton onClick={onAddEntry} disabled={false} />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
