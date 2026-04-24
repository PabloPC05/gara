import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "../../ui/sidebar.tsx";
import { ProteinEntryCard } from "../widgets/ProteinEntryCard";
import { AddProteinButton } from "../widgets/AddProteinButton";
import { LABEL_CLASS } from "../utils/constants";

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
          <AddProteinButton onClick={onAddEntry} disabled={false} />
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={`${LABEL_CLASS} mb-3 px-1`}>
        Entradas Activas
        <span className="ml-auto text-[9px] font-bold tabular-nums text-slate-300">
          {entries.length}
        </span>
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <div className="flex flex-col gap-2">
          {entries.map((protein, index) => {
            const isActive = selectedProteinIds.includes(protein.id);
            return (
              <ProteinEntryCard
                key={protein.id}
                index={index}
                protein={protein}
                isActive={isActive}
                onToggleSelection={onToggleProteinSelection}
              />
            );
          })}
        </div>

        <AddProteinButton onClick={onAddEntry} disabled={false} />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
