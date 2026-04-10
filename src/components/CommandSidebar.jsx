import { Activity, Plus } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarSeparator,
} from './ui/sidebar.tsx'
import { SidebarHybridInput } from './navigation/SidebarHybridInput'
import { useCommandEntries } from '../hooks/useCommandEntries'

const LABEL_CLASS = 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-400'

const SHORTCUTS = [
  { key: 'Enter', description: 'Añadir si es válido' },
  { key: 'Tab', description: 'Siguiente campo' },
]

export function CommandSidebar() {
  const { entries, focusedId, canAppend, updateEntry, appendEntry, focusEntry } =
    useCommandEntries()

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-slate-200 bg-[#fafbfc]">
      <SidebarBrand />

      <SidebarContent className="px-3 pt-5 pb-3">
        <EntriesSection
          entries={entries}
          focusedId={focusedId}
          canAppend={canAppend}
          onChangeEntry={updateEntry}
          onFocusEntry={focusEntry}
          onAppend={appendEntry}
        />

        <SidebarSeparator className="my-4" />

        <ShortcutsSection />
      </SidebarContent>

      <StatusFooter count={entries.length} />
    </Sidebar>
  )
}

function SidebarBrand() {
  return (
    <SidebarHeader className="border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200/60">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-slate-900 tracking-tight leading-none uppercase">
            Comandos
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">
            Lista de Entradas
          </span>
        </div>
      </div>
    </SidebarHeader>
  )
}

function EntriesSection({ entries, focusedId, canAppend, onChangeEntry, onFocusEntry, onAppend }) {
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
          {entries.map((entry, index) => (
            <EntryRow
              key={entry.id}
              index={index}
              entry={entry}
              isFocused={focusedId === entry.id}
              canAppend={canAppend}
              onChange={onChangeEntry}
              onFocus={() => onFocusEntry(entry.id)}
              onSubmit={onAppend}
            />
          ))}
        </div>

        <AppendEntryButton onClick={onAppend} disabled={!canAppend} />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function EntryRow({ index, entry, isFocused, canAppend, onChange, onFocus, onSubmit }) {
  const focusRingClass = isFocused
    ? 'shadow-[0_0_0_1px_rgba(59,130,246,0.4)]'
    : 'shadow-none'

  return (
    <div className="relative flex items-center gap-1.5">
      <span className="shrink-0 w-4 text-right text-[9px] font-black text-slate-200 tabular-nums select-none">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <SidebarHybridInput
          value={entry.value}
          onChange={(value) => onChange(entry.id, value)}
          onSubmit={canAppend ? onSubmit : undefined}
          onFocus={onFocus}
          className={`${focusRingClass} shadow-none bg-white`}
        />
      </div>
    </div>
  )
}

function AppendEntryButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-300 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-200 text-[11px] font-bold uppercase tracking-widest group disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-300 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
      title={disabled ? 'Introduce un PDB ID o secuencia válida antes de añadir' : 'Añadir entrada'}
    >
      <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
      Añadir
    </button>
  )
}

function ShortcutsSection() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className={`${LABEL_CLASS} mb-2 px-1`}>Atajos</SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="flex flex-col gap-1 px-1">
          {SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-[10px] text-slate-400 font-medium">{description}</span>
              <kbd className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 font-mono">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function StatusFooter({ count }) {
  return (
    <SidebarFooter className="border-t border-slate-100 p-3">
      <div className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] group">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
            Entradas
          </span>
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">
            {count} activas
          </span>
        </div>
      </div>
    </SidebarFooter>
  )
}
