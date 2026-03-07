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
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'finance', label: 'Contribuir', icon: DollarSign },
    { id: 'members', label: 'Perfil', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 pb-5 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id as View)}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-all duration-200 ${
              isActive ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Icon className={`w-7 h-7 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[11px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};