import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  color: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, trend, trendUp, icon: Icon, color }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 break-words leading-tight">{value}</h3>
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} bg-opacity-10 flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm">
          <span className={`font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend}
          </span>
          <span className="text-slate-400 dark:text-slate-500 ml-2">vs. mês passado</span>
        </div>
      )}
    </div>
  );
};