import React, { useState } from 'react';
import { LayoutDashboard, Users, Bell, Church, DollarSign, MapPin, HeartHandshake, CircleUser, RefreshCw, Moon, Sun } from 'lucide-react';
import { View, UserRole } from '../types';
import { APP_CONFIG } from '../config';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  userRole: UserRole;
  onToggleRole: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, onToggleRole, isDarkMode, onToggleTheme }) => {
  const [imgError, setImgError] = useState(false);
  
  // Define menu items based on Role
  const navItems = userRole === 'admin' 
    ? [
        { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
        { id: 'members', label: 'Membros', icon: Users },
        { id: 'finance', label: 'Tesouraria', icon: DollarSign },
        { id: 'announcements', label: 'Avisos & Eventos', icon: Bell },
        { id: 'prayers', label: 'Pedidos de Oração', icon: HeartHandshake },
        { id: 'locations', label: 'Endereços & Sede', icon: MapPin },
      ]
    : [
        { id: 'dashboard', label: 'Meu Painel', icon: LayoutDashboard },
        { id: 'members', label: 'Meus Dados', icon: CircleUser },
        { id: 'finance', label: 'Contribuição', icon: DollarSign },
        { id: 'announcements', label: 'Mural de Avisos', icon: Bell },
        { id: 'prayers', label: 'Pedidos de Oração', icon: HeartHandshake },
        { id: 'locations', label: 'Nossas Igrejas', icon: MapPin },
      ];

  return (
    // ALTERADO: de w-64 para w-72
    <div className="w-72 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 h-screen fixed left-0 top-0 flex flex-col z-30 hidden md:flex text-slate-300 transition-colors">
      <div 
        onClick={() => onChangeView('dashboard')}
        className="p-6 flex items-center space-x-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
      >
        {APP_CONFIG.logoUrl && !imgError ? (
            <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 overflow-hidden p-1">
                <img 
                    src={APP_CONFIG.logoUrl} 
                    alt="Logo Igreja" 
                    className="w-full h-full object-contain" 
                    onError={() => setImgError(true)}
                />
            </div>
        ) : (
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/50">
                <Church className="w-10 h-10 text-white" />
            </div>
        )}
        
        <div className="overflow-hidden flex flex-col justify-center">
           <span className="block text-xl font-bold text-white tracking-tight leading-none truncate mb-0.5">{APP_CONFIG.churchName}</span>
           <span className="block text-sm font-medium text-sky-400 tracking-wide truncate leading-tight">{APP_CONFIG.churchSubtitle}</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as View)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-900 dark:bg-slate-950">
        
        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={onToggleTheme}
                className="flex items-center justify-center p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-yellow-400 transition-all"
                title="Alternar Tema"
            >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
             <button 
                onClick={onToggleRole}
                className="flex items-center justify-center p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all gap-2"
                title="Alternar Perfil"
            >
                <span className="text-xs font-bold">{userRole === 'admin' ? 'ADMIN' : 'USER'}</span>
                <RefreshCw className="w-3 h-3" />
            </button>
        </div>

        <div className="flex items-center gap-3 px-2">
            <div className="relative">
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-600">
                    {userRole === 'admin' ? 'AD' : 'MB'}
                </div>
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{userRole === 'admin' ? 'Pr. Jeziel' : 'Carlos Silva'}</p>
                <p className="text-xs text-slate-500 truncate">{userRole === 'admin' ? 'Gestão Total' : 'Membro Ativo'}</p>
            </div>
        </div>
      </div>
    </div>
  );
};