import React from 'react';
import {
  Moon, Sun, Globe, LogOut, User,
  LayoutList, CheckCircle2,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import useAuthStore from '../../stores/useAuthStore';

// ── Toggle switch reutilizable ────────────────────────────────────────────────
function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ${
        on ? 'bg-[#e31e24]' : 'bg-slate-300 dark:bg-[#3f3f46]'
      }`}
      aria-checked={on}
      role="switch"
    >
      <span
        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Fila de ajuste genérica ───────────────────────────────────────────────────
function SettingRow({ icon: Icon, label, children, onClick }) {
  return (
    <div
      className={`flex items-center justify-between px-2 py-2 rounded-md text-xs ${
        onClick ? 'hover:bg-slate-100 dark:hover:bg-[#27272a] cursor-pointer transition-colors' : ''
      }`}
      onClick={onClick}
    >
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

// ── Opciones de fondo del visor ───────────────────────────────────────────────
const VIEWER_BACKGROUNDS = [
  { color: '#ffffff', label: 'Blanco' },
  { color: '#1a1a2e', label: 'Oscuro' },
  { color: '#0f172a', label: 'Noche' },
];

// ─────────────────────────────────────────────────────────────────────────────

export function SettingsSection() {
  const darkMode          = useUIStore((s) => s.darkMode);
  const toggleDarkMode    = useUIStore((s) => s.toggleDarkMode);
  const language          = useUIStore((s) => s.language);
  const setLanguage       = useUIStore((s) => s.setLanguage);
  const compactMode       = useUIStore((s) => s.compactMode);
  const toggleCompactMode = useUIStore((s) => s.toggleCompactMode);
  const viewerBackground  = useUIStore((s) => s.viewerBackground);
  const setViewerBackground = useUIStore((s) => s.setViewerBackground);

  const user   = useAuthStore((s) => s.user);
  const logOut = useAuthStore((s) => s.logOut);

  return (
    <div className="flex flex-col gap-4 text-sm text-slate-700 dark:text-slate-300 h-full">

      <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-wider px-1">
        Ajustes
      </h2>

      {/* ── Apariencia ── */}
      <div className="flex flex-col">
        <SectionTitle>Apariencia</SectionTitle>

        <SettingRow icon={darkMode ? Moon : Sun} label="Modo oscuro" onClick={toggleDarkMode}>
          <Toggle on={darkMode} onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }} />
        </SettingRow>

        <SettingRow icon={LayoutList} label="Vista compacta" onClick={toggleCompactMode}>
          <Toggle on={compactMode} onClick={(e) => { e.stopPropagation(); toggleCompactMode(); }} />
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
              onClick={() => setLanguage(code)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                language === code
                  ? 'bg-slate-900 text-white dark:bg-[#e31e24]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#27272a] dark:text-slate-300 dark:hover:bg-[#3f3f46]'
              }`}
            >
              <Globe size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Visor 3D ── */}
      <div className="flex flex-col">
        <SectionTitle>Visor 3D</SectionTitle>
        <div className="px-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">Fondo del visor</p>
          <div className="flex gap-2">
            {VIEWER_BACKGROUNDS.map(({ color, label }) => (
              <button
                key={color}
                onClick={() => setViewerBackground(color)}
                title={label}
                className={`flex-1 h-7 rounded-md border-2 transition-colors ${
                  viewerBackground === color
                    ? 'border-[#e31e24]'
                    : 'border-transparent hover:border-slate-300 dark:hover:border-[#3f3f46]'
                }`}
                style={{ backgroundColor: color }}
              >
                {viewerBackground === color && (
                  <span className="flex items-center justify-center">
                    <CheckCircle2
                      size={12}
                      className={color === '#ffffff' ? 'text-slate-700' : 'text-white'}
                    />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cuenta (al fondo) ── */}
      {user && (
        <div className="flex flex-col mt-auto">
          <SectionTitle>Cuenta</SectionTitle>
          <SettingRow icon={User} label={user.email} />
          <button
            onClick={logOut}
            className="flex items-center gap-2 px-2 py-2 rounded-md text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#27272a] transition-colors w-full"
          >
            <LogOut size={14} className="flex-shrink-0" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
