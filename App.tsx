import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Announcements } from './pages/Announcements';
import { Finance } from './pages/Finance';
import { Locations } from './pages/Locations';
import { Prayers } from './pages/Prayers';
import { Login } from './pages/Login';
import { View, UserRole } from './types';
import { Bell, LogOut, Home, Moon, Sun } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin'); // Default role
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved as 'light' | 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  // If not authenticated, show Login Screen
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch(currentView) {
      case 'dashboard': return <Dashboard userRole={userRole} onChangeView={setCurrentView} />;
      case 'members': return <Members userRole={userRole} />;
      case 'finance': return <Finance userRole={userRole} />;
      case 'announcements': return <Announcements />;
      case 'locations': return <Locations />;
      case 'prayers': return <Prayers />;
      default: return <Dashboard userRole={userRole} onChangeView={setCurrentView} />;
    }
  };

  const getPageTitle = () => {
    switch(currentView) {
      case 'dashboard': return 'Início';
      case 'members': return userRole === 'admin' ? 'Membros' : 'Meu Perfil';
      case 'finance': return userRole === 'admin' ? 'Tesouraria' : 'Contribuições';
      case 'announcements': return 'Avisos';
      case 'locations': return 'Endereços';
      case 'prayers': return 'Orações';
      default: return '';
    }
  };

  const toggleRole = () => {
    setUserRole(prev => prev === 'admin' ? 'member' : 'admin');
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-200">
      {/* Sidebar for Desktop */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        userRole={userRole}
        onToggleRole={toggleRole}
        isDarkMode={theme === 'dark'}
        onToggleTheme={toggleTheme}
      />

      {/* ALTERADO: md:ml-64 para md:ml-72 */}
      <main className="flex-1 md:ml-72 transition-all duration-300 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Mobile Header - App Style */}
        <header className="md:hidden bg-slate-900 dark:bg-black text-white p-6 pb-12 rounded-b-[2.5rem] shadow-lg relative z-10 transition-colors">
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <span className="font-bold text-lg">{userRole === 'admin' ? 'PR' : 'CS'}</span>
                 </div>
                 <div>
                    <h1 className="font-bold text-lg leading-tight">Olá, {userRole === 'admin' ? 'Pr. Jeziel' : 'Carlos'}</h1>
                    <p className="text-xs text-slate-300">Bem-vindo à ADBetelConectada</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <button onClick={toggleTheme} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                 </button>
                 <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
                 </button>
                 <button onClick={handleLogout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                    <LogOut className="w-5 h-5" />
                 </button>
              </div>
           </div>
           
           {/* Mobile Page Title if not dashboard */}
           {currentView !== 'dashboard' && (
              <div className="flex items-center justify-between mt-2">
                <h2 className="text-2xl font-bold">{getPageTitle()}</h2>
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="bg-white/10 p-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
                >
                  <Home className="w-5 h-5 text-white" />
                </button>
              </div>
           )}
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 px-6 py-4 items-center justify-between shadow-sm transition-colors">
          <div className="flex items-center gap-4">
             {currentView !== 'dashboard' && (
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 transition-colors border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                  title="Voltar ao Início"
                >
                   <Home className="w-5 h-5" />
                </button>
             )}
             <h2 className="text-xl font-bold text-slate-800 dark:text-white">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-5">
             <div className="relative group">
               <Bell className="w-6 h-6 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors" />
               <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
             </div>
             <div className="flex items-center gap-3 pl-5 border-l border-slate-100 dark:border-slate-700">
               <div className="text-right">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{userRole === 'admin' ? 'Pr. Jeziel' : 'Carlos Silva'}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{userRole === 'admin' ? 'Administrador' : 'Membro'}</p>
               </div>
               <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-200 dark:shadow-none">
                 {userRole === 'admin' ? 'PR' : 'CS'}
               </div>
               <button onClick={handleLogout} className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sair">
                    <LogOut className="w-5 h-5" />
               </button>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className={`flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full ${currentView === 'dashboard' ? '-mt-8 md:mt-0' : ''} z-20`}>
          {renderView()}
        </div>

        {/* Bottom Navigation for Mobile */}
        <BottomNav currentView={currentView} onChangeView={setCurrentView} />
      </main>
    </div>
  );
};

export default App;