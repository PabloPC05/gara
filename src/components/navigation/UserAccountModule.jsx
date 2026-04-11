import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { AuthDialog } from "../auth/AuthDialog";
import useAuthStore from "../../stores/useAuthStore";

export function UserAccountModule() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user, logOut } = useAuthStore();

  // Función para obtener iniciales
  const getInitials = (email) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center rounded-md p-1 hover:bg-slate-100 transition-colors">
            <Avatar className="h-6 w-6 rounded-md">
              <AvatarImage src={user ? "" : "https://avatar.vercel.sh/bio"} className="rounded-md" />
              <AvatarFallback className="bg-blue-600 text-[9px] font-bold text-white rounded-md">
                {user ? getInitials(user.email) : 'BV'}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 border border-slate-200 bg-white shadow-xl rounded-xl p-2 z-[60]">
          <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {user ? 'Cuenta Profesional' : 'Inicia Sesión'}
          </DropdownMenuLabel>
          
          {user && (
            <div className="px-3 pb-2 text-xs text-slate-500 font-medium truncate">
              {user.email}
            </div>
          )}

          {user ? (
            <>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium">Ajustes de Sesión</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem 
                className="rounded-xl px-3 py-2 text-sm font-medium text-red-600 cursor-pointer"
                onClick={() => logOut()}
              >
                Cerrar Sesión
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem 
              className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer"
              onClick={() => setAuthDialogOpen(true)}
            >
              Iniciar Sesión / Registro
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
