import { useState } from 'react'
import { UBIQUITIN_SEQUENCE } from '../../data/mockData'

function validateFASTA(seq) {
  const trimmed = seq.trim()
  if (!trimmed) return 'Por favor, introduce una secuencia.'
  if (!trimmed.startsWith('>')) return 'La secuencia debe comenzar con ">" (formato FASTA estándar).'
  const lines = trimmed.split('\n')
  if (lines.length < 2) return 'El formato FASTA necesita una línea de cabecera (>) y al menos una línea de aminoácidos.'
  const aaSeq = lines.slice(1).join('').replace(/\s/g, '')
  if (aaSeq.length === 0) return 'No se encontraron aminoácidos tras la cabecera.'
  if (!/^[ACDEFGHIKLMNPQRSTVWXY*]+$/i.test(aaSeq)) {
    return 'La secuencia contiene caracteres no válidos. Usa las letras estándar de aminoácidos (A, C, D, E, F, G, H, I, K, L...).'
  }
  if (aaSeq.length > 1500) return `La secuencia es demasiado larga (${aaSeq.length} aa). El límite actual es 1,500 aa.`
  return null
}

function countAA(seq) {
  return seq.split('\n').filter(l => !l.startsWith('>')).join('').replace(/\s/g, '').length
}

export default function ProteinInput({ onSubmit }) {
  const [sequence, setSequence] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setSequence(e.target.value)
    if (error) setError('')
  }

  const handleLoadExample = () => {
    setSequence(UBIQUITIN_SEQUENCE)
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validateFASTA(sequence)
    if (err) { setError(err); return }
    onSubmit(sequence.trim())
  }

  const aaCount = sequence ? countAA(sequence) : 0

  return (
    <div className="flex flex-col items-center justify-center py-10">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="text-center mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-5 py-2 text-blue-600 text-xs font-bold uppercase tracking-widest mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Sistema de Alta Precisión · Online
        </div>
        <h1 className="text-6xl font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
          Descifra el lenguaje <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">de la vida.</span>
        </h1>
        <p className="text-slate-500 text-xl leading-relaxed max-w-2xl mx-auto font-medium">
          Predicción estructural de proteínas impulsada por <span className="text-slate-900 font-bold border-b-2 border-blue-500/30">AlphaFold2</span>. 
          Resultados precisos en cuestión de segundos.
        </p>
      </div>

      {/* ── Form Card ─────────────────────────────────────────────── */}
      <div className="w-full max-w-3xl relative">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl" />

        <form onSubmit={handleSubmit} className="card p-10 relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-70" />

          {/* Label + ejemplo */}
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="fasta-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              Secuencia FASTA
            </label>
            <button
              type="button"
              onClick={handleLoadExample}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-indigo-700 bg-blue-50 hover:bg-blue-100 rounded-full px-4 py-2 transition-all shadow-sm border border-blue-100/50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ejemplo: Ubiquitina
            </button>
          </div>

          {/* Textarea */}
          <div className="relative group">
            <textarea
              id="fasta-input"
              value={sequence}
              onChange={handleChange}
              spellCheck={false}
              placeholder={`>nombre_de_tu_proteina\nMQIFVKTLTGKTITLEVEPSDTIENVK...`}
              className={`w-full h-56 bg-white/40 border-2 rounded-2xl p-6 text-sm font-mono text-slate-800
                placeholder-slate-300 focus:outline-none focus:ring-4 resize-none transition-all leading-relaxed
                ${error
                  ? 'border-red-200 focus:ring-red-100'
                  : 'border-slate-100 group-hover:border-blue-100 focus:border-blue-200 focus:ring-blue-50'
                }`}
            />
            {aaCount > 0 && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                  aaCount > 1500 ? 'bg-red-50 text-red-600' : 'bg-slate-900 text-white'
                }`}>
                  {aaCount.toLocaleString()} Aminoácidos
                </span>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 flex items-start gap-3 text-sm bg-red-50 border border-red-100 rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="text-red-700 font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Info chips */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Longitud máx.', value: '1,500 aa', icon: '📏' },
              { label: 'Procesamiento', value: '~8 seg.', icon: '⚡' },
              { label: 'Algoritmo', value: 'AlphaFold v2', icon: '🧬' },
            ].map(item => (
              <div key={item.label} className="bg-slate-50/50 border border-slate-100/50 rounded-2xl px-4 py-4 text-center group hover:bg-white hover:shadow-md transition-all duration-300">
                <div className="text-xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
                <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.value}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-8 w-full relative bg-slate-900 hover:bg-blue-600
              text-white font-black uppercase tracking-widest py-5 px-8 rounded-2xl transition-all duration-300
              shadow-xl shadow-slate-200 hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0
              text-sm group"
          >
            <span className="flex items-center justify-center gap-3">
              Iniciar Predicción Estructural
              <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </button>

          <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-300">
            Computación distribuida · Protocolo seguro · Sin logs
          </p>
        </form>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          {['🔒 Encryption', '⚡ A100 GPU', '🧬 UniProt DB', '🏆 > 90% pLDDT'].map(badge => (
            <span key={badge} className="hover:text-slate-600 cursor-default transition-colors">{badge}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
