
import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Filter, Plus, X, Search, Calendar, CreditCard, Banknote, FileText, User } from 'lucide-react';
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

  // Estados do Formulário
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    category: 'Dízimos',
    paymentMethod: 'Pix',
    description: '',
    memberId: '' // Para vincular membro
  });
  
  const [amountInputValue, setAmountInputValue] = useState('');

  // Cálculos de Resumo
  const stats = useMemo(() => {
      const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      return { income, expense, balance: income - expense };
  }, [transactions]);

  // Filtro de Transações
  const filteredTransactions = transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    if(!newTransaction.amount || !newTransaction.description) return;
    setIsSaving(true);

    try {
        if (isConfigured) {
            // SUPABASE SAVE
            const payload = { ...newTransaction };
            delete payload.id; // Banco gera o ID

            // Se a categoria não for Dízimo, remove o vínculo com membro para não sujar o banco
            if (payload.category !== 'Dízimos' && payload.category !== 'Ofertas Nominais') {
                payload.memberId = null as any;
            }

            const { data, error } = await supabase
                .from('transactions')
                .insert(payload)
                .select();

            if (error) throw error;
            
            if (data) {
                const savedTx = data[0] as Transaction;
                setTransactions([savedTx, ...transactions]);
            }
        } else {
             // LOCAL FALLBACK
             const tx: Transaction = {
                ...newTransaction as Transaction,
                id: Math.random().toString(36).substr(2, 9)
             };
             setTransactions([tx, ...transactions]);
        }
        
        // Reset Form
        setShowModal(false);
        setAmountInputValue('');
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

  // Helper para preencher descrição automática ao selecionar membro
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
        <StatsCard label="Entradas (Mês)" value={`R$ ${stats.income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} trend="" trendUp={true} icon={TrendingUp} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" />
        <StatsCard label="Saídas (Mês)" value={`R$ ${stats.expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} trend="" trendUp={false} icon={TrendingDown} color="text-red-600 bg-red-50 dark:bg-red-900/20" />
        <StatsCard label="Saldo Atual" value={`R$ ${stats.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} trend={stats.balance >= 0 ? "Positivo" : "Atenção"} trendUp={stats.balance >= 0} icon={DollarSign} color="text-blue-600 bg-blue-50 dark:bg-blue-900/20" />
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 bg-slate-50/50 dark:bg-slate-800/50">
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
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 bg-white dark:bg-slate-800">
                <Filter className="w-4 h-4" /> Filtros
            </button>
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
              {filteredTransactions.map((t) => (
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
              ))}
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
                            onClick={() => setNewTransaction({...newTransaction, type: 'income', category: 'Dízimos'})} 
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${newTransaction.type === 'income' ? 'bg-white dark:bg-slate-600 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                         >
                            <TrendingUp className="w-4 h-4" /> Entrada
                         </button>
                         <button 
                            type="button" 
                            onClick={() => setNewTransaction({...newTransaction, type: 'expense', category: 'Manutenção'})} 
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

                    {/* CATEGORIA */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Categoria</label>
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
                            {newTransaction.type === 'income' ? (
                                <>
                                    <option value="Dízimos">Dízimos (Vincular Membro)</option>
                                    <option value="Ofertas">Ofertas Voluntárias (Culto)</option>
                                    <option value="Ofertas Nominais">Ofertas Nominais</option>
                                    <option value="Missões">Oferta de Missões</option>
                                    <option value="Cantina">Venda Cantina</option>
                                    <option value="Eventos">Inscrições de Eventos</option>
                                    <option value="Outras Entradas">Outros</option>
                                </>
                            ) : (
                                <>
                                    <option value="Manutenção">Manutenção Predial</option>
                                    <option value="Contas">Água/Luz/Internet</option>
                                    <option value="Prebendas">Prebendas/Salários</option>
                                    <option value="Ajuda de Custo">Ajuda de Custo</option>
                                    <option value="Missões Saída">Envio Missões</option>
                                    <option value="Eventos Saída">Custos de Eventos</option>
                                    <option value="Material">Material de Limpeza/Escritório</option>
                                    <option value="Outras Saídas">Outros</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* SELEÇÃO DE MEMBRO (Apenas para Dízimos/Ofertas Nominais) */}
                    {(newTransaction.category === 'Dízimos' || newTransaction.category === 'Ofertas Nominais') && (
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
