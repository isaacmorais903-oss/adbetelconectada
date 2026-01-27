
import React, { useState, useEffect, useRef } from 'react';
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
import { View, UserRole, Member, MemberStatus, Transaction, InventoryItem } from './types';
import { Bell, LogOut, Home, Moon, Sun, RefreshCw, Eye, EyeOff } from 'lucide-react';

// --- DADOS INICIAIS (Centralizados para Backup) ---

const INITIAL_MEMBERS: Member[] = [
  { 
    id: '1', name: 'Carlos Silva', role: 'Membro', email: 'carlos@email.com', phone: '(11) 99999-9999', status: MemberStatus.ACTIVE, joinedAt: '2023-01-15', photoUrl: 'https://ui-avatars.com/api/?name=Carlos+Silva&background=random', address: 'Rua das Palmeiras, 123', birthDate: '1985-05-15', baptismDate: '2005-10-20', city: 'São Paulo', postalCode: '01001-000',
    rg: '12.345.678-9', cpf: '123.456.789-00', maritalStatus: 'Casado', profession: 'Motorista', naturalness: 'São Paulo - SP', nationality: 'Brasileira', congregation: 'Sede', ministry: 'Nenhum'
  },
  { 
    id: '2', name: 'Ana Souza', role: 'Diaconisa', email: 'ana@email.com', phone: '(11) 98888-8888', status: MemberStatus.ACTIVE, joinedAt: '2022-05-20', photoUrl: 'https://ui-avatars.com/api/?name=Ana+Souza&background=random',
    maritalStatus: 'Casada', congregation: 'Sede' 
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Dízimo - Carlos Silva', amount: 450.00, type: 'income', category: 'Dízimos', date: '2023-10-25', memberId: '1', paymentMethod: 'Pix' },
  { id: '2', description: 'Conta de Luz', amount: 320.50, type: 'expense', category: 'Utilidades', date: '2023-10-24', paymentMethod: 'Outros' },
  { id: '3', description: 'Oferta Especial', amount: 1200.00, type: 'income', category: 'Ofertas', date: '2023-10-23', paymentMethod: 'Dinheiro' },
  { id: '4', description: 'Compra Material Limpeza', amount: 150.00, type: 'expense', category: 'Manutenção', date: '2023-10-22', paymentMethod: 'Cartão' },
  { id: '5', description: 'Dízimo - Ana Souza', amount: 300.00, type: 'income', category: 'Dízimos', date: '2023-10-22', memberId: '2', paymentMethod: 'Pix' },
  { id: '6', description: 'Oferta de Missões', amount: 150.00, type: 'income', category: 'Missões', date: '2023-10-20', paymentMethod: 'Dinheiro' },
  { id: '7', description: 'Aluguel do Salão', amount: 1200.00, type: 'expense', category: 'Aluguel', date: '2023-10-05', paymentMethod: 'Pix' },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { 
    id: '1', name: 'Cadeira Empilhável Acolchoada', category: 'Móveis', quantity: 120, estimatedValue: 180.00, location: 'Templo Principal', status: 'Bom', acquisitionDate: '2022-05-10', description: 'Cadeiras azuis para a nave da igreja.'
  },
  { 
    id: '2', name: 'Mesa de Som Behringer X32', category: 'Eletrônicos', quantity: 1, estimatedValue: 18000.00, location: 'Templo Principal', status: 'Bom', acquisitionDate: '2021-11-20', description: 'Mesa digital principal.'
  },
  { 
    id: '3', name: 'Microfone Shure SM58', category: 'Eletrônicos', quantity: 4, estimatedValue: 850.00, location: 'Templo Principal', status: 'Desgastado', acquisitionDate: '2020-01-15'
  },
  { 
    id: '4', name: 'Púlpito de Acrílico', category: 'Móveis', quantity: 1, estimatedValue: 2500.00, location: 'Templo Principal', status: 'Bom', acquisitionDate: '2019-08-10'
  },
];

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin'); 
  
  // Data State (Global - Centralized for Backup)
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  // Security/Privacy State
  const [privacyMode, setPrivacyMode] = useState(false);
  
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

  // --- BACKUP & RESTORE LOGIC ---
  const handleBackup = () => {
      const backupData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          data: {
              members,
              transactions,
              inventory
          }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_adbetel_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- CSV EXPORT LOGIC (Excel/Sheets) ---
  const handleExportCSV = () => {
    const downloadFile = (data: any[], filename: string) => {
        if (!data || data.length === 0) return;

        // Pega os cabeçalhos do primeiro objeto
        const headers = Object.keys(data[0]).join(";");
        
        // Mapeia as linhas
        const rows = data.map(row => 
            Object.values(row).map(value => {
                 if (value === null || value === undefined) return "";
                 // Força string, escapa aspas duplas e envolve em aspas
                 const stringValue = String(value).replace(/"/g, '""'); 
                 return `"${stringValue}"`;
            }).join(";")
        );

        // Adiciona BOM para o Excel reconhecer acentos (UTF-8)
        const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const dateStr = new Date().toISOString().split('T')[0];
    
    // Dispara downloads sequenciais com pequeno delay para evitar bloqueio do navegador
    setTimeout(() => downloadFile(members, `membros_${dateStr}.csv`), 100);
    setTimeout(() => downloadFile(transactions, `financeiro_${dateStr}.csv`), 600);
    setTimeout(() => downloadFile(inventory, `patrimonio_${dateStr}.csv`), 1100);

    alert("Iniciando download de 3 arquivos CSV (Membros, Financeiro, Patrimônio)... Verifique seus downloads.");
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (json.data && json.data.members && json.data.transactions && json.data.inventory) {
                  if(confirm(`Deseja restaurar o backup de ${new Date(json.timestamp).toLocaleDateString()}? Isso substituirá os dados atuais.`)) {
                      setMembers(json.data.members);
                      setTransactions(json.data.transactions);
                      setInventory(json.data.inventory);
                      alert('Dados restaurados com sucesso!');
                  }
              } else {
                  alert('Arquivo de backup inválido.');
              }
          } catch (error) {
              alert('Erro ao ler o arquivo de backup.');
              console.error(error);
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

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
      case 'dashboard': 
        return (
            <Dashboard 
                userRole={userRole} 
                onChangeView={setCurrentView} 
                onBackup={handleBackup}
                onExportCSV={handleExportCSV}
                onRestore={handleRestore}
            />
        );
      case 'members': return <Members userRole={userRole} privacyMode={privacyMode} members={members} setMembers={setMembers} />;
      case 'finance': return <Finance userRole={userRole} privacyMode={privacyMode} members={members} transactions={transactions} setTransactions={setTransactions} />;
      case 'inventory': return <Inventory items={items => setInventory(items as InventoryItem[])} initialItems={inventory} />; 
      case 'announcements': return <Announcements />;
      case 'locations': return <Locations />;
      case 'prayers': return <Prayers />;
      default: return <Dashboard userRole={userRole} onChangeView={setCurrentView} onBackup={handleBackup} onRestore={handleRestore} />;
    }
  };

  const getPageTitle = () => {
    switch(currentView) {
      case 'dashboard': return 'Início';
      case 'members': return userRole === 'admin' ? 'Membros' : 'Meu Perfil';
      case 'finance': return userRole === 'admin' ? 'Tesouraria' : 'Contribuições';
      case 'inventory': return 'Patrimônio';
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

  const togglePrivacy = () => {
    setPrivacyMode(!privacyMode);
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
        privacyMode={privacyMode}
        onTogglePrivacy={togglePrivacy}
      />

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
                    <p className="text-xs text-slate-300 flex items-center gap-1">
                        {userRole === 'admin' ? 'Painel Administrativo' : 'Área do Membro'}
                    </p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button 
                    onClick={togglePrivacy}
                    className={`p-2 rounded-full transition flex items-center justify-center ${privacyMode ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                    title="Modo Privacidade"
                 >
                    {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
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

        <div className={`flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full ${currentView === 'dashboard' ? '-mt-8 md:mt-0' : ''} z-20`}>
          {renderView()}
        </div>

        <BottomNav currentView={currentView} onChangeView={setCurrentView} />
      </main>
    </div>
  );
};

export default App;
