import { useState, useEffect, useRef, useMemo } from 'react'
import { mockPredictionResult, mockLogs } from '../data/mockData'

// Estados posibles del job
const STAGES = [
  { id: 'PENDING',   label: 'En cola',     short: 'Pendiente' },
  { id: 'RUNNING',   label: 'Ejecutando',  short: 'En proceso' },
  { id: 'COMPLETED', label: 'Completado',  short: 'Completado' },
]

const STATUS_CONFIG = {
  PENDING: {
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
    dot: 'bg-amber-500',
    label: 'EN COLA',
    desc: 'Esperando recursos disponibles en el clúster...',
    pulse: true,
  },
  RUNNING: {
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
    dot: 'bg-blue-500',
    label: 'EJECUTÁNDOSE',
    desc: 'Computando en GPU NVIDIA A100 · BioHack-A1-GPU...',
    pulse: true,
  },
  COMPLETED: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
    dot: 'bg-emerald-500',
    label: 'COMPLETADO',
    desc: 'Predicción finalizada con éxito. Cargando resultados...',
    pulse: false,
  },
}

export default function JobStatus({ sequence, onComplete }) {
  const [status, setStatus] = useState('PENDING')
  const [progress, setProgress] = useState(0)
  const [visibleLogs, setVisibleLogs] = useState([])
  const logsEndRef = useRef(null)

  // ID de trabajo generado una sola vez
  const jobId = useMemo(() =>
    'BH-' + Math.random().toString(36).slice(2, 10).toUpperCase(), []
  )

  const headerLine = sequence.split('\n')[0]

  // PENDING → RUNNING a los 3 segundos
  useEffect(() => {
    const t = setTimeout(() => setStatus('RUNNING'), 3000)
    return () => clearTimeout(t)
  }, [])

  // Lógica del estado RUNNING
  useEffect(() => {
    if (status !== 'RUNNING') return

    // Barra de progreso (asintótica hasta 95%)
    const progressInterval = setInterval(() => {
      setProgress(prev => prev < 94 ? prev + (94 - prev) * 0.06 : prev)
    }, 250)

    // Logs aparecen uno a uno cada ~380 ms
    let logIdx = 0
    const logInterval = setInterval(() => {
      if (logIdx < mockLogs.length) {
        setVisibleLogs(prev => [...prev, mockLogs[logIdx]])
        logIdx++
      }
    }, 380)

    // RUNNING → COMPLETED a los 5 segundos
    const doneTimer = setTimeout(() => {
      clearInterval(progressInterval)
      clearInterval(logInterval)
      setVisibleLogs(mockLogs) // todos los logs
      setProgress(100)
      setStatus('COMPLETED')
      // Pausa 1.5 s antes de navegar a resultados
      setTimeout(() => onComplete(mockPredictionResult), 1500)
    }, 5000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(logInterval)
      clearTimeout(doneTimer)
    }
  }, [status, onComplete])

  // Auto-scroll del terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleLogs])

  const cfg = STATUS_CONFIG[status]
  const stageIdx = STAGES.findIndex(s => s.id === status)

  return (
    <div className="max-w-3xl mx-auto py-10">

      {/* ── Título ──────────────────────────────────────────────────── */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Procesamiento de Datos</h2>
        <p className="text-slate-500 font-medium">Tu secuencia está siendo analizada en tiempo real por AlphaFold2</p>
      </div>

      {/* ── Card principal de estado ─────────────────────────────────── */}
      <div className="card p-10 shadow-2xl mb-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-60" />

        {/* Job ID + badge */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">ID del Trabajo</div>
            <div className="font-mono text-sm font-bold text-slate-700 bg-slate-100/80 border border-slate-200/50 px-4 py-2 rounded-xl inline-block shadow-sm">
              {jobId}
            </div>
          </div>
          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border-2 text-xs font-black uppercase tracking-widest shrink-0 shadow-sm ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`}></span>
            {cfg.label}
          </div>
        </div>

        {/* Secuencia resumida */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 mb-8">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Objetivo Molecular</div>
          <div className="font-mono text-xs text-slate-600 truncate font-semibold">{headerLine}</div>
        </div>

        {/* ── Pasos del flujo ────────────────────────────────────────── */}
        <div className="flex items-center mb-10 relative px-2">
          {STAGES.map((stage, idx) => {
            const isDone = idx < stageIdx
            const isCurrent = idx === stageIdx
            return (
              <div key={stage.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-700 ${
                    isDone    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 rotate-3' :
                    isCurrent ? `bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-blue-50 -rotate-3 scale-110` :
                    'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {isDone ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : idx + 1}
                  </div>
                  <div className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${
                    isCurrent ? 'text-slate-900' : isDone ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {stage.label}
                  </div>
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`flex-1 h-1.5 mx-4 mb-6 rounded-full overflow-hidden bg-slate-100`}>
                    <div className={`h-full transition-all duration-1000 ${
                      stageIdx > idx ? 'bg-emerald-400 w-full' : 'bg-transparent w-0'
                    }`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Barra de progreso ─────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            <span>Progreso de Computación</span>
            <span className="font-mono text-slate-900">{Math.round(progress)}%</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 shadow-sm ${
                status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full opacity-50"></div>
          <p className={`text-xs font-bold uppercase tracking-tight ${cfg.color}`}>{cfg.desc}</p>
        </div>
      </div>

      {/* ── Terminal de logs ─────────────────────────────────────────── */}
      {(status === 'RUNNING' || status === 'COMPLETED') && (
        <div className="card overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 border-t-0">
          {/* Barra de título tipo macOS */}
          <div className="flex items-center justify-between px-6 py-4 bg-white/80 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l3 3-3 3m5 0h3" />
                </svg>
                alphafold2.core.log
              </span>
            </div>
            {status === 'RUNNING' && (
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                Streaming
              </span>
            )}
          </div>

          {/* Contenido del log */}
          <div className="bg-slate-950/95 p-6 h-64 overflow-y-auto font-mono text-[11px] leading-6 selection:bg-blue-500/30">
            {visibleLogs.map((log, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-slate-600 shrink-0 select-none opacity-50 font-bold">[{log.time}]</span>
                <span className={log.msg.startsWith('✓') ? 'text-emerald-400 font-bold' : 'text-slate-300 group-hover:text-white transition-colors'}>
                  {log.msg}
                </span>
              </div>
            ))}
            {/* Cursor parpadeante */}
            {status === 'RUNNING' && (
              <div className="flex gap-4 mt-1">
                <span className="text-slate-600 select-none opacity-50 font-bold">[---]</span>
                <span className="text-blue-400 animate-pulse font-black">_</span>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* ── Estado PENDING: card de espera ─────────────────────── */}
      {status === 'PENDING' && (
        <div className="card p-10 text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-3xl border-4 border-slate-50 rotate-6"></div>
              <div className="absolute inset-0 rounded-3xl border-4 border-transparent border-t-amber-500 animate-spin -rotate-3"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>
          <p className="text-slate-900 font-black uppercase tracking-widest text-sm mb-2">Asignando Nodo de GPU</p>
          <p className="text-slate-500 font-bold text-xs">Posición en cola: <span className="text-amber-600 font-black">01</span></p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
