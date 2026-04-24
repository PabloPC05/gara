import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAuthStore } from "../../stores/useAuthStore";
import { LoaderCircle } from "lucide-react";

export function AuthDialog({ open, onOpenChange }) {
	const [mode, setMode] = useState("login"); // 'login', 'signup', 'recovery'
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [success, setSuccess] = useState("");
	const signIn = useAuthStore((state) => state.signIn);
	const signUp = useAuthStore((state) => state.signUp);
	const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
	const resetPassword = useAuthStore((state) => state.resetPassword);
	const loading = useAuthStore((state) => state.loading);
	const error = useAuthStore((state) => state.error);
	const clearError = useAuthStore((state) => state.clearError);
	const user = useAuthStore((state) => state.user);

	useEffect(() => {
		if (user && open) {
			onOpenChange(false);
		}
	}, [user, open, onOpenChange]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSuccess("");
		try {
			if (mode === "login") {
				await signIn(email, password);
			} else if (mode === "signup") {
				await signUp(email, password);
			} else if (mode === "recovery") {
				await resetPassword(email);
				setSuccess(
					"¡Email de recuperación enviado! Revisa tu bandeja de entrada.",
				);
			}
		} catch (err) {
			// El error ya se maneja en el store
		}
	};

	const handleGoogleLogin = async () => {
		try {
			await signInWithGoogle();
		} catch (err) {
			// Manejado en el store
		}
	};

	const handleToggleMode = (newMode) => {
		setMode(newMode);
		clearError();
		setSuccess("");
	};

	const handleOpenChange = (openState) => {
		if (!openState) {
			clearError();
			setSuccess("");
			setMode("login");
		}
		onOpenChange(openState);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="fixed left-auto right-4 top-16 translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-lg border border-[#27272a] bg-[#18181b] p-5 text-white shadow-2xl sm:max-w-[320px]"
				showCloseButton={true}
			>
				<DialogHeader className="mb-4 space-y-1 text-left">
					<DialogTitle className="p-0 text-lg font-bold tracking-tight text-white">
						{mode === "login"
							? "Iniciar sesión"
							: mode === "signup"
								? "Registrarse"
								: "Recuperar acceso"}
					</DialogTitle>
					<DialogDescription className="p-0 text-[10px] leading-tight tracking-wide text-slate-500">
						LocalFold / Proyecto BioHack
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-3.5">
					<div className="space-y-1.5">
						<label
							htmlFor="email"
							className="ml-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500"
						>
							Email institucional
						</label>
						<Input
							id="email"
							type="email"
							placeholder="investigador@ejemplo.edu"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="h-9 rounded-lg border-[#3f3f46] bg-[#27272a] text-xs text-white placeholder:text-slate-500 focus-visible:border-[#e31e24] focus-visible:ring-[#e31e24]"
							required
						/>
					</div>

					{mode !== "recovery" && (
						<div className="space-y-1.5">
							<div className="mb-0.5 flex items-end justify-between">
								<label
									htmlFor="password"
									className="ml-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500"
								>
									Contraseña
								</label>
								{mode === "login" && (
									<button
										type="button"
										onClick={() => handleToggleMode("recovery")}
										className="mr-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:text-[#e31e24]"
									>
										¿Olvidaste la clave?
									</button>
								)}
							</div>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="h-9 rounded-lg border-[#3f3f46] bg-[#27272a] text-xs text-white focus-visible:border-[#e31e24] focus-visible:ring-[#e31e24]"
								required={mode !== "recovery"}
								minLength={6}
							/>
						</div>
					)}

					{error && (
						<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-[10px] leading-relaxed text-red-400">
							{error}
						</div>
					)}

					{success && (
						<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[10px] leading-relaxed text-emerald-400">
							{success}
						</div>
					)}

					<Button
						type="submit"
						className="mt-1 h-9 w-full rounded-lg bg-[#e31e24] text-xs font-bold text-white shadow-lg shadow-[#e31e24]/10 transition-all hover:bg-[#c41a1f]"
						disabled={loading}
					>
						{loading ? (
							<LoaderCircle className="h-4 w-4 animate-spin" />
						) : mode === "login" ? (
							"Entrar"
						) : mode === "signup" ? (
							"Crear cuenta"
						) : (
							"Recuperar clave"
						)}
					</Button>

					{mode === "login" && (
						<>
							<div className="relative my-4">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t border-[#27272a]" />
								</div>
								<div className="relative flex justify-center text-[10px] uppercase">
									<span className="bg-[#18181b] px-2 font-bold tracking-widest text-slate-500">
										O
									</span>
								</div>
							</div>

							<Button
								type="button"
								variant="outline"
								className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border-[#27272a] bg-[#1d1d20] text-xs font-medium text-white transition-all hover:bg-[#27272a]"
								onClick={handleGoogleLogin}
							>
								<svg
									viewBox="0 0 24 24"
									className="h-4 w-4 shrink-0"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										fill="#EA4335"
									/>
								</svg>
								Continuar con Google
							</Button>
						</>
					)}
				</form>

				<div className="mt-4 border-t border-[#27272a] pt-3.5 text-center">
					<button
						onClick={() =>
							handleToggleMode(mode === "login" ? "signup" : "login")
						}
						className="text-[11px] font-semibold text-slate-400 transition-colors hover:text-[#e31e24]"
					>
						{mode === "login"
							? "¿No tienes cuenta? Regístrate"
							: "Volver al inicio"}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
