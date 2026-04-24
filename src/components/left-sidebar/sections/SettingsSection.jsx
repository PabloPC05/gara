import React, { useEffect, useState } from "react";
import {
	Moon,
	Sun,
	Globe,
	LogOut,
	User,
	LayoutList,
	CheckCircle2,
	Cloud,
} from "lucide-react";
import { useLayoutStore } from "../../../stores/useLayoutStore";
import { useViewerConfigStore } from "../../../stores/useViewerConfigStore";
import { useAuthStore } from "../../../stores/useAuthStore";
import { getAccessToken } from "../../../lib/googleDriveService";

// ── Toggle switch reutilizable ────────────────────────────────────────────────
function Toggle({ on, onClick }) {
	return (
		<button
			onClick={onClick}
			className={`flex h-5 w-9 flex-shrink-0 items-center rounded-none px-0.5 transition-colors ${
				on ? "bg-[#e31e24]" : "bg-slate-300 dark:bg-[#3f3f46]"
			}`}
			aria-checked={on}
			role="switch"
		>
			<span
				className={`h-4 w-4 rounded-none bg-white shadow-sm transition-transform ${
					on ? "translate-x-4" : "translate-x-0"
				}`}
			/>
		</button>
	);
}

// ── Fila de ajuste genérica ───────────────────────────────────────────────────
function SettingRow({ icon: Icon, label, children, onClick }) {
	return (
		<div
			className={`flex items-center justify-between rounded-none px-2 py-2 text-xs ${
				onClick
					? "cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-[#27272a]"
					: ""
			}`}
			onClick={onClick}
		>
			<span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
				{Icon && <Icon size={14} className="flex-shrink-0 text-slate-400" />}
				{label}
			</span>
			{children}
		</div>
	);
}

// ── Separador de sección ──────────────────────────────────────────────────────
function SectionTitle({ children }) {
	return (
		<p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
			{children}
		</p>
	);
}

// ── Opciones de fondo del visor ───────────────────────────────────────────────
const VIEWER_BACKGROUNDS = [
	{ color: "#ffffff", label: "Blanco" },
	{ color: "#1a1a2e", label: "Oscuro" },
	{ color: "#0f172a", label: "Noche" },
];

// ─────────────────────────────────────────────────────────────────────────────

export function SettingsSection() {
	const darkMode = useLayoutStore((s) => s.darkMode);
	const toggleDarkMode = useLayoutStore((s) => s.toggleDarkMode);
	const language = useLayoutStore((s) => s.language);
	const setLanguage = useLayoutStore((s) => s.setLanguage);
	const compactMode = useLayoutStore((s) => s.compactMode);
	const toggleCompactMode = useLayoutStore((s) => s.toggleCompactMode);
	const viewerBackground = useViewerConfigStore((s) => s.viewerBackground);
	const setViewerBackground = useViewerConfigStore(
		(s) => s.setViewerBackground,
	);

	const user = useAuthStore((s) => s.user);
	const logOut = useAuthStore((s) => s.logOut);

	const [googleConnected, setGoogleConnected] = useState(false);

	useEffect(() => {
		// Check connection status periodically or on mount
		const checkStatus = () => {
			setGoogleConnected(!!getAccessToken());
		};
		checkStatus();
		const interval = setInterval(checkStatus, 2000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex h-full flex-col gap-4 text-sm text-slate-700 dark:text-slate-300">
			<h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
				Ajustes
			</h2>

			{/* ── Apariencia ── */}
			<div className="flex flex-col">
				<SectionTitle>Apariencia</SectionTitle>

				<SettingRow
					icon={darkMode ? Moon : Sun}
					label="Modo oscuro"
					onClick={toggleDarkMode}
				>
					<Toggle
						on={darkMode}
						onClick={(e) => {
							e.stopPropagation();
							toggleDarkMode();
						}}
					/>
				</SettingRow>

				<SettingRow
					icon={LayoutList}
					label="Vista compacta"
					onClick={toggleCompactMode}
				>
					<Toggle
						on={compactMode}
						onClick={(e) => {
							e.stopPropagation();
							toggleCompactMode();
						}}
					/>
				</SettingRow>
			</div>

			{/* ── Idioma ── */}
			<div className="flex flex-col">
				<SectionTitle>Idioma</SectionTitle>
				<div className="flex gap-2 px-2">
					{[
						{ code: "es", label: "Español" },
						{ code: "en", label: "English" },
					].map(({ code, label }) => (
						<button
							key={code}
							onClick={() => setLanguage(code)}
							className={`flex flex-1 items-center justify-center gap-1.5 rounded-none py-1.5 text-xs font-medium transition-colors ${
								language === code
									? "bg-slate-900 text-white dark:bg-[#e31e24]"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#27272a] dark:text-slate-300 dark:hover:bg-[#3f3f46]"
							}`}
						>
							<Globe size={11} />
							{label}
						</button>
					))}
				</div>
			</div>

			{/* ── Servicios Conectados ── */}
			<div className="flex flex-col">
				<SectionTitle>Servicios Conectados</SectionTitle>
				<SettingRow icon={Cloud} label="Google Workspace">
					<div className="flex items-center gap-1.5">
						<span
							className={`h-1.5 w-1.5 rounded-full ${googleConnected ? "animate-pulse bg-green-500" : "bg-slate-300"}`}
						/>
						<span className="text-[10px] font-medium text-slate-500">
							{googleConnected ? "Conectado" : "No vinculado"}
						</span>
					</div>
				</SettingRow>
			</div>

			{/* ── Visor 3D ── */}
			<div className="flex flex-col">
				<SectionTitle>Visor 3D</SectionTitle>
				<div className="px-2">
					<p className="mb-2 text-[10px] text-slate-400 dark:text-slate-500">
						Fondo del visor
					</p>
					<div className="flex gap-2">
						{VIEWER_BACKGROUNDS.map(({ color, label }) => (
							<button
								key={color}
								onClick={() => setViewerBackground(color)}
								title={label}
								className={`h-7 flex-1 rounded-none border-2 transition-colors ${
									viewerBackground === color
										? "border-[#e31e24]"
										: "border-transparent hover:border-slate-300 dark:hover:border-[#3f3f46]"
								}`}
								style={{ backgroundColor: color }}
							>
								{viewerBackground === color && (
									<span className="flex items-center justify-center">
										<CheckCircle2
											size={12}
											className={
												color === "#ffffff" ? "text-slate-700" : "text-white"
											}
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
				<div className="mt-auto flex flex-col">
					<SectionTitle>Cuenta</SectionTitle>
					<SettingRow icon={User} label={user.email} />
					<button
						onClick={logOut}
						className="flex w-full items-center gap-2 rounded-none px-2 py-2 text-xs text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-[#27272a]"
					>
						<LogOut size={14} className="flex-shrink-0" />
						Cerrar sesión
					</button>
				</div>
			)}
		</div>
	);
}
