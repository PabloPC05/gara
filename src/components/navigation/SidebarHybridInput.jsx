import React from 'react'

export function SidebarHybridInput({
  value,
  onChange,
  onSubmit,
  onFocus,
  className,
}) {
  // Cuando el usuario pega un FASTA completo (con cabecera ">..."), el
  // navegador eliminaría los saltos de línea antes de actualizar el input
  // (comportamiento estándar de <input type="text">), impidiendo que
  // extractSequence separe la cabecera de la secuencia.
  // Interceptamos el paste, extraemos solo los residuos y los insertamos
  // limpios, de forma que el campo siempre muestre la secuencia pura.
  const handlePaste = (e) => {
    const raw = e.clipboardData.getData('text')
    if (!raw.includes('>')) return  // No es FASTA → comportamiento nativo
    e.preventDefault()
    const seq = raw
      .split(/\r?\n/)
      .filter((line) => !line.trimStart().startsWith('>'))
      .join('')
      .replace(/\s/g, '')
    if (seq) onChange?.(seq)
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onPaste={handlePaste}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit?.()
      }}
      placeholder="PDB ID o secuencia..."
      className={`w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-300 ${className || ''}`}
    />
  )
}
