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

  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center rounded-md p-1 hover:bg-white/10 transition-colors">
            <Avatar className="h-6 w-6 rounded-md">
              <AvatarImage src={user ? "" : "https://avatar.vercel.sh/bio"} className="rounded-md" />
              <AvatarFallback className="bg-blue-600 text-[9px] font-bold text-white rounded-md">
                {user ? getInitials(user.email) : 'BV'}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5 z-[60]">
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {user ? 'Cuenta Profesional' : 'Inicia Sesión'}
          </DropdownMenuLabel>
          
          {user && (
            <div className="px-2 pb-2 text-xs text-slate-400 font-medium truncate">
              {user.email}
            </div>
          )}

          {user ? (
            <>
              <DropdownMenuItem className={itemClass}>Mi Perfil</DropdownMenuItem>
              <DropdownMenuItem className={itemClass}>Facturación y Planes</DropdownMenuItem>
              <DropdownMenuItem className={itemClass}>Claves API</DropdownMenuItem>
              <DropdownMenuItem className={itemClass}>Uso de Almacenamiento</DropdownMenuItem>
              <DropdownMenuItem className={itemClass}>Ajustes de Sesión</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10 mx-1" />
              <DropdownMenuItem 
                className="text-xs text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300 focus:text-red-300 rounded-lg px-2 py-1.5 cursor-pointer"
                onClick={() => logOut()}
              >
                Cerrar Sesión
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem 
              className={itemClass}
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
