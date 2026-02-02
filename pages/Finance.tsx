
import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Filter, Plus, X, Search, Calendar, CreditCard, Banknote, FileText, User, ChevronDown } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { Transaction, UserRole, Member } from '../types';
import { supabase, isConfigured } from '../services/supabaseClient';

interface FinanceProps {
    userRole: UserRole;
    privacyMode?: boolean;
    members?: Member[];
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const Finance: React.FC<FinanceProps> = ({ userRole, privacyMode = false, members = [], transactions, setTransactions }) => {
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Filtro
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showFilters, setShowFilters] = useState(false); // Mobile toggle

  // Lista Dinâmica de Categorias (Extraída das transações existentes + padrões)
  const defaultCategories = [
    'Dízimos', 'Ofertas', 'Ofertas Nominais', 'Missões', 'Cantina', 'Eventos', 'Outras Entradas',
    'Manutenção', 'Contas', 'Prebendas', 'Ajuda de Custo', 'Missões Saída', 'Eventos Saída', 'Material', 'Outras Saídas'
  ];
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  
  // Computa todas as categorias disponíveis (Padrão + Usadas no histórico + Novas criadas na sessão)
  const availableCategories = useMemo(() => {
      const usedCategories = transactions.map(t => t.category);
      return Array.from(new Set([...defaultCategories, ...usedCategories, ...customCategories])).sort();
  }, [transactions, customCategories]);


  // Estados do Formulário
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    category: 'Dízimos',
    paymentMethod: 'Pix',
    description: '',
    memberId: ''
  });
  
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [amountInputValue, setAmountInputValue] = useState('');

  // Cálculos de Resumo (Baseado no FILTRO DE MÊS SELECIONADO)
  const stats = useMemo(() => {
      const txsInMonth = transactions.filter(t => t.date.startsWith(monthFilter));
      
      const income = txsInMonth.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const expense = txsInMonth.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      return { income, expense, balance: income - expense };
  }, [transactions, monthFilter]);

  // Lógica de Filtragem da Tabela
  const filteredTransactions = transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = t.date.startsWith(monthFilter);
      const matchesType = typeFilter === 'all' ? true : t.type === typeFilter;
      const matchesCategory = categoryFilter === 'Todas' ? true : t.category === categoryFilter;

      return matchesSearch && matchesMonth && matchesType && matchesCategory;
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, ''); 
      if (!rawValue) { 
          setAmountInputValue(''); 
          setNewTransaction(prev => ({...prev, amount: 0})); 
          return; 
      }
      const amountNumber = parseFloat(rawValue) / 100;
      setAmountInputValue(amountNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      setNewTransaction(prev => ({...prev, amount: amountNumber}));
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se estiver adicionando categoria, usa o nome digitado, senão usa o select
    const finalCategory = isAddingNewCategory ? newCategoryName : newTransaction.category;
    
    if(!newTransaction.amount || !newTransaction.description || !finalCategory) return;
    setIsSaving(true);

    try {
        const payload = { ...newTransaction, category: finalCategory };
        
        if (isConfigured) {
            delete payload.id; // Banco gera o ID
            // Limpa memberId se não for categoria de membro
            if (payload.category !== 'Dízimos' && payload.category !== 'Ofertas Nominais') {
                payload.memberId = null as any;
            }

            const { data, error } = await supabase.from('transactions').insert(payload).select();
            if (error) throw error;
            if (data) setTransactions([data[0] as Transaction, ...transactions]);
        } else {
             // LOCAL FALLBACK
             const tx: Transaction = {
                ...payload as Transaction,
                id: Math.random().toString(36).substr(2, 9)
             };
             setTransactions([tx, ...transactions]);
        }
        
        // Adiciona a nova categoria à lista local para aparecer nos filtros
        if(isAddingNewCategory && !availableCategories.includes(finalCategory)) {
            setCustomCategories([...customCategories, finalCategory]);
        }

        // Reset Form
        setShowModal(false);
        setAmountInputValue('');
        setNewCategoryName('');
        setIsAddingNewCategory(false);
        setNewTransaction({ 
            type: 'income', 
            date: new Date().toISOString().split('T')[0], 
            category: 'Dízimos', 
            paymentMethod: 'Pix', 
            amount: 0, 
            description: '',
            memberId: ''
        });
    } catch (error: any) {
        console.error(error);
        alert("Erro ao salvar: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Tem certeza que deseja excluir este lançamento?")) return;
      try {
          if(isConfigured) {
              const { error } = await supabase.from('transactions').delete().eq('id', id);
              if(error) throw error;
          }
          setTransactions(transactions.filter(t => t.id !== id));
      } catch (error: any) {
          alert("Erro ao excluir: " + error.message);
      }
  };

  const handleMemberSelect = (memberId: string) => {
      const member = members.find(m => m.id === memberId);
      setNewTransaction(prev => ({
          ...prev, 
          memberId,
          description: member ? `Dízimo - ${member.name}` : prev.description
      }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="sticky top-0 md:top-[74px] z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm pb-4 pt-2 -mx-6 px-6 md:-mx-8 md:px-8 mb-4 border-b border-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tesouraria</h1>
          <p className="text-slate-500 dark:text-slate-400">Controle financeiro e lançamentos.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all">
            <Plus className="w-5 h-5" /> Lançar Novo
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label={`Entradas (${new Date(monthFilter + '-02').toLocaleDateString('pt-BR', { month: 'long' })})`} value={`R$ ${stats.income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} trend="" trendUp={true} icon={TrendingUp} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" />
        <StatsCard label={`Saídas (${new Date(monthFilter + '-02').toLocaleDateString('pt-BR', { month: 'long' })})`} value={`R$ ${stats.expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} trend="" trendUp={false} icon={TrendingDown} color="text-red-600 bg-red-50 dark:bg-red-900/20" />
        <StatsCard label="Saldo do Período" value={`R$ ${stats.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} trend={stats.balance >= 0 ? "Positivo" : "Atenção"} trendUp={stats.balance >= 0} icon={DollarSign} color="text-blue-600 bg-blue-50 dark:bg-blue-900/20" />
      </div>

      {/* Área de Filtros e Tabela */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {/* Barra de Ferramentas e Filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-4">
            
            {/* Linha Principal: Busca e Mês */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Buscar lançamento..." 
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                    <input 
                        type="month" 
                        value={monthFilter} 
                        onChange={e => setMonthFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white"
                    />
                    
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`md:hidden px-3 py-2 border rounded-lg text-sm flex items-center gap-2 ${showFilters ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-700'}`}
                    >
                        <Filter className="w-4 h-4" /> Filtros
                    </button>

                    {/* Desktop Filters (Always visible) */}
                    <div className="hidden md:flex gap-2">
                        <select 
                            value={typeFilter} 
                            onChange={e => setTypeFilter(e.target.value as any)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white"
                        >
                            <option value="all">Todas Entradas/Saídas</option>
                            <option value="income">Apenas Entradas</option>
                            <option value="expense">Apenas Saídas</option>
                        </select>

                        <select 
                            value={categoryFilter} 
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white max-w-[200px]"
                        >
                            <option value="Todas">Todas Categorias</option>
                            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Mobile Filters (Collapsible) */}
            {showFilters && (
                <div className="md:hidden grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                    <select 
                        value={typeFilter} 
                        onChange={e => setTypeFilter(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white"
                    >
                        <option value="all">Tudo</option>
                        <option value="income">Entradas</option>
                        <option value="expense">Saídas</option>
                    </select>

                    <select 
                        value={categoryFilter} 
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white"
                    >
                        <option value="Todas">Todas Categorias</option>
                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Forma Pagto.</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Valor</th>
                {userRole === 'admin' && <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTransactions.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          Nenhum lançamento encontrado com estes filtros.
                      </td>
                  </tr>
              ) : (
                filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${t.type==='income'?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600':'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                {t.type==='income' ? <TrendingUp className="w-3.5 h-3.5"/> : <TrendingDown className="w-3.5 h-3.5"/>}
                            </div>
                            <span className="text-slate-900 dark:text-white font-medium">{t.description}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs">
                            {t.category}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{t.paymentMethod || '-'}</td>
                    <td className={`px-6 py-4 font-bold text-right ${t.type==='income'?'text-emerald-600 dark:text-emerald-400':'text-red-600 dark:text-red-400'}`}>
                        {privacyMode ? '****' : `R$ ${t.amount.toFixed(2)}`}
                    </td>
                    {userRole === 'admin' && (
                        <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                <X className="w-4 h-4" />
                            </button>
                        </td>
                    )}
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVO LANÇAMENTO */}
      {showModal && (
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Novo Lançamento</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Registre entradas ou saídas.</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>
                
                <form onSubmit={handleSaveTransaction} className="overflow-y-auto p-6 space-y-5">
                    
                    {/* TIPO: ENTRADA / SAÍDA */}
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-xl">
                         <button 
                            type="button" 
                            onClick={() => {
                                setNewTransaction({...newTransaction, type: 'income', category: 'Dízimos'});
                                setIsAddingNewCategory(false);
                            }} 
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${newTransaction.type === 'income' ? 'bg-white dark:bg-slate-600 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                         >
                            <TrendingUp className="w-4 h-4" /> Entrada
                         </button>
                         <button 
                            type="button" 
                            onClick={() => {
                                setNewTransaction({...newTransaction, type: 'expense', category: 'Manutenção'});
                                setIsAddingNewCategory(false);
                            }} 
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${newTransaction.type === 'expense' ? 'bg-white dark:bg-slate-600 shadow-sm text-red-600 dark:text-red-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                         >
                            <TrendingDown className="w-4 h-4" /> Saída
                         </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* VALOR */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor (R$)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-lg font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={amountInputValue} 
                                    onChange={handleAmountChange} 
                                    placeholder="0,00" 
                                />
                            </div>
                        </div>

                         {/* DATA */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Data</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                <input 
                                    type="date" 
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={newTransaction.date} 
                                    onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* CATEGORIA (COM MODO DE NOVA CATEGORIA) */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Categoria</label>
                            <button 
                                type="button" 
                                onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {isAddingNewCategory ? 'Selecionar Existente' : '+ Nova Categoria'}
                            </button>
                        </div>
                        
                        {isAddingNewCategory ? (
                            <input 
                                type="text"
                                autoFocus
                                className="w-full px-3 py-2.5 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Digite o nome da nova categoria"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                            />
                        ) : (
                            <select 
                                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newTransaction.category} 
                                onChange={e => {
                                    setNewTransaction({...newTransaction, category: e.target.value});
                                    // Limpa membro se mudar de categoria que não precisa
                                    if(e.target.value !== 'Dízimos' && e.target.value !== 'Ofertas Nominais') {
                                        setNewTransaction(prev => ({...prev, category: e.target.value, memberId: '', description: ''}));
                                    }
                                }}
                            >
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* SELEÇÃO DE MEMBRO (Apenas para Dízimos/Ofertas Nominais) */}
                    {((newTransaction.category === 'Dízimos' || newTransaction.category === 'Ofertas Nominais') && !isAddingNewCategory) && (
                        <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> Selecionar Membro
                             </label>
                             <select
                                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newTransaction.memberId || ''}
                                onChange={e => handleMemberSelect(e.target.value)}
                             >
                                 <option value="">Selecione o membro...</option>
                                 {members.map(m => (
                                     <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                 ))}
                             </select>
                        </div>
                    )}

                    {/* DESCRIÇÃO */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição Detalhada</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newTransaction.description || ''} 
                                onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} 
                                placeholder="Ex: Dízimo referente a Agosto"
                            />
                        </div>
                    </div>

                    {/* FORMA DE PAGAMENTO */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Forma de Pagamento</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['Pix', 'Dinheiro', 'Cartão', 'Outros'].map(method => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setNewTransaction({...newTransaction, paymentMethod: method as any})}
                                    className={`py-2 text-xs font-medium rounded-lg border ${
                                        newTransaction.paymentMethod === method 
                                        ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none flex justify-center items-center gap-2"
                        >
                            {isSaving ? 'Salvando...' : 'Confirmar Lançamento'}
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};
