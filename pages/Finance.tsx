
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Filter, Download, CreditCard, QrCode, History, Plus, X, Calendar, Search, Copy, Check, ExternalLink, Shield, ChevronDown, User, Upload } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatsCard } from '../components/StatsCard';
import { Transaction, UserRole, Member } from '../types';
import { generateFinancialReport } from '../services/pdfService';
import { supabase, isConfigured } from '../services/supabaseClient';

// ... (MANTER DADOS MOCKADOS E HELPERS PARA VISUALIZAÇÃO)
const monthlyData = [{ name: 'Jan', income: 4000, expense: 2400 }]; // Simplificado

interface FinanceProps {
    userRole: UserRole;
    privacyMode?: boolean;
    members?: Member[];
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const Finance: React.FC<FinanceProps> = ({ userRole, privacyMode = false, members = [], transactions, setTransactions }) => {
  const [contributionType, setContributionType] = useState<'dizimo' | 'oferta'>('dizimo');
  const [donationAmount, setDonationAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados locais do form
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    category: 'Dízimos',
    paymentMethod: 'Pix'
  });
  const [amountInputValue, setAmountInputValue] = useState('');
  
  // Stats calculation
  const stats = useMemo(() => {
      const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      return { income, expense, balance: income - expense };
  }, [transactions]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, ''); 
      if (!rawValue) { setAmountInputValue(''); setNewTransaction({...newTransaction, amount: 0}); return; }
      const amountNumber = parseFloat(rawValue) / 100;
      setAmountInputValue(amountNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      setNewTransaction({...newTransaction, amount: amountNumber});
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTransaction.amount || !newTransaction.description) return;
    setIsSaving(true);

    try {
        if (isConfigured) {
            // SUPABASE SAVE
            // Remove ID para deixar o banco gerar
            const payload = { ...newTransaction };
            delete payload.id;

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
        setShowModal(false);
        setAmountInputValue('');
        setNewTransaction({ type: 'income', date: new Date().toISOString().split('T')[0], category: 'Dízimos', paymentMethod: 'Pix', amount: 0, description: '' });
    } catch (error: any) {
        console.error(error);
        alert("Erro ao salvar: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  // Render simplificado (focado na funcionalidade de conexão, mantendo layout visual)
  return (
    <div className="space-y-8">
      <div className="sticky top-0 md:top-[74px] z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm pb-4 pt-2 -mx-6 px-6 md:-mx-8 md:px-8 mb-4 border-b border-transparent flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tesouraria</h1>
          <p className="text-slate-500 dark:text-slate-400">Controle financeiro {isConfigured ? '(Conectado)' : '(Offline)'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4" /> Nova Transação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="Entradas" value={`R$ ${stats.income.toFixed(2)}`} trend="" trendUp={true} icon={TrendingUp} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" />
        <StatsCard label="Saídas" value={`R$ ${stats.expense.toFixed(2)}`} trend="" trendUp={false} icon={TrendingDown} color="text-red-600 bg-red-50 dark:bg-red-900/20" />
        <StatsCard label="Saldo" value={`R$ ${stats.balance.toFixed(2)}`} trend="" trendUp={stats.balance >= 0} icon={DollarSign} color="text-blue-600 bg-blue-50 dark:bg-blue-900/20" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white">Últimas Transações</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 flex items-center gap-2">
                     <div className={`p-1 rounded ${t.type==='income'?'bg-emerald-100 text-emerald-600':'bg-red-100 text-red-600'}`}>
                        {t.type==='income' ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                     </div>
                     <span className="text-slate-900 dark:text-white">{t.description}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{t.category}</td>
                  <td className={`px-6 py-4 font-bold ${t.type==='income'?'text-emerald-600':'text-red-600'}`}>
                    {privacyMode ? '****' : `R$ ${t.amount.toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-white">Nova Transação</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSaveTransaction} className="space-y-4 overflow-y-auto">
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                         <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'income'})} className={`flex-1 py-2 text-sm font-medium rounded-md ${newTransaction.type === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Entrada</button>
                         <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'expense'})} className={`flex-1 py-2 text-sm font-medium rounded-md ${newTransaction.type === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Saída</button>
                    </div>
                    <div><label className="text-sm dark:text-white">Valor</label><input type="text" className="w-full border rounded p-2 dark:bg-slate-700 dark:text-white" value={amountInputValue} onChange={handleAmountChange} placeholder="0,00" /></div>
                    <div><label className="text-sm dark:text-white">Descrição</label><input type="text" className="w-full border rounded p-2 dark:bg-slate-700 dark:text-white" value={newTransaction.description || ''} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} /></div>
                    <div><label className="text-sm dark:text-white">Categoria</label><select className="w-full border rounded p-2 dark:bg-slate-700 dark:text-white" value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}><option>Dízimos</option><option>Ofertas</option><option>Utilidades</option><option>Aluguel</option></select></div>
                    <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">{isSaving ? 'Salvando...' : 'Salvar'}</button>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};
