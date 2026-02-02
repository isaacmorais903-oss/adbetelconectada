
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
import { Login } from './pages/Login';
import { View, UserRole, Member, Transaction, InventoryItem } from './types';
import { Bell, LogOut, Home, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { supabase, isConfigured } from './services/supabaseClient';

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin'); 
  const [isLoadingData, setIsLoadingData] = useState(false);
  
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
      if (session) {
         setUserRole('admin');
         // Se conectou, carrega os dados
         fetchData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Data Fetching Effect (Supabase)
  const fetchData = async () => {
    if (!isConfigured) return; // Se não tiver config, usa estado local vazio ou inicial

    setIsLoadingData(true);
    try {
        // Carrega Membros
        const { data: membersData } = await supabase.from('members').select('*').order('name');
        if (membersData) setMembers(membersData);

        // Carrega Financeiro
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
  const toggleRole = () => { setUserRole(prev => prev === 'admin' ? 'member' : 'admin'); setCurrentView('dashboard'); };
  const togglePrivacy = () => setPrivacyMode(!privacyMode);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    // Em modo demo (sem supabase), isAuthenticated é setado manualmente aqui se necessário, 
    // mas idealmente o onAuthStateChange cuida disso.
    if (!isConfigured) {
        setIsAuthenticated(true);
        // Load fake data for demo
        setMembers([
            { id: '1', name: 'Carlos Demo', role: 'Membro', email: 'carlos@demo.com', phone: '11999999999', status: 'Ativo', joinedAt: '2023-01-01' } as any
        ]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    setMembers([]);
    setTransactions([]);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  const renderView = () => {
    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-slate-500">Sincronizando dados...</span>
            </div>
        );
    }

    switch(currentView) {
      case 'dashboard': 
        return <Dashboard userRole={userRole} onChangeView={setCurrentView} onBackup={handleBackup} onExportCSV={handleExportCSV} onRestore={handleRestore} />;
      case 'members': 
        return <Members userRole={userRole} privacyMode={privacyMode} members={members} setMembers={setMembers} />;
      case 'finance': 
        return <Finance userRole={userRole} privacyMode={privacyMode} members={members} transactions={transactions} setTransactions={setTransactions} />;
      case 'inventory': 
        return <Inventory initialItems={inventory} items={(newItems) => setInventory(newItems)} />; 
      case 'announcements': return <Announcements />;
      case 'locations': return <Locations />;
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
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-200">
      <Sidebar 
        currentView={currentView} onChangeView={setCurrentView} userRole={userRole} onToggleRole={toggleRole}
        isDarkMode={theme === 'dark'} onToggleTheme={toggleTheme} privacyMode={privacyMode} onTogglePrivacy={togglePrivacy}
      />

      <main className="flex-1 md:ml-72 transition-all duration-300 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 dark:bg-black text-white p-6 pb-12 rounded-b-[2.5rem] shadow-lg relative z-10">
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                    <span className="font-bold text-lg">{userRole === 'admin' ? 'PR' : 'CS'}</span>
                 </div>
                 <div>
                    <h1 className="font-bold text-lg leading-tight">Olá, {userRole === 'admin' ? 'Pr. Admin' : 'Membro'}</h1>
                    <p className="text-xs text-slate-300">{userRole === 'admin' ? 'Painel Administrativo' : 'Área do Membro'}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={togglePrivacy} className={`p-2 rounded-full ${privacyMode ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
                 <button onClick={toggleTheme} className="p-2 bg-white/10 rounded-full">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                 </button>
                 <button onClick={handleLogout} className="p-2 bg-white/10 rounded-full"><LogOut className="w-5 h-5" /></button>
              </div>
           </div>
           {currentView !== 'dashboard' && (
              <div className="flex items-center justify-between mt-2">
                <h2 className="text-2xl font-bold">{getPageTitle()}</h2>
                <button onClick={() => setCurrentView('dashboard')} className="bg-white/10 p-2 rounded-lg"><Home className="w-5 h-5" /></button>
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
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{session?.user?.email || 'Usuário'}</p>
                  <p className="text-xs text-slate-400">{userRole === 'admin' ? 'Administrador' : 'Membro'}</p>
               </div>
               <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                 {userRole === 'admin' ? 'PR' : 'MB'}
               </div>
               <button onClick={handleLogout} className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><LogOut className="w-5 h-5" /></button>
             </div>
          </div>
        </header>

        <div className={`flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full ${currentView === 'dashboard' ? '-mt-8 md:mt-0' : ''} z-20`}>
          {renderView()}
        </div>

        <BottomNav currentView={currentView} onChangeView={setCurrentView} />
      </main>
    </div>
  );
};

export default App;
