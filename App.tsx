
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Announcements } from './pages/Announcements';
import { Finance } from './pages/Finance';
import { Locations } from './pages/Locations';
import { Prayers } from './pages/Prayers';
import { Inventory } from './pages/Inventory'; 
import { Discipleship } from './pages/Discipleship'; // Importa Nova Página
import { PastoralCare } from './pages/PastoralCare'; // Importa Nova Página
import Calendar from './pages/Calendar'; // Importa Nova Página
import { History } from './pages/History'; // Importa Nova Página
import { Login } from './pages/Login';
import { View, UserRole, Member, Transaction, InventoryItem } from './types';
import { Bell, LogOut, Home, Moon, Sun, Eye, EyeOff, Settings, Lock, X, RefreshCw } from 'lucide-react';
import { supabase, isConfigured } from './services/supabase';

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('member'); // Default to member for safety
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Settings / Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  
  // Data State
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Theme & Privacy
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') as 'light'|'dark' || 'light';
    }
    return 'light';
  });
  const [privacyMode, setPrivacyMode] = useState(false);

  // 1. Auth Effect
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      if (data.session) {
          handleSessionSuccess(data.session);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'PASSWORD_RECOVERY') {
          setShowPasswordModal(true);
      }
      if (session) {
         handleSessionSuccess(session);
      } else {
         setIsAuthenticated(false);
         setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSessionSuccess = (session: any) => {
      setSession(session);
      setIsAuthenticated(true);
      
      // Determine Role based on Email
      const email = session.user?.email || '';
      // Aceita: admin, adm, pastor, lider, secretaria, tesouraria
      const isAdmin = /admin|adm|pastor|lider|secretaria|tesouraria/i.test(email);
      const role = isAdmin ? 'admin' : 'member';
      
      setUserRole(role);
      
      fetchData();
  };

  // 2. Data Fetching Effect (Supabase)
  const fetchData = async () => {
    if (!isConfigured) return; // Se não tiver config, usa estado local vazio ou inicial

    setIsLoadingData(true);
    try {
        // Carrega Membros (Lógica de Segurança)
        let membersQuery;
        
        // Se for admin, carrega tudo da tabela original
        if (userRole === 'admin') {
            membersQuery = supabase.from('members').select('*').order('name');
        } else {
            // Se for membro comum, carrega da VIEW PÚBLICA (sem dados sensíveis)
            // Mas também precisa carregar o PRÓPRIO perfil completo da tabela original
            // Como o App.tsx carrega uma lista única, vamos carregar a view pública para a lista geral.
            // O componente Members.tsx fará um fetch adicional para "Meus Dados" se necessário.
            membersQuery = supabase.from('members_public_view').select('*').order('name');
        }

        const { data: membersData, error: membersError } = await membersQuery;
        
        // Fallback: Se a view não existir (ainda não rodou script), tenta tabela normal (o RLS vai bloquear se já rodou)
        if (membersError && userRole !== 'admin') {
             console.warn("View pública não encontrada, tentando tabela direta (pode retornar vazio se RLS ativo):", membersError);
             const { data: fallbackData } = await supabase.from('members').select('*').order('name');
             if (fallbackData) setMembers(fallbackData);
        } else if (membersData) {
             setMembers(membersData as Member[]);
        }

        // Carrega Financeiro (Se for admin ou se precisarmos exibir algo específico)
        // Nota: RLS no banco já protege, mas evitamos requisição desnecessária
        const { data: financeData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (financeData) setTransactions(financeData);

        // Carrega Inventário
        const { data: inventoryData } = await supabase.from('inventory').select('*').order('name');
        if (inventoryData) setInventory(inventoryData);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    } finally {
        setIsLoadingData(false);
    }
  };

  // 3. Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handlers
  const handleBackup = () => { 
      const data = { members, transactions, inventory, date: new Date() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_adbetel_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
  };
  
  const handleExportCSV = () => { alert("Funcionalidade de CSV em breve."); };
  const handleRestore = () => { alert("Funcionalidade de Restore em breve."); };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  
  // Toggle Role (Apenas visual, para teste rápido em dev, ou admin mudar view)
  const toggleRole = () => { 
      setUserRole(prev => prev === 'admin' ? 'member' : 'admin'); 
      setCurrentView('dashboard'); 
  };
  
  const togglePrivacy = () => setPrivacyMode(!privacyMode);

  // Manual Login Handler (usado pelo componente Login, principalmente para modo Demo)
  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    if (!isConfigured) {
        setIsAuthenticated(true);
        // Load fake data for demo
        setMembers([
            { id: '1', name: 'Carlos Demo', role: 'Membro', email: 'carlos@demo.com', phone: '11999999999', status: 'Ativo', joinedAt: '2023-01-01', congregation: '001 - Sede' } as any
        ]);
    }
  };

  const handleLogout = async () => {
    if(isConfigured) await supabase.auth.signOut();
    setIsAuthenticated(false);
    setSession(null);
    setCurrentView('dashboard');
    setMembers([]);
    setTransactions([]);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword.length < 6) {
          alert("A senha deve ter pelo menos 6 caracteres.");
          return;
      }
      setIsChangingPass(true);

      if (!isConfigured) {
          // Modo Demo
          await new Promise(r => setTimeout(r, 1000));
          alert("(Modo Demo) Senha alterada visualmente com sucesso!");
          setShowPasswordModal(false);
          setNewPassword('');
          setIsChangingPass(false);
          return;
      }

      try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          alert("Senha atualizada com sucesso!");
          setShowPasswordModal(false);
          setNewPassword('');
      } catch (error: any) {
          alert("Erro ao atualizar senha: " + error.message);
      } finally {
          setIsChangingPass(false);
      }
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  // Identifica o usuário atual na lista de membros para exibir o nome correto
  const currentUserMember = members.find(m => m.email?.toLowerCase() === session?.user?.email?.toLowerCase());
  const currentUserName = currentUserMember?.name || session?.user?.email?.split('@')[0] || (userRole === 'admin' ? 'Administrador' : 'Visitante');
  const currentUserEmail = session?.user?.email || '';

  const renderView = () => {
    // Só bloqueia a tela se for o CARREGAMENTO INICIAL (sem membros carregados).
    if (isLoadingData && members.length === 0 && inventory.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-slate-500">Sincronizando dados...</span>
            </div>
        );
    }

    switch(currentView) {
      case 'dashboard': 
        return <Dashboard 
                  userRole={userRole} 
                  onChangeView={setCurrentView} 
                  onBackup={handleBackup} 
                  onExportCSV={handleExportCSV} 
                  onRestore={handleRestore}
                  members={members} // Passando membros para contagem
               />;
      case 'members': 
        return <Members 
                  userRole={userRole} 
                  privacyMode={privacyMode} 
                  members={members} 
                  setMembers={setMembers} 
                  currentUserEmail={session?.user?.email} 
               />;
      case 'finance': 
        return <Finance userRole={userRole} privacyMode={privacyMode} members={members} transactions={transactions} setTransactions={setTransactions} />;
      case 'inventory': 
        return <Inventory initialItems={inventory} items={(newItems) => setInventory(newItems)} />; 
      
      // NOVA ROTA
      case 'discipleship':
        return <Discipleship members={members} setMembers={setMembers} currentUserEmail={session?.user?.email} />;
      
      // NOVA ROTA PASTORAL
      case 'pastoral':
        return <PastoralCare userRole={userRole} currentUserEmail={session?.user?.email} members={members} />;

      case 'calendar': return <Calendar />;
      case 'history': return <History onBack={() => setCurrentView('dashboard')} />;
      case 'announcements': return <Announcements />;
      case 'locations': return <Locations userRole={userRole} />;
      case 'prayers': return <Prayers />;
      default: return <Dashboard userRole={userRole} />;
    }
  };

  const getPageTitle = () => {
    switch(currentView) {
      case 'dashboard': return 'Início';
      case 'members': return 'Membros';
      case 'finance': return 'Tesouraria';
      case 'inventory': return 'Patrimônio';
      case 'announcements': return 'Avisos';
      case 'locations': return 'Endereços';
      case 'prayers': return 'Orações';
      case 'discipleship': return 'Discipulado';
      case 'calendar': return 'Calendário';
      case 'history': return 'Nossa História';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-200">
      <Sidebar 
        currentView={currentView} onChangeView={setCurrentView} userRole={userRole} onToggleRole={toggleRole}
        isDarkMode={theme === 'dark'} onToggleTheme={toggleTheme} privacyMode={privacyMode} onTogglePrivacy={togglePrivacy}
        userName={currentUserName} userEmail={currentUserEmail}
      />

      <main className="flex-1 md:ml-72 transition-all duration-300 flex flex-col min-h-screen pb-20 md:pb-0 relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 dark:bg-black text-white p-4 pb-8 rounded-b-[2rem] shadow-lg relative z-10">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                 <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                    <span className="font-bold text-sm">{userRole === 'admin' ? 'AD' : 'MB'}</span>
                 </div>
                 <div className="overflow-hidden">
                    <h1 className="font-bold text-base leading-tight truncate max-w-[150px]">{currentUserName}</h1>
                    <p className="text-[10px] text-slate-300">{userRole === 'admin' ? 'Painel Administrativo' : 'Área do Membro'}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={togglePrivacy} className={`p-1.5 rounded-full ${privacyMode ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                 </button>
                 <button onClick={toggleTheme} className="p-1.5 bg-white/10 rounded-full">
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                 </button>
                 {/* Botão de Configurações Mobile */}
                 <button onClick={() => setShowPasswordModal(true)} className="p-1.5 bg-white/10 rounded-full text-white">
                    <Settings className="w-4 h-4" />
                 </button>
                 <button onClick={handleLogout} className="p-1.5 bg-white/10 rounded-full"><LogOut className="w-4 h-4" /></button>
              </div>
           </div>
           {currentView !== 'dashboard' && (
              <div className="flex items-center justify-between mt-2">
                <h2 className="text-xl font-bold">{getPageTitle()}</h2>
                <button onClick={() => setCurrentView('dashboard')} className="bg-white/10 p-1.5 rounded-lg"><Home className="w-4 h-4" /></button>
              </div>
           )}
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 px-6 py-4 items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
             {currentView !== 'dashboard' && (
                <button onClick={() => setCurrentView('dashboard')} className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg hover:text-blue-600 border border-slate-200 dark:border-slate-600">
                   <Home className="w-5 h-5" />
                </button>
             )}
             <h2 className="text-xl font-bold text-slate-800 dark:text-white">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-5">
             <div className="relative"><Bell className="w-6 h-6 text-slate-400" /><span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span></div>
             <div className="flex items-center gap-3 pl-5 border-l border-slate-100 dark:border-slate-700">
               <div className="text-right">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 max-w-[150px] truncate">{currentUserName}</p>
                  <p className="text-xs text-slate-400">{userRole === 'admin' ? 'Gestão Total' : 'Acesso Limitado'}</p>
               </div>
               <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${userRole === 'admin' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                 {userRole === 'admin' ? 'AD' : 'MB'}
               </div>
               <button onClick={handleLogout} className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><LogOut className="w-5 h-5" /></button>
             </div>
          </div>
        </header>

        {/* INDICADOR DISCRETO DE SINCRONIZAÇÃO EM BACKGROUND */}
        {isLoadingData && members.length > 0 && (
           <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 bg-slate-900/90 text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl z-50 animate-pulse flex items-center gap-2 backdrop-blur-md">
               <RefreshCw className="w-3 h-3 animate-spin" />
               Sincronizando...
           </div>
        )}

        <div className={`flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 ${currentView === 'dashboard' ? '-mt-8 md:mt-0' : ''} z-20`}>
          {renderView()}
        </div>

        <BottomNav currentView={currentView} onChangeView={setCurrentView} />
      </main>

      {/* MODAL GLOBAL DE ALTERAR SENHA (MOBILE) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
                <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    Alterar Minha Senha
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Digite a nova senha para o seu acesso atual.
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                            Nova Senha
                        </label>
                        <input 
                            type="password" 
                            required
                            minLength={6}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isChangingPass || newPassword.length < 6}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isChangingPass ? 'Atualizando...' : 'Confirmar Nova Senha'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
