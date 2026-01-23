import React from 'react';
import { Home, User, DollarSign, Menu, Calendar } from 'lucide-react';
import { View } from '../types';

interface BottomNavProps {
  currentView: View;
  onChangeView: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'announcements', label: 'Agenda', icon: Calendar },
    { id: 'finance', label: 'Doar', icon: DollarSign },
    { id: 'members', label: 'Perfil', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id as View)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
      <button 
        onClick={() => onChangeView('locations')} // Usando locations como "Menu" ou "Mais" por enquanto
        className="flex flex-col items-center gap-1 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <Menu className="w-6 h-6" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </div>
  );
};