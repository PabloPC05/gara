import React, { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { AuthDialog } from "../auth/AuthDialog";
import useAuthStore from "../../stores/useAuthStore";
import { 
  Settings, LogOut, History, Hammer, Database
} from 'lucide-react';

export function UserAccountModule() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [wipDialogOpen, setWipDialogOpen] = useState(false);
  const [wipTitle, setWipTitle] = useState("");
  const { user, logOut } = useAuthStore();

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  const handleWipFeature = (title) => {
    setWipTitle(title);
    setWipDialogOpen(true);
  };

  const ProfileButton = (
    <button 
      onClick={() => !user && setAuthDialogOpen(true)}
      className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-[#e31e24]/50 transition-all focus:outline-none ring-2 ring-transparent shadow-sm bg-slate-800 group p-0 m-0 cursor-pointer"
    >
      <Avatar className="h-8 w-8 rounded-full border-2 border-slate-700/80 group-hover:border-transparent transition-colors">
        <AvatarImage src={user?.photoURL || (user ? "" : "https://avatar.vercel.sh/bio")} className="rounded-full" />
        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-[11px] font-bold text-white rounded-full">
          {user ? getInitials(user.displayName || user.email) : 'LF'}
        </AvatarFallback>
      </Avatar>
    </button>
  );

  return (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {ProfileButton}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 border border-slate-700/50 bg-[#18181b]/95 backdrop-blur-md shadow-2xl rounded-lg p-2 z-[60] text-slate-200 mt-2">
            <div className="flex items-center gap-3 px-2 py-3 mb-1">
              <Avatar className="h-10 w-10 border border-slate-600/50 shadow-sm rounded-full">
                <AvatarImage src={user.photoURL} className="rounded-full" />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-sm font-bold text-white rounded-full">
                  {getInitials(user.displayName || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate text-white">
                  {user.displayName || 'Investigador'}
                </span>
                <span className="text-xs text-slate-400 truncate">{user.email}</span>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-slate-800 mb-1" />
            
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer hover:bg-slate-800 focus:bg-slate-800 transition-colors group outline-none"
                onClick={() => handleWipFeature("Historial de Trabajos")}  
              >
                <History className="mr-2 h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span>Historial de Trabajos</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                className="rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer hover:bg-slate-800 focus:bg-slate-800 transition-colors group outline-none"
                onClick={() => handleWipFeature("Cuota de Recursos (HPC)")}
              >
                <Database className="mr-2 h-4 w-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                <span>Cuota de Recursos (HPC)</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer hover:bg-slate-800 focus:bg-slate-800 transition-colors group outline-none"
                onClick={() => handleWipFeature("Configuración")}
              >
                <Settings className="mr-2 h-4 w-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                <span>Configuración</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="bg-slate-800 my-1" />
            
            <DropdownMenuItem 
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-400 focus:text-red-400 transition-colors flex items-center outline-none"
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
        <DialogContent className="sm:max-w-md bg-[#18181b] border border-slate-700/50 shadow-2xl text-white rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Hammer className="h-5 w-5 text-[#e31e24]" />
              Función en desarrollo
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-3 text-sm leading-relaxed">
              El apartado de <strong className="text-white font-semibold">{wipTitle}</strong> todavía no está implementado en esta versión de LocalFold. ¡Pronto añadiremos esta característica profesional!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-6">
            <button 
              className="bg-[#e31e24] hover:bg-[#c41a1f] active:bg-[#a3161a] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#e31e24]/10"
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
