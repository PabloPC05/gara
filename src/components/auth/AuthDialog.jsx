import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import useAuthStore from "../../stores/useAuthStore";
import { LoaderCircle } from 'lucide-react';

export function AuthDialog({ open, onOpenChange }) {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'recovery'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
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
    setSuccess('');
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        await signUp(email, password);
      } else if (mode === 'recovery') {
        await resetPassword(email);
        setSuccess('¡Email de recuperación enviado! Revisa tu bandeja de entrada.');
      }
    } catch (err) {
      // El error ya se maneja en el store
    }
  };

  const handleToggleMode = (newMode) => {
    setMode(newMode);
    clearError();
    setSuccess('');
  };

  const handleOpenChange = (openState) => {
    if (!openState) {
      clearError();
      setSuccess('');
      setMode('login');
    }
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="fixed top-16 right-4 left-auto translate-x-0 translate-y-0 sm:max-w-[320px] bg-[#18181b] text-white border border-[#27272a] shadow-2xl rounded-xl p-5 gap-0 overflow-hidden"
        showCloseButton={true}
      >
        <DialogHeader className="mb-4 text-left space-y-1">
          <DialogTitle className="text-lg font-bold tracking-tight text-white p-0">
            {mode === 'login' ? 'Iniciar sesión' : mode === 'signup' ? 'Registrarse' : 'Recuperar acceso'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-[10px] p-0 tracking-wide leading-tight">
            LocalFold / Proyecto BioHack
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">
              Email institucional
            </label>
            <Input
              id="email"
              type="email"
              placeholder="investigador@ejemplo.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-slate-500 h-9 text-xs rounded-md focus-visible:ring-[#e31e24] focus-visible:border-[#e31e24]"
              required
            />
          </div>
          
          {mode !== 'recovery' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-end mb-0.5">
                <label htmlFor="password" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => handleToggleMode('recovery')}
                    className="text-[10px] text-slate-500 hover:text-[#e31e24] transition-colors font-semibold mr-0.5"
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
                className="bg-[#27272a] border-[#3f3f46] text-white h-9 text-xs rounded-md focus-visible:ring-[#e31e24] focus-visible:border-[#e31e24]"
                required={mode !== 'recovery'}
                minLength={6}
              />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-[10px] bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 leading-relaxed">
              {error}
            </div>
          )}

          {success && (
            <div className="text-emerald-400 text-[10px] bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 leading-relaxed">
              {success}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#e31e24] hover:bg-[#c41a1f] text-white font-bold h-9 text-xs rounded-md transition-all shadow-lg shadow-[#e31e24]/10 mt-1"
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : mode === 'login' ? (
              'Entrar'
            ) : mode === 'signup' ? (
              'Crear cuenta'
            ) : (
              'Recuperar clave'
            )}
          </Button>
        </form>

        <div className="mt-4 pt-3.5 border-t border-[#27272a] text-center">
          <button 
            onClick={() => handleToggleMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[11px] font-semibold text-slate-400 hover:text-[#e31e24] transition-colors"
          >
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : 'Volver al inicio'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
