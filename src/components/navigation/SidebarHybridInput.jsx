import { Command } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Input unificado para introducir un PDB ID o una secuencia de aminoácidos.
 * Presenta un icono de Command a la izquierda y delega las acciones al padre.
 */
export function SidebarHybridInput({ value, onChange, onSubmit, onFocus, className }) {
  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <div
      className={cn(
        'relative flex w-full items-center rounded-2xl border border-slate-200 bg-white',
        className
      )}
    >
      <Command className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        placeholder="PDB ID o secuencia..."
        className="w-full bg-transparent pl-10 pr-3 py-2.5 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
      />
    </div>
  )
}
