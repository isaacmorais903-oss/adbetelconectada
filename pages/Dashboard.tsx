
import React, { useRef, useState, useEffect } from 'react';
import { Users, Heart, Calendar, DollarSign, PlusCircle, FileText, Send, BookOpen, Clock, Music, MapPin, Youtube, HeartHandshake, User, ChevronRight, Save, Upload, FileSpreadsheet, Share2, Facebook, Instagram, ExternalLink, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { StatsCard } from '../components/StatsCard';
import { UserRole, View } from '../types';

interface DashboardProps {
  userRole: UserRole;
  onChangeView?: (view: View) => void;
  onBackup?: () => void;
  onExportCSV?: () => void;
  onRestore?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const data = [
  { name: 'Jan', attendance: 120, donations: 2400 },
  { name: 'Fev', attendance: 132, donations: 1398 },
  { name: 'Mar', attendance: 145, donations: 3800 },
  { name: 'Abr', attendance: 150, donations: 3908 },
  { name: 'Mai', attendance: 170, donations: 4800 },
  { name: 'Jun', attendance: 185, donations: 5200 },
];

export const Dashboard: React.FC<DashboardProps> = ({ userRole, onChangeView, onBackup, onExportCSV, onRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
      instagram: '',
      facebook: '',
      youtube: ''
  });

  // Carregar links salvos (Simulação via LocalStorage para persistência imediata)
  useEffect(() => {
      const savedLinks = localStorage.getItem('church_social_links');
      if (savedLinks) {
          setSocialLinks(JSON.parse(savedLinks));
      }
  }, []);

  const handleSaveSocial = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('church_social_links', JSON.stringify(socialLinks));
      setShowSocialModal(false);
      // Dispara evento para atualizar sidebar se necessário
      window.dispatchEvent(new Event('storage'));
      alert('Redes sociais atualizadas com sucesso!');
  };

  // Componente de Redes Sociais (Redesign Discreto)
  const SocialMediaSection = () => {
      // Verifica se existe algum link configurado
      const hasAnyLink = socialLinks.instagram || socialLinks.facebook || socialLinks.youtube;
      
      // Se não tiver link e não for admin, não mostra nada (para não poluir a tela do membro)
      if (!hasAnyLink && userRole !== 'admin') return null;

      return (
        <div className="mt-6 mb-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide mb-3 px-1 flex items-center gap-2 opacity-70">
                <Share2 className="w-4 h-4" /> Nossas Redes
            </h3>
            <div className="flex flex-wrap gap-3">
                {/* Instagram */}
                {(socialLinks.instagram || userRole === 'admin') && (
                    <a 
                        href={socialLinks.instagram || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => !socialLinks.instagram && e.preventDefault()}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 group
                            ${socialLinks.instagram 
                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-pink-500/50 hover:shadow-sm cursor-pointer' 
                                : 'bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700 opacity-60 cursor-default'
                            }`}
                    >
                        <div className={`p-1.5 rounded-full ${socialLinks.instagram ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' : 'bg-slate-200 text-slate-500'}`}>
                            <Instagram className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-semibold ${socialLinks.instagram ? 'text-slate-700 dark:text-slate-200 group-hover:text-pink-600 dark:group-hover:text-pink-400' : 'text-slate-400'}`}>
                            Instagram
                        </span>
                        {socialLinks.instagram && <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-pink-400 ml-1" />}
                    </a>
                )}

                {/* Facebook */}
                {(socialLinks.facebook || userRole === 'admin') && (
                    <a 
                        href={socialLinks.facebook || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => !socialLinks.facebook && e.preventDefault()}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 group
                            ${socialLinks.facebook 
                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500/50 hover:shadow-sm cursor-pointer' 
                                : 'bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700 opacity-60 cursor-default'
                            }`}
                    >
                        <div className={`p-1.5 rounded-full ${socialLinks.facebook ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-slate-200 text-slate-500'}`}>
                            <Facebook className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-semibold ${socialLinks.facebook ? 'text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400' : 'text-slate-400'}`}>
                            Facebook
                        </span>
                        {socialLinks.facebook && <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400 ml-1" />}
                    </a>
                )}

                {/* YouTube */}
                {(socialLinks.youtube || userRole === 'admin') && (
                    <a 
                        href={socialLinks.youtube || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => !socialLinks.youtube && e.preventDefault()}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 group
                            ${socialLinks.youtube 
                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-red-500/50 hover:shadow-sm cursor-pointer' 
                                : 'bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700 opacity-60 cursor-default'
                            }`}
                    >
                        <div className={`p-1.5 rounded-full ${socialLinks.youtube ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-slate-200 text-slate-500'}`}>
                            <Youtube className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-semibold ${socialLinks.youtube ? 'text-slate-700 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400' : 'text-slate-400'}`}>
                            YouTube
                        </span>
                        {socialLinks.youtube && <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-red-400 ml-1" />}
                    </a>
                )}
            </div>
            {userRole === 'admin' && !hasAnyLink && (
                <p className="text-xs text-slate-400 mt-2 ml-1">
                    * Configure os links no botão "Redes Sociais" acima para que apareçam aqui.
                </p>
            )}
        </div>
      );
  };
  
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <button 
                onClick={() => onChangeView?.('members')}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <PlusCircle className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 text-center">Novo Membro</span>
            </button>
            <button 
                onClick={() => onChangeView?.('finance')}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <FileText className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 text-center">Relatórios</span>
            </button>
            <button 
                onClick={() => onChangeView?.('announcements')}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Send className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 text-center">Novo Aviso</span>
            </button>
            <button 
                onClick={() => onChangeView?.('finance')}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <DollarSign className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 text-center">Lançar Oferta</span>
            </button>

            {/* Social Media Config Button */}
            <button 
                onClick={() => setShowSocialModal(true)}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <Share2 className="w-6 h-6 text-purple-700 dark:text-purple-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 text-center">Redes Sociais</span>
            </button>
            
            {/* BACKUP & EXPORT BUTTONS */}
            
            <button 
                onClick={onExportCSV}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                title="Baixar planilhas para Excel/Google Sheets"
            >
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                    <FileSpreadsheet className="w-6 h-6 text-green-700 dark:text-green-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 text-center">Exportar Excel</span>
            </button>

            <button 
                onClick={onBackup}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                title="Backup completo do sistema (JSON)"
            >
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                    <Save className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 text-center">Backup JSON</span>
            </button>
            
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            >
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                    <Upload className="w-6 h-6 text-orange-700 dark:text-orange-400" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 text-center">Restaurar</span>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={onRestore}
                    className="hidden" 
                    accept=".json"
                />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard label="Membros Totais" value="185" trend="+12%" trendUp={true} icon={Users} color="text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" />
            <StatsCard label="Visitantes (Mês)" value="24" trend="+5%" trendUp={true} icon={Heart} color="text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400" />
            <StatsCard label="Eventos Ativos" value="3" trend="Mesmo nível" trendUp={true} icon={Calendar} color="text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400" />
            <StatsCard label="Entradas (Mês)" value="R$ 5.2k" trend="+8.5%" trendUp={true} icon={DollarSign} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" />
        </div>
        
        {/* Render Social Section for Admins too */}
        <SocialMediaSection />

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

        {/* MODAL DE CONFIGURAÇÃO DE REDES SOCIAIS */}
        {showSocialModal && (
            <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-purple-600" /> Configurar Redes Sociais
                        </h3>
                        <button onClick={() => setShowSocialModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <form onSubmit={handleSaveSocial} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 flex items-center gap-1"><Instagram className="w-4 h-4"/> Instagram (Link Completo)</label>
                            <input 
                                type="url" 
                                placeholder="https://instagram.com/suaigreja" 
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                                value={socialLinks.instagram}
                                onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 flex items-center gap-1"><Facebook className="w-4 h-4"/> Facebook (Link Completo)</label>
                            <input 
                                type="url" 
                                placeholder="https://facebook.com/suaigreja" 
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                value={socialLinks.facebook}
                                onChange={e => setSocialLinks({...socialLinks, facebook: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 flex items-center gap-1"><Youtube className="w-4 h-4"/> YouTube (Link Completo)</label>
                            <input 
                                type="url" 
                                placeholder="https://youtube.com/c/suaigreja" 
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                                value={socialLinks.youtube}
                                onChange={e => setSocialLinks({...socialLinks, youtube: e.target.value})}
                            />
                        </div>
                        <div className="pt-4">
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">Salvar Links</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </div>
    );
  }

  // ---------------- MEMBER DASHBOARD (App Style Grid) ----------------
  
  const menuItems = [
    { label: 'Cultos ao Vivo', icon: Youtube, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', action: () => { if(socialLinks.youtube) window.open(socialLinks.youtube, '_blank'); else alert('Link não configurado.'); } },
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
        
        {/* Render Social Section for Members (NOVA POSIÇÃO E ESTILO) */}
        <SocialMediaSection />

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
