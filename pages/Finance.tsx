
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Filter, Plus, X, Search, Calendar, FileText, User, FileDown, Upload, Download, AlertCircle, Clock, CheckCircle, Pencil } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { Transaction, UserRole, Member, AccountPayable } from '../types';
import { supabase, isConfigured } from '../services/supabase';
import { generateFinancialReport } from '../services/pdf';
import Papa from 'papaparse';

interface FinanceProps {
    userRole: UserRole;
    privacyMode?: boolean;
    members?: Member[];
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const Finance: React.FC<FinanceProps> = ({ userRole, privacyMode = false, members = [], transactions, setTransactions }) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'payables' | 'ministries'>('transactions');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- MINISTRIES LIST ---
  const defaultMinistries = [
      'Geral / Sede',
      'Missões',
      'Ministério Infantil',
      'Ministério de Louvor',
      'Ministério de Jovens',
      'Ministério de Mulheres',
      'Ministério de Homens',
      'Mídias e Comunicação',
      'Ação Social',
      'EBD / Ensino'
  ];
  const [customMinistries, setCustomMinistries] = useState<string[]>([]);
  const availableMinistries = useMemo(() => {
      const usedMinistries = transactions.map(t => t.ministry).filter(Boolean) as string[];
      return Array.from(new Set([...defaultMinistries, ...usedMinistries, ...customMinistries])).sort();
  }, [transactions, customMinistries]);

  // --- ACCOUNTS PAYABLE STATE ---
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [showPayableModal, setShowPayableModal] = useState(false);
  const [payableAmountInputValue, setPayableAmountInputValue] = useState('');
  const [savedDescriptions, setSavedDescriptions] = useState<string[]>(() => {
      const saved = localStorage.getItem('saved_payable_descriptions');
      return saved ? JSON.parse(saved) : [];
  });

  const [newPayable, setNewPayable] = useState<Partial<AccountPayable>>({
      description: '',
      category: 'Contas',
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Pendente',
      hasInterest: false,
      interestAmount: 0,
      notes: ''
  });

  const handlePayableAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, ''); 
      if (!rawValue) { 
          setPayableAmountInputValue(''); 
          setNewPayable(prev => ({...prev, amount: 0})); 
          return; 
      }
      const amountNumber = parseFloat(rawValue) / 100;
      setPayableAmountInputValue(amountNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      setNewPayable(prev => ({...prev, amount: amountNumber}));
  };

  const handleSaveDescription = () => {
      if (newPayable.description && !savedDescriptions.includes(newPayable.description)) {
          const newSaved = [...savedDescriptions, newPayable.description].sort();
          setSavedDescriptions(newSaved);
          localStorage.setItem('saved_payable_descriptions', JSON.stringify(newSaved));
          alert('Descrição salva com sucesso!');
      }
  };

  useEffect(() => {
      if (isConfigured && userRole === 'admin') {
          supabase.from('accounts_payable').select('*').order('dueDate', { ascending: true })
              .then(({ data }) => {
                  if (data) setPayables(data);
              });
      }
  }, [userRole]);

  const handleSavePayable = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          const payload = { ...newPayable };
          if (!payload.description || !payload.amount || !payload.dueDate) return;

          if (isConfigured) {
              if (payload.id) {
                  const { error } = await supabase.from('accounts_payable').update(payload).eq('id', payload.id);
                  if (error) throw error;
                  setPayables(prev => prev.map(p => p.id === payload.id ? { ...p, ...payload } as AccountPayable : p));
              } else {
                  const { data, error } = await supabase.from('accounts_payable').insert(payload).select();
                  if (error) throw error;
                  if (data) setPayables(prev => [...prev, data[0]]);
              }
          } else {
              // Demo
              const mock = { ...payload, id: Math.random().toString() } as AccountPayable;
              if (payload.id) {
                   setPayables(prev => prev.map(p => p.id === payload.id ? mock : p));
              } else {
                   setPayables(prev => [...prev, mock]);
              }
          }
          setShowPayableModal(false);
          setPayableAmountInputValue('');
          setNewPayable({
            description: '',
            category: 'Contas',
            amount: 0,
            dueDate: new Date().toISOString().split('T')[0],
            status: 'Pendente',
            hasInterest: false,
            interestAmount: 0,
            notes: ''
          });
      } catch (error: any) {
          alert('Erro ao salvar conta: ' + error.message);
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeletePayable = async (id: string) => {
      if (!confirm('Excluir esta conta a pagar?')) return;
      if (isConfigured) {
          await supabase.from('accounts_payable').delete().eq('id', id);
      }
      setPayables(prev => prev.filter(p => p.id !== id));
  };

  const markAsPaid = async (payable: AccountPayable) => {
      if (!confirm(`Confirmar pagamento de "${payable.description}"?`)) return;
      const paymentDate = new Date().toISOString().split('T')[0];
      
      try {
        if (isConfigured) {
            // 1. Atualiza status na tabela de contas
            await supabase.from('accounts_payable').update({ 
                status: 'Pago', 
                paymentDate 
            }).eq('id', payable.id);

            // 2. Lança automaticamente na tesouraria como saída
            const transactionPayload = {
                description: `PGTO: ${payable.description}`,
                amount: payable.amount + (payable.hasInterest ? (payable.interestAmount || 0) : 0),
                type: 'expense',
                category: payable.category,
                date: paymentDate,
                paymentMethod: 'Outros'
            };
            const { data: txData } = await supabase.from('transactions').insert(transactionPayload).select();
            
            // Atualiza estados locais
            setPayables(prev => prev.map(p => p.id === payable.id ? { ...p, status: 'Pago', paymentDate } : p));
            if (txData) setTransactions(prev => [txData[0] as Transaction, ...prev]);
            
            alert('Conta paga e lançada na tesouraria com sucesso!');
        } else {
            alert('Modo Demo: Conta marcada como paga.');
            setPayables(prev => prev.map(p => p.id === payable.id ? { ...p, status: 'Pago', paymentDate } : p));
        }
      } catch (e: any) {
          alert('Erro ao processar pagamento: ' + e.message);
      }
  };

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

  // --- MEMBER SEARCH STATE ---
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberOptions, setShowMemberOptions] = useState(false);

  const filteredMembers = useMemo(() => {
      if (!memberSearchTerm) return members;
      return members.filter(m => m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()));
  }, [members, memberSearchTerm]);

  const handleMemberSelect = (memberId: string) => {
      const member = members.find(m => m.id === memberId);
      if (member) {
          setNewTransaction(prev => ({
              ...prev, 
              memberId,
              description: member ? `Dízimo - ${member.name}` : prev.description
          }));
          setMemberSearchTerm(member.name);
          setShowMemberOptions(false);
      }
  };

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

  const handleEditTransaction = (t: Transaction) => {
      setNewTransaction({
          ...t,
          memberId: t.memberId || '' 
      });
      setAmountInputValue(t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      if (!availableCategories.includes(t.category)) {
          setCustomCategories(prev => [...prev, t.category]);
      }
      setShowModal(true);
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
            // Limpa memberId se não for categoria de membro
            if (payload.category !== 'Dízimos' && payload.category !== 'Ofertas Nominais') {
                payload.memberId = null as any;
            }

            if (payload.id) {
                 // UPDATE
                 const { error } = await supabase.from('transactions').update(payload).eq('id', payload.id);
                 if (error) throw error;
                 setTransactions(prev => prev.map(item => item.id === payload.id ? { ...item, ...payload } as Transaction : item));
            } else {
                 // INSERT
                 delete payload.id; // Banco gera o ID
                 const { data, error } = await supabase.from('transactions').insert(payload).select();
                 if (error) throw error;
                 if (data) setTransactions([data[0] as Transaction, ...transactions]);
            }
        } else {
             // LOCAL FALLBACK
             if (payload.id) {
                 setTransactions(prev => prev.map(item => item.id === payload.id ? { ...item, ...payload } as Transaction : item));
             } else {
                 const tx: Transaction = {
                    ...payload as Transaction,
                    id: Math.random().toString(36).substr(2, 9)
                 };
                 setTransactions([tx, ...transactions]);
             }
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
        setMemberSearchTerm('');
        setShowMemberOptions(false);
        setNewTransaction({ 
            type: 'income', 
            date: new Date().toISOString().split('T')[0], 
            category: 'Dízimos', 
            paymentMethod: 'Pix', 
            amount: 0, 
            description: '',
            memberId: '',
            ministry: 'Geral / Sede'
        });
    } catch (error: any) {
        console.error(error);
        alert("Erro ao salvar: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
      // Solicita PIN de segurança
      const pin = prompt("SEGURANÇA: Digite o PIN financeiro para confirmar a exclusão:");
      if (!pin) return;

      try {
          if(isConfigured) {
              // Verifica o PIN no banco
              const { data: settings } = await supabase.from('church_settings').select('financial_pin').single();
              const validPin = settings?.financial_pin || '0000'; // Fallback se não configurado
              
              if (pin !== validPin) {
                  alert("PIN incorreto! Ação cancelada.");
                  return;
              }

              const { error } = await supabase.from('transactions').delete().eq('id', id);
              if(error) throw error;
          } else {
              // Modo Demo: Aceita qualquer PIN ou '0000'
              if (pin !== '0000') {
                   alert("Modo Demo: Use o PIN '0000'");
                   return;
              }
          }
          setTransactions(transactions.filter(t => t.id !== id));
          alert("Lançamento excluído com sucesso.");
      } catch (error: any) {
          alert("Erro ao excluir: " + error.message);
      }
  };



  // --- EXPORT FUNCTIONALITY ---
  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
        alert("Não há lançamentos para exportar no período selecionado.");
        return;
    }
    generateFinancialReport(filteredTransactions);
  };

  // --- IMPORT FUNCTIONALITY ---
  const parseCurrencyBR = (value: string) => {
    // Remove R$, espaços, pontos de milhar e troca vírgula por ponto
    const clean = value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const parseDateBR = (value: string) => {
    // Tenta converter DD/MM/AAAA ou DD-MM-AAAA para YYYY-MM-DD
    if (value.includes('/')) {
        const [d, m, y] = value.split('/');
        return `${y}-${m}-${d}`;
    }
    if (value.includes('-') && value.split('-')[0].length === 2) {
        const [d, m, y] = value.split('-');
        return `${y}-${m}-${d}`;
    }
    // Se já estiver em YYYY-MM-DD ou formato ISO
    return !isNaN(Date.parse(value)) ? new Date(value).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
            const importedTransactions: any[] = [];
            let errorCount = 0;

            // Mapeamento inteligente de colunas
            results.data.forEach((row: any) => {
                try {
                    // Busca colunas por nomes comuns (case insensitive)
                    const keys = Object.keys(row);
                    const findKey = (search: string[]) => keys.find(k => search.some(s => k.toLowerCase().includes(s)));

                    const dateKey = findKey(['data', 'date', 'dia']);
                    const descKey = findKey(['desc', 'histórico', 'motivo']);
                    const amountKey = findKey(['valor', 'amount', 'preço', 'quantia']);
                    const catKey = findKey(['cat', 'classificação']);
                    const typeKey = findKey(['tipo', 'type', 'oper']); // Entrada/Saída

                    if (!dateKey || !amountKey) {
                        errorCount++;
                        return; 
                    }

                    const rawAmount = row[amountKey];
                    let amount = typeof rawAmount === 'number' ? rawAmount : parseCurrencyBR(rawAmount);
                    let type: 'income' | 'expense' = 'income';

                    // Lógica para determinar Tipo (Entrada/Saída)
                    if (typeKey) {
                        const val = row[typeKey].toLowerCase();
                        if (val.includes('saída') || val.includes('despesa') || val.includes('expense') || val.includes('débito')) type = 'expense';
                    } else {
                        // Se não tem coluna tipo, tenta ver se o valor é negativo
                        if (amount < 0) {
                            type = 'expense';
                            amount = Math.abs(amount);
                        }
                    }

                    const tx = {
                        date: parseDateBR(row[dateKey]),
                        description: descKey ? row[descKey] : 'Importado via CSV',
                        amount: amount,
                        category: catKey ? row[catKey] : 'Outros',
                        type: type,
                        paymentMethod: 'Outros'
                    };

                    if (tx.amount > 0) importedTransactions.push(tx);
                } catch (err) {
                    errorCount++;
                }
            });

            if (importedTransactions.length > 0) {
                if (confirm(`${importedTransactions.length} lançamentos identificados. ${errorCount > 0 ? `(${errorCount} linhas ignoradas/erro).` : ''} Deseja importar?`)) {
                    setIsSaving(true);
                    try {
                        if (isConfigured) {
                            const { error } = await supabase.from('transactions').insert(importedTransactions);
                            if (error) throw error;
                            // Recarrega tudo ou adiciona ao estado local
                            const { data } = await supabase.from('transactions').select('*').order('date', {ascending: false});
                            if (data) setTransactions(data as Transaction[]);
                        } else {
                            // Offline mode
                            const newTxs = importedTransactions.map(t => ({...t, id: Math.random().toString(36).substr(2,9)}));
                            setTransactions([...newTxs as Transaction[], ...transactions]);
                        }
                        setShowImportModal(false);
                        alert("Importação concluída com sucesso!");
                    } catch (e: any) {
                        alert("Erro ao salvar no banco: " + e.message);
                    } finally {
                        setIsSaving(false);
                    }
                }
            } else {
                alert("Não foi possível identificar lançamentos válidos no arquivo. Verifique se as colunas 'Data' e 'Valor' existem.");
            }
        }
    });
  };

  // ---------------- MEMBER VIEW (CONTRIBUIÇÃO) ----------------
  // Se não for admin, mostra apenas a tela de contribuição
  if (userRole !== 'admin') {
      return (
          <div className="space-y-6">
              {/* Debug Info (Only visible if something is wrong with role detection) */}
              {/* <div className="text-xs text-slate-400">Role detected: {userRole}</div> */}
              
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                  <h2 className="text-2xl font-bold mb-2">Minha Contribuição</h2>
                  <p className="opacity-90 max-w-xl">
                      "Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria." (2 Coríntios 9:7)
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PIX CARD */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                              <DollarSign className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Dízimos e Ofertas via Pix</h3>
                      </div>
                      
                      <div className="space-y-4">
                          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                              <div className="bg-white p-2 rounded-xl shadow-sm mb-3">
                                  <img 
                                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=adbeteltesouraria@gmail.com" 
                                      alt="QR Code Pix" 
                                      className="w-32 h-32 object-contain"
                                  />
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                                  Escaneie o QR Code com o app do seu banco
                              </p>
                          </div>

                          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Ou copie a Chave Pix (E-mail)</p>
                              <p className="text-lg font-mono font-bold text-slate-800 dark:text-white select-all">
                                  adbeteltesouraria@gmail.com
                              </p>
                          </div>
                          <button 
                            onClick={() => {
                                navigator.clipboard.writeText('adbeteltesouraria@gmail.com');
                                alert('Chave Pix copiada!');
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                          >
                              Copiar Chave Pix
                          </button>
                      </div>
                  </div>

                  {/* BANK ACCOUNT CARD */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                              <FileText className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transferência Bancária</h3>
                      </div>
                      
                      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                              <span>Banco:</span>
                              <span className="font-bold">Mercado Pago</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                              <span>Agência:</span>
                              <span className="font-bold">0001</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                              <span>Conta Corrente:</span>
                              <span className="font-bold">19693316026</span>
                          </div>
                          <div className="flex justify-between pt-1">
                              <span>Favorecido:</span>
                              <span className="font-bold">Igreja Evangelica Assembleia de Deus Betel</span>
                          </div>
                      </div>
                  </div>
              </div>
              
              {/* HISTÓRICO PESSOAL (SE HOUVER) */}
              <div className="mt-8">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-1">Meu Histórico de Contribuições</h3>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {/* Aqui filtraríamos as transações onde memberId == usuario atual. 
                          Como o backend RLS já filtra, podemos usar transactions direto se o fetch foi feito corretamente. 
                          Porém, no App.tsx o fetch de transactions é geral. Idealmente, para membros, deveríamos buscar apenas as suas.
                          Vamos assumir que transactions está vazio ou filtrado. Se vazio, mostra mensagem.
                      */}
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                          <p>Seu histórico de contribuições aparecerá aqui em breve.</p>
                          <p className="text-xs mt-1 opacity-70">Para recibos detalhados, procure a tesouraria.</p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="sticky top-0 md:top-[74px] z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm pb-4 pt-2 -mx-6 px-6 md:-mx-8 md:px-8 mb-4 border-b border-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tesouraria</h1>
          <p className="text-slate-500 dark:text-slate-400">Controle financeiro e lançamentos.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
             <button 
                onClick={handleExportPDF} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                title="Baixar Relatório em PDF"
            >
                <FileDown className="w-5 h-5" /> <span className="hidden sm:inline">Exportar PDF</span>
            </button>

            <button 
                onClick={() => setShowImportModal(true)} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                title="Importar de Excel/CSV"
            >
                <Upload className="w-5 h-5" /> <span className="hidden sm:inline">Importar</span>
            </button>

            <button 
                onClick={() => {
                    if (activeTab === 'transactions') {
                        setShowModal(true);
                    } else {
                        setPayableAmountInputValue('');
                        setNewPayable({
                            description: '',
                            category: 'Contas',
                            amount: 0,
                            dueDate: new Date().toISOString().split('T')[0],
                            status: 'Pendente',
                            hasInterest: false,
                            interestAmount: 0,
                            notes: ''
                        });
                        setShowPayableModal(true);
                    }
                }} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all"
            >
                <Plus className="w-5 h-5" /> {activeTab === 'transactions' ? 'Lançar Novo' : 'Nova Conta'}
            </button>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
          <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'transactions' 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
          >
              Lançamentos & Fluxo
          </button>
          <button
              onClick={() => setActiveTab('payables')}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'payables' 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
          >
              Contas a Pagar
          </button>
          <button
              onClick={() => setActiveTab('ministries')}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'ministries' 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
          >
              Caixa dos Ministérios
          </button>
      </div>

      {activeTab === 'transactions' ? (
        <>
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
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white uppercase"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value.toUpperCase())}
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
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ministério</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Forma Pagto.</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Valor</th>
                        {userRole === 'admin' && <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredTransactions.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                Nenhum lançamento encontrado com estes filtros.
                            </td>
                        </tr>
                    ) : (
                        filteredTransactions.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {t.date ? t.date.split('-').reverse().join('/') : '-'}
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
                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                {t.ministry || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{t.paymentMethod || '-'}</td>
                            <td className={`px-6 py-4 font-bold text-right ${t.type==='income'?'text-emerald-600 dark:text-emerald-400':'text-red-600 dark:text-red-400'}`}>
                                {privacyMode ? '****' : `R$ ${t.amount.toFixed(2)}`}
                            </td>
                            {userRole === 'admin' && (
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleEditTransaction(t)} className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20" title="Excluir">
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
        </>
      ) : (
        // --- ABA DE CONTAS A PAGAR ---
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Vencimento</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {payables.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                    Nenhuma conta a pagar cadastrada.
                                </td>
                            </tr>
                        ) : (
                            payables.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {p.dueDate.split('-').reverse().join('/')}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {p.description}
                                        {p.hasInterest && <span className="ml-2 text-xs text-red-500 font-normal">(Juros)</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs">
                                            {p.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                                        {privacyMode ? '****' : `R$ ${p.amount.toFixed(2)}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            p.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' :
                                            p.status === 'Atrasado' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        {p.status !== 'Pago' && (
                                            <button 
                                                onClick={() => markAsPaid(p)}
                                                className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition-colors"
                                                title="Marcar como Pago"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => {
                                                setNewPayable(p);
                                                setPayableAmountInputValue(p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                                                setShowPayableModal(true);
                                            }}
                                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                            title="Editar"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeletePayable(p.id)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                                            title="Excluir"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'ministries' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatsCard label="Total Entradas (Ministérios)" value={`R$ ${transactions.filter(t => t.ministry && t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} trend="" trendUp={true} icon={TrendingUp} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" />
                  <StatsCard label="Total Saídas (Ministérios)" value={`R$ ${transactions.filter(t => t.ministry && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} trend="" trendUp={false} icon={TrendingDown} color="text-red-600 bg-red-50 dark:bg-red-900/20" />
                  <StatsCard label="Saldo Total (Ministérios)" value={`R$ ${(transactions.filter(t => t.ministry && t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0) - transactions.filter(t => t.ministry && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} trend="" trendUp={true} icon={DollarSign} color="text-blue-600 bg-blue-50 dark:bg-blue-900/20" />
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                              <tr>
                                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ministério / Departamento</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Entradas</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Saídas</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Saldo</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {availableMinistries.map(ministry => {
                                  const minTxs = transactions.filter(t => t.ministry === ministry);
                                  const income = minTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
                                  const expense = minTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
                                  const balance = income - expense;

                                  if (minTxs.length === 0) return null; // Só mostra ministérios com movimentação

                                  return (
                                      <tr key={ministry} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                              {ministry}
                                          </td>
                                          <td className="px-6 py-4 font-bold text-right text-emerald-600 dark:text-emerald-400">
                                              {privacyMode ? '****' : `R$ ${income.toFixed(2)}`}
                                          </td>
                                          <td className="px-6 py-4 font-bold text-right text-red-600 dark:text-red-400">
                                              {privacyMode ? '****' : `R$ ${expense.toFixed(2)}`}
                                          </td>
                                          <td className={`px-6 py-4 font-bold text-right ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                              {privacyMode ? '****' : `R$ ${balance.toFixed(2)}`}
                                          </td>
                                      </tr>
                                  );
                              })}
                              {transactions.filter(t => t.ministry).length === 0 && (
                                  <tr>
                                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                          Nenhuma movimentação por ministério registrada.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL NOVA CONTA A PAGAR */}
      {showPayableModal && (
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">{newPayable.id ? 'Editar Conta' : 'Nova Conta a Pagar'}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Programe seus pagamentos.</p>
                    </div>
                    <button onClick={() => setShowPayableModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>
                
                <form onSubmit={handleSavePayable} className="overflow-y-auto p-6 space-y-5">
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                required
                                list="saved-descriptions"
                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase" 
                                value={newPayable.description} 
                                onChange={e => setNewPayable({...newPayable, description: e.target.value.toUpperCase()})} 
                                placeholder="Ex: Conta de Luz"
                            />
                            <button
                                type="button"
                                onClick={handleSaveDescription}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                title="Salvar Descrição"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <datalist id="saved-descriptions">
                            {savedDescriptions.map((desc, i) => (
                                <option key={i} value={desc} />
                            ))}
                        </datalist>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor (R$)</label>
                            <input 
                                type="text" 
                                required
                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={payableAmountInputValue} 
                                onChange={handlePayableAmountChange} 
                                placeholder="0,00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Vencimento</label>
                            <input 
                                type="date" 
                                required
                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newPayable.dueDate} 
                                onChange={e => setNewPayable({...newPayable, dueDate: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Categoria</label>
                        <select 
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newPayable.category} 
                            onChange={e => setNewPayable({...newPayable, category: e.target.value})}
                        >
                            <option value="Contas">Contas (Água/Luz/Net)</option>
                            <option value="Manutenção">Manutenção</option>
                            <option value="Prebendas">Prebendas</option>
                            <option value="Material">Material</option>
                            <option value="Eventos Saída">Eventos</option>
                            <option value="Outras Saídas">Outros</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="hasInterest"
                            checked={newPayable.hasInterest}
                            onChange={e => setNewPayable({...newPayable, hasInterest: e.target.checked})}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="hasInterest" className="text-sm text-slate-700 dark:text-slate-300">Teve Juros/Multa?</label>
                    </div>

                    {newPayable.hasInterest && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor dos Juros (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newPayable.interestAmount} 
                                onChange={e => setNewPayable({...newPayable, interestAmount: parseFloat(e.target.value)})} 
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Observações</label>
                        <textarea 
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase" 
                            rows={3}
                            value={newPayable.notes || ''} 
                            onChange={e => setNewPayable({...newPayable, notes: e.target.value.toUpperCase()})} 
                        />
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none flex justify-center items-center gap-2"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Conta'}
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* MODAL NOVO LANÇAMENTO */}
      {showModal && (
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">{newTransaction.id ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
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
                                className="w-full px-3 py-2.5 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                placeholder="Digite o nome da nova categoria"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value.toUpperCase())}
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

                    {/* MINISTÉRIO / DEPARTAMENTO */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Ministério / Departamento</label>
                        <select 
                            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTransaction.ministry || 'Geral / Sede'} 
                            onChange={e => setNewTransaction({...newTransaction, ministry: e.target.value})}
                        >
                            {availableMinistries.map(min => (
                                <option key={min} value={min}>{min}</option>
                            ))}
                        </select>
                    </div>

                    {/* SELEÇÃO DE MEMBRO (Apenas para Dízimos/Ofertas Nominais) */}
                    {((newTransaction.category === 'Dízimos' || newTransaction.category === 'Ofertas Nominais') && !isAddingNewCategory) && (
                        <div className="relative">
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> Selecionar Membro
                             </label>
                             
                             <input
                                type="text"
                                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                placeholder="Digite o nome do membro..."
                                value={memberSearchTerm}
                                onChange={e => {
                                    setMemberSearchTerm(e.target.value.toUpperCase());
                                    setShowMemberOptions(true);
                                    if (e.target.value === '') {
                                        setNewTransaction(prev => ({ ...prev, memberId: '' }));
                                    }
                                }}
                                onFocus={() => setShowMemberOptions(true)}
                             />

                             {showMemberOptions && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
                                                onClick={() => handleMemberSelect(m.id)}
                                            >
                                                {m.name} <span className="text-xs text-slate-400">({m.role})</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                                            Nenhum membro encontrado.
                                        </div>
                                    )}
                                </div>
                             )}
                             
                             {/* Overlay transparente para fechar ao clicar fora */}
                             {showMemberOptions && (
                                <div 
                                    className="fixed inset-0 z-0" 
                                    onClick={() => setShowMemberOptions(false)} 
                                    style={{ pointerEvents: 'auto', background: 'transparent' }}
                                />
                             )}
                        </div>
                    )}

                    {/* DESCRIÇÃO */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição Detalhada</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase" 
                                value={newTransaction.description || ''} 
                                onChange={e => setNewTransaction({...newTransaction, description: e.target.value.toUpperCase()})} 
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

      {/* MODAL IMPORTAÇÃO CSV */}
      {showImportModal && (
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                          <Upload className="w-6 h-6 text-blue-600" /> Importar Dados
                      </h3>
                      <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                  </div>

                  <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                          <h4 className="font-bold mb-2 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Instruções</h4>
                          <ul className="list-disc list-inside space-y-1 opacity-90">
                              <li>O arquivo deve ser formato <b>.csv</b></li>
                              <li>Colunas sugeridas: <b>Data, Descrição, Valor, Categoria, Tipo</b></li>
                              <li>O sistema tenta detectar colunas automaticamente.</li>
                              <li>Datas no formato: DD/MM/AAAA</li>
                          </ul>
                      </div>

                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-600 dark:text-slate-300 font-medium">Clique para selecionar o arquivo</p>
                          <p className="text-xs text-slate-400 mt-1">Planilhas do Excel ou Google Sheets (Salvar como .csv)</p>
                          <input 
                              type="file" 
                              accept=".csv"
                              ref={fileInputRef}
                              className="hidden"
                              onChange={handleFileUpload}
                          />
                      </div>
                      
                      {isSaving && (
                          <div className="flex items-center justify-center gap-2 text-blue-600 font-medium py-2">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              Processando importação...
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
