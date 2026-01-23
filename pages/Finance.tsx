import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Filter, Download, CreditCard, QrCode, History, Plus, X, Calendar, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { StatsCard } from '../components/StatsCard';
import { Transaction, UserRole } from '../types';
import { generateFinancialReport } from '../services/pdfService';

// Mock Data for Charts
const monthlyData = [
  { name: 'Jan', income: 4000, expense: 2400 },
  { name: 'Fev', income: 3000, expense: 1398 },
  { name: 'Mar', income: 2000, expense: 9800 },
  { name: 'Abr', income: 2780, expense: 3908 },
  { name: 'Mai', income: 1890, expense: 4800 },
  { name: 'Jun', income: 2390, expense: 3800 },
  { name: 'Jul', income: 3490, expense: 4300 },
  { name: 'Ago', income: 4490, expense: 2300 },
  { name: 'Set', income: 3200, expense: 3100 },
  { name: 'Out', income: 12450, expense: 4200 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Dízimo - Carlos Silva', amount: 450.00, type: 'income', category: 'Dízimos', date: '2023-10-25', memberId: '1' },
  { id: '2', description: 'Conta de Luz', amount: 320.50, type: 'expense', category: 'Utilidades', date: '2023-10-24' },
  { id: '3', description: 'Oferta Especial', amount: 1200.00, type: 'income', category: 'Ofertas', date: '2023-10-23' },
  { id: '4', description: 'Compra Material Limpeza', amount: 150.00, type: 'expense', category: 'Manutenção', date: '2023-10-22' },
  { id: '5', description: 'Dízimo - Ana Souza', amount: 300.00, type: 'income', category: 'Dízimos', date: '2023-10-22', memberId: '2' },
  { id: '6', description: 'Oferta de Missões', amount: 150.00, type: 'income', category: 'Missões', date: '2023-10-20' },
  { id: '7', description: 'Aluguel do Salão', amount: 1200.00, type: 'expense', category: 'Aluguel', date: '2023-10-05' },
];

interface FinanceProps {
    userRole: UserRole;
}

export const Finance: React.FC<FinanceProps> = ({ userRole }) => {
  // State for member view contribution
  const [contributionType, setContributionType] = useState<'dizimo' | 'oferta'>('dizimo');
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  
  // Filter States
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterCategory, setFilterCategory] = useState<string>('all'); // all, income, expense, dizimos, ofertas...
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    category: 'Dízimos'
  });

  // --- FILTER LOGIC ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        // 1. Filter by Month
        const tDate = t.date.substring(0, 7); // Extract YYYY-MM
        const matchDate = filterMonth ? tDate === filterMonth : true;

        // 2. Filter by Category/Type
        let matchCategory = true;
        if (filterCategory === 'all') matchCategory = true;
        else if (filterCategory === 'income') matchCategory = t.type === 'income';
        else if (filterCategory === 'expense') matchCategory = t.type === 'expense';
        else matchCategory = t.category === filterCategory;

        return matchDate && matchCategory;
    });
  }, [transactions, filterMonth, filterCategory]);

  // --- CALCULATE STATS BASED ON FILTERS ---
  const stats = useMemo(() => {
      const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      const expense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

      return {
          income,
          expense,
          balance: income - expense
      };
  }, [filteredTransactions]);

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTransaction.amount || !newTransaction.description) return;

    const transaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        amount: Number(newTransaction.amount),
        description: newTransaction.description || '',
        category: newTransaction.category || 'Outros',
        date: newTransaction.date || new Date().toISOString().split('T')[0],
        type: newTransaction.type as 'income' | 'expense'
    };

    setTransactions([transaction, ...transactions]);
    setShowModal(false);
    setNewTransaction({
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        category: 'Dízimos',
        amount: undefined,
        description: ''
    });
  };

  // --------------- MEMBER VIEW (CONTRIBUTION) ---------------
  if (userRole === 'member') {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contribuições</h1>
                <p className="text-slate-500 dark:text-slate-400">"Cada um contribua segundo propôs no seu coração." - 2 Co 9:7</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Donation Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-blue-100 dark:border-slate-700 overflow-hidden transition-colors">
                    <div className="p-6 bg-blue-600 dark:bg-blue-700 text-white text-center">
                        <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-80" />
                        <h2 className="text-xl font-bold">Faça sua Contribuição</h2>
                        <p className="text-blue-100 text-sm">Rápido, seguro e simples.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            <button 
                                onClick={() => setContributionType('dizimo')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${contributionType === 'dizimo' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Dízimo
                            </button>
                            <button 
                                onClick={() => setContributionType('oferta')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${contributionType === 'oferta' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Oferta
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Valor (R$)</label>
                            <input type="number" placeholder="0,00" className="w-full text-3xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 border-b-2 border-slate-200 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none py-2 bg-transparent" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                                <QrCode className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2" />
                                <span className="font-bold text-slate-700 dark:text-slate-300">PIX</span>
                            </button>
                            <button className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                                <CreditCard className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2" />
                                <span className="font-bold text-slate-700 dark:text-slate-300">Cartão</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-slate-400" />
                        Seu Histórico
                    </h3>
                    <div className="space-y-4">
                        {transactions.filter(t => t.type === 'income').slice(0, 4).map(t => (
                             <div key={t.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent hover:border-slate-100 dark:hover:border-slate-600 transition-all">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{t.description}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">+ R$ {t.amount.toFixed(2)}</span>
                             </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Ver todo o histórico</button>
                </div>
            </div>
        </div>
    );
  }

  // --------------- ADMIN VIEW (MANAGEMENT) ---------------
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tesouraria</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestão financeira, dízimos, ofertas e despesas.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => generateFinancialReport(filteredTransactions)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors"
                title="Exportar dados filtrados abaixo"
            >
                <Download className="w-4 h-4" />
                Exportar Relatório
            </button>
            <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-none"
            >
                <Plus className="w-4 h-4" />
                Nova Transação
            </button>
        </div>
      </div>

      {/* --- FILTERS BAR --- */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center transition-colors">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mr-2">
                <Filter className="w-5 h-5" />
                <span className="font-medium text-sm">Filtros:</span>
            </div>
            
            <div className="w-full md:w-auto">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Mês de Referência</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="month" 
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-full md:w-48 pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="w-full md:w-auto">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tipo de Relatório</label>
                <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full md:w-56 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Visão Geral (Tudo)</option>
                    <option value="income">Todas as Entradas</option>
                    <option value="expense">Todas as Saídas</option>
                    <hr />
                    <option value="Dízimos">Apenas Dízimos</option>
                    <option value="Ofertas">Apenas Ofertas</option>
                    <option value="Missões">Apenas Missões</option>
                </select>
            </div>

            <div className="ml-auto text-xs text-slate-400">
                Mostrando {filteredTransactions.length} registros
            </div>
      </div>

      {/* Stats Grid - DYNAMIC BASED ON FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
            label="Entradas (Filtro)" 
            value={`R$ ${stats.income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
            trend="Período selecionado" 
            trendUp={true} 
            icon={TrendingUp} 
            color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" 
        />
        <StatsCard 
            label="Saídas (Filtro)" 
            value={`R$ ${stats.expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
            trend="Período selecionado" 
            trendUp={false} // Red is warning usually, but simple here
            icon={TrendingDown} 
            color="text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400" 
        />
        <StatsCard 
            label="Saldo (Filtro)" 
            value={`R$ ${stats.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
            trend={stats.balance >= 0 ? "Positivo" : "Negativo"} 
            trendUp={stats.balance >= 0} 
            icon={DollarSign} 
            color="text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" 
        />
      </div>

      {/* Main Chart - Still shows Annual overview for context */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Fluxo de Caixa (Anual)</h3>
            <span className="text-xs text-slate-400">* O gráfico mostra visão anual geral</span>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }} />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" name="Entradas" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" name="Saídas" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions - SHOWS FILTERED DATA */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transações (Filtradas)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Descrição</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Categoria</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Data</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                {t.type === 'income' ? <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />}
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300">
                            {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
              ) : (
                  <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma transação encontrada para este filtro.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
          // ALTERADO: Adicionado md:left-72
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nova Transação</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSaveTransaction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Lançamento</label>
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                            <button 
                                type="button"
                                onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newTransaction.type === 'income' ? 'bg-white dark:bg-slate-600 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Entrada (Receita)
                            </button>
                            <button 
                                type="button"
                                onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newTransaction.type === 'expense' ? 'bg-white dark:bg-slate-600 shadow-sm text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Saída (Despesa)
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                        <input 
                            type="number" 
                            required
                            step="0.01"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTransaction.amount || ''}
                            onChange={e => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={newTransaction.category}
                            onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                        >
                            {newTransaction.type === 'income' ? (
                                <>
                                    <option value="Dízimos">Dízimos</option>
                                    <option value="Ofertas">Ofertas</option>
                                    <option value="Missões">Missões</option>
                                    <option value="Cantina">Cantina</option>
                                    <option value="Outros">Outros</option>
                                </>
                            ) : (
                                <>
                                    <option value="Utilidades">Utilidades (Luz/Água)</option>
                                    <option value="Aluguel">Aluguel</option>
                                    <option value="Manutenção">Manutenção</option>
                                    <option value="Ajuda de Custo">Ajuda de Custo</option>
                                    <option value="Departamento">Departamentos</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTransaction.description}
                            onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                            placeholder={newTransaction.type === 'income' ? "Ex: Oferta Escola Dominical" : "Ex: Conta de Luz Outubro"}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                        <input 
                            type="date" 
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTransaction.date}
                            onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none mt-4"
                    >
                        Salvar Lançamento
                    </button>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};