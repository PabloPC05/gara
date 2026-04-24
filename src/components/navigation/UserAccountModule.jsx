import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "../ui/dialog";
import { AuthDialog } from "../auth/AuthDialog";
import { useAuthStore } from "../../stores/useAuthStore";
import { Settings, LogOut, History, Hammer, Database } from "lucide-react";

export function UserAccountModule() {
	const [authDialogOpen, setAuthDialogOpen] = useState(false);
	const [wipDialogOpen, setWipDialogOpen] = useState(false);
	const [wipTitle, setWipTitle] = useState("");
	const { user, logOut } = useAuthStore();

	const getInitials = (email) => {
		if (!email) return "U";
		return email.substring(0, 2).toUpperCase();
	};

	const handleWipFeature = (title) => {
		setWipTitle(title);
		setWipDialogOpen(true);
	};

	const ProfileButton = (
		<button
			onClick={() => !user && setAuthDialogOpen(true)}
			className="group m-0 flex cursor-pointer items-center justify-center rounded-full bg-slate-800 p-0 shadow-sm ring-2 ring-transparent transition-all hover:ring-2 hover:ring-[#e31e24]/50 focus:outline-none"
		>
			<Avatar className="h-8 w-8 rounded-full border-2 border-slate-700/80 transition-colors group-hover:border-transparent">
				<AvatarImage
					src={user?.photoURL || (user ? "" : "https://avatar.vercel.sh/bio")}
					className="rounded-full"
				/>
				<AvatarFallback className="rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 text-[11px] font-bold text-white">
					{user ? getInitials(user.displayName || user.email) : "LF"}
				</AvatarFallback>
			</Avatar>
		</button>
	);

	return (
		<>
			{user ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>{ProfileButton}</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="z-[60] mt-2 w-64 rounded-lg border border-slate-700/50 bg-[#18181b]/95 p-2 text-slate-200 shadow-2xl backdrop-blur-md"
					>
						<div className="mb-1 flex items-center gap-3 px-2 py-3">
							<Avatar className="h-10 w-10 rounded-full border border-slate-600/50 shadow-sm">
								<AvatarImage src={user.photoURL} className="rounded-full" />
								<AvatarFallback className="rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 text-sm font-bold text-white">
									{getInitials(user.displayName || user.email)}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col overflow-hidden">
								<span className="truncate text-sm font-semibold text-white">
									{user.displayName || "Investigador"}
								</span>
								<span className="truncate text-xs text-slate-400">
									{user.email}
								</span>
							</div>
						</div>

						<DropdownMenuSeparator className="mb-1 bg-slate-800" />

						<DropdownMenuGroup>
							<DropdownMenuItem
								className="group cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800"
								onClick={() => handleWipFeature("Historial de Trabajos")}
							>
								<History className="mr-2 h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-400" />
								<span>Historial de Trabajos</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								className="group cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800"
								onClick={() => handleWipFeature("Cuota de Recursos (HPC)")}
							>
								<Database className="mr-2 h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-400" />
								<span>Cuota de Recursos (HPC)</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								className="group cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800"
								onClick={() => handleWipFeature("Configuración")}
							>
								<Settings className="mr-2 h-4 w-4 text-slate-400 transition-colors group-hover:text-amber-400" />
								<span>Configuración</span>
							</DropdownMenuItem>
						</DropdownMenuGroup>

						<DropdownMenuSeparator className="my-1 bg-slate-800" />

						<DropdownMenuItem
							className="flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 outline-none transition-colors hover:bg-red-500/10 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
							onClick={() => logOut()}
						>
							<LogOut className="mr-2 h-4 w-4" />
							<span>Cerrar Sesión</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			) : (
				ProfileButton
			)}

			<AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

			<Dialog open={wipDialogOpen} onOpenChange={setWipDialogOpen}>
				<DialogContent className="rounded-lg border border-slate-700/50 bg-[#18181b] p-6 text-white shadow-2xl sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg font-bold">
							<Hammer className="h-5 w-5 text-[#e31e24]" />
							Función en desarrollo
						</DialogTitle>
						<DialogDescription className="pt-3 text-sm leading-relaxed text-slate-400">
							El apartado de{" "}
							<strong className="font-semibold text-white">{wipTitle}</strong>{" "}
							todavía no está implementado en esta versión de LocalFold. ¡Pronto
							añadiremos esta característica profesional!
						</DialogDescription>
					</DialogHeader>
					<div className="mt-6 flex justify-end">
						<button
							className="rounded-lg bg-[#e31e24] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#e31e24]/10 transition-all hover:bg-[#c41a1f] active:bg-[#a3161a]"
							onClick={() => setWipDialogOpen(false)}
						>
							Entendido
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
