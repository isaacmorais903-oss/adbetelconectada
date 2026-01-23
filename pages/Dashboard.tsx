import React from 'react';
import { Users, Heart, Calendar, DollarSign, PlusCircle, FileText, Send, BookOpen, Clock, Music, MapPin, Youtube, HeartHandshake, User, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { StatsCard } from '../components/StatsCard';
import { UserRole, View } from '../types';

interface DashboardProps {
  userRole: UserRole;
  onChangeView?: (view: View) => void;
}

const data = [
  { name: 'Jan', attendance: 120, donations: 2400 },
  { name: 'Fev', attendance: 132, donations: 1398 },
  { name: 'Mar', attendance: 145, donations: 3800 },
  { name: 'Abr', attendance: 150, donations: 3908 },
  { name: 'Mai', attendance: 170, donations: 4800 },
  { name: 'Jun', attendance: 185, donations: 5200 },
];

export const Dashboard: React.FC<DashboardProps> = ({ userRole, onChangeView }) => {
  
  // ---------------- ADMIN DASHBOARD (Classic Web Analytics) ----------------
  if (userRole === 'admin') {
    return (
        <div className="space-y-8">
        <div className="flex justify-between items-end">
            <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white hidden md:block">Painel Administrativo</h1>
            <p className="text-slate-500 dark:text-slate-400 hidden md:block">Visão geral da gestão da igreja.</p>
            </div>
            <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>

        {/* Quick Actions - Admin */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <button 
                onClick={() => onChangeView?.('members')}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <PlusCircle className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200">Novo Membro</span>
            </button>
            <button 
                onClick={() => onChangeView?.('finance')}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <FileText className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200">Relatórios</span>
            </button>
            <button 
                onClick={() => onChangeView?.('announcements')}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Send className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200">Novo Aviso</span>
            </button>
            <button 
                onClick={() => onChangeView?.('finance')}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <DollarSign className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200">Lançar Oferta</span>
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard label="Membros Totais" value="185" trend="+12%" trendUp={true} icon={Users} color="text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" />
            <StatsCard label="Visitantes (Mês)" value="24" trend="+5%" trendUp={true} icon={Heart} color="text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400" />
            <StatsCard label="Eventos Ativos" value="3" trend="Mesmo nível" trendUp={true} icon={Calendar} color="text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400" />
            <StatsCard label="Entradas (Mês)" value="R$ 5.2k" trend="+8.5%" trendUp={true} icon={DollarSign} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-w-0 transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Frequência nos Cultos</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }} />
                    <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-w-0 transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Crescimento Financeiro</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }} />
                    <Bar dataKey="donations" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
        </div>
        </div>
    );
  }

  // ---------------- MEMBER DASHBOARD (App Style Grid) ----------------
  
  const menuItems = [
    { label: 'Cultos ao Vivo', icon: Youtube, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', action: () => {} },
    { label: 'Doações', icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', action: () => onChangeView?.('finance') },
    { label: 'Pedidos Oração', icon: HeartHandshake, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20', action: () => onChangeView?.('prayers') },
    { label: 'Agenda', icon: Calendar, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', action: () => onChangeView?.('announcements') },
    { label: 'Meus Dados', icon: User, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', action: () => onChangeView?.('members') },
    { label: 'Endereços', icon: MapPin, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', action: () => onChangeView?.('locations') },
    { label: 'Bíblia', icon: BookOpen, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', action: () => {} },
    { label: 'Escalas', icon: Music, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', action: () => {} },
  ];

  return (
    <div className="space-y-6">
        
        {/* Featured Card (Next Service) */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 dark:from-black dark:to-blue-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
                <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-2 backdrop-blur-sm border border-white/20">
                        PRÓXIMO CULTO
                    </span>
                    <h2 className="text-2xl font-bold mb-1">Culto da Família</h2>
                    <div className="flex items-center gap-2 text-blue-200 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Domingo, 18:00h</span>
                    </div>
                </div>
                <div className="hidden sm:block">
                     <button className="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                        Ver Detalhes
                     </button>
                </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        {/* Action Grid (The App Look) */}
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Acesso Rápido</h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <button 
                            key={index}
                            onClick={item.action}
                            className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group aspect-square justify-center"
                        >
                            <div className={`p-3.5 rounded-full ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                                <Icon className="w-6 h-6" strokeWidth={2.5} />
                            </div>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center leading-tight">
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Highlights / News Feed */}
        <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg px-1">Destaques</h3>
            
            {/* Daily Word Card */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-white">Palavra do Dia</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">"O Senhor é o meu pastor e nada me faltará..."</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </div>

            {/* Campaign Card */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                 <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl text-orange-600 dark:text-orange-400 flex-shrink-0">
                    <Heart className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-white">Campanha do Quilo</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">Ajude as famílias carentes da comunidade.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </div>
        </div>

    </div>
  );
};