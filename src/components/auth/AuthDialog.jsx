import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import useAuthStore from "../../stores/useAuthStore";

export function AuthDialog({ open, onOpenChange }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signUp, loading, error, clearError, user } = useAuthStore();

  // Cerrar el modal automáticamente si la autenticación es exitosa
  useEffect(() => {
    if (user && open) {
      onOpenChange(false);
    }
  }, [user, open, onOpenChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
  };

  // Cuando se cierra o cambia de tab, limpiamos errores
  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  // Si cerramos el modal, también podemos limpiar el error
  const handleOpenChange = (openState) => {
    if (!openState) clearError();
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isLogin 
              ? 'Accede para guardar y gestionar tus proteínas.'
              : 'Regístrate para guardar y gestionar tus proteínas en la nube.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              Correo Electrónico
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 font-medium p-2 bg-red-500/10 rounded-md border border-red-500/20">
              Error: {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-2" disabled={loading}>
            {loading ? 'Procesando...' : isLogin ? 'Entrar' : 'Registrarse'}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              {isLogin 
                ? '¿No tienes cuenta? Regístrate aquí' 
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
