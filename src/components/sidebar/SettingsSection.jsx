import React from 'react';
import { Moon, Globe } from 'lucide-react';

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on }) {
  return (
    <div
      className={`w-9 h-5 rounded-none flex items-center px-0.5 flex-shrink-0 ${
        on ? 'bg-[#e31e24]' : 'bg-slate-300 dark:bg-[#3f3f46]'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-none bg-white shadow-sm transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </div>
  );
}

// ── Fila de ajuste genérica ───────────────────────────────────────────────────
function SettingRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between px-2 py-2 rounded-none text-xs">
      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        {Icon && <Icon size={14} className="text-slate-400 flex-shrink-0" />}
        {label}
      </span>
      {children}
    </div>
  );
}

// ── Separador de sección ──────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 pt-3 pb-1">
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function SettingsSection() {
  return (
    <div className="flex flex-col gap-4 text-sm text-slate-700 dark:text-slate-300 h-full">

      <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-wider px-1">
        Ajustes
      </h2>

      {/* ── Apariencia ── */}
      <div className="flex flex-col">
        <SectionTitle>Apariencia</SectionTitle>
        <SettingRow icon={Moon} label="Modo oscuro">
          <Toggle on={false} />
        </SettingRow>
      </div>

      {/* ── Idioma ── */}
      <div className="flex flex-col">
        <SectionTitle>Idioma</SectionTitle>
        <div className="flex gap-2 px-2">
          {[
            { code: 'es', label: 'Español' },
            { code: 'en', label: 'English' },
          ].map(({ code, label }) => (
            <button
              key={code}
              disabled
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-none text-xs font-medium cursor-not-allowed ${
                code === 'es'
                  ? 'bg-slate-900 text-white dark:bg-[#e31e24]'
                  : 'bg-slate-100 text-slate-600 dark:bg-[#27272a] dark:text-slate-300'
              }`}
            >
              <Globe size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
