import React from 'react';

const STATUS_CONFIG = {
  PENDING: {
    dot: 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]',
    label: 'PENDING',
    hint: 'Esperando recursos en la cola…',
    bar: 'w-1/3',
    barColor: 'bg-amber-400',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
  },
  RUNNING: {
    dot: 'bg-[#e31e24] animate-pulse shadow-[0_0_8px_rgba(227,30,36,0.6)]',
    label: 'RUNNING',
    hint: 'Ejecutándose en el clúster CESGA',
    bar: 'w-3/4',
    barColor: 'bg-[#e31e24]',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
  },
  COMPLETED: {
    dot: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    label: 'COMPLETED',
    hint: 'Predicción completada. Revisa los resultados.',
    bar: 'w-full',
    barColor: 'bg-green-500',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
  },
  FAILED: {
    dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    label: 'FAILED',
    hint: 'El job ha fallado. Comprueba la secuencia o inténtalo de nuevo.',
    bar: 'w-full',
    barColor: 'bg-rose-500',
    border: 'border-rose-200',
    bg: 'bg-rose-50',
  },
  CANCELLED: {
    dot: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]',
    label: 'CANCELLED',
    hint: 'El job se ha cancelado antes de completarse.',
    bar: 'w-full',
    barColor: 'bg-slate-400',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
  },
};

export function JobStatusPanel({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <div className={`mt-3 border ${cfg.border} rounded-none p-3 ${cfg.bg} shadow-sm`}>
      <h3 className="font-medium text-xs text-slate-500 uppercase tracking-wider mb-3">Job Status</h3>
      <div className="flex items-center gap-3 mb-2">
        <span className={`flex-shrink-0 w-3 h-3 rounded-full ${cfg.dot}`} />
        <span className="font-mono text-sm font-semibold">{cfg.label}</span>
      </div>
      <div className="w-full h-1 bg-slate-200 rounded-none overflow-hidden mb-2">
        <div className={`h-full ${cfg.bar} ${cfg.barColor} transition-all duration-700 ease-in-out`} />
      </div>
      <p className="text-xs text-slate-400">{cfg.hint}</p>
    </div>
  );
}
