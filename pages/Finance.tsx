
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Filter, Download, CreditCard, QrCode, History, Plus, X, Calendar, Search, Copy, Check, ExternalLink, Shield, ChevronDown, User, Upload } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { StatsCard } from '../components/StatsCard';
import { Transaction, UserRole, Member } from '../types';
import { generateFinancialReport } from '../services/pdfService';

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
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterCategory, setFilterCategory] = useState<string>('all'); 
  
  const [showModal, setShowModal] = useState(false);
  const [amountInputValue, setAmountInputValue] = useState(''); // Estado local para a máscara de input
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    category: 'Dízimos',
    paymentMethod: 'Pix'
  });

  // Import CSV Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Categorias Dinâmicas
  const [incomeCategories, setIncomeCategories] = useState<string[]>(['Dízimos', 'Ofertas', 'Missões', 'Cantina', 'Outros']);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(['Utilidades', 'Aluguel', 'Manutenção', 'Ajuda de Custo', 'Departamento']);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Estados para Busca de Membros
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setShowMemberDropdown(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        const tDate = t.date.substring(0, 7);
        const matchDate = filterMonth ? tDate === filterMonth : true;

        let matchCategory = true;
        if (filterCategory === 'all') matchCategory = true;
        else if (filterCategory === 'income') matchCategory = t.type === 'income';
        else if (filterCategory === 'expense') matchCategory = t.type === 'expense';
        else matchCategory = t.category === filterCategory;

        return matchDate && matchCategory;
    });
  }, [transactions, filterMonth, filterCategory]);

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

  const filteredMembers = useMemo(() => {
    if (!memberSearchTerm) return members;
    return members.filter(m => 
        m.name.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );
  }, [members, memberSearchTerm]);

  const formatValue = (value: number) => {
    if (privacyMode) return '••••••';
    return `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  };

  // Função para tratar a mudança no input de valor com máscara
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
      
      if (!rawValue) {
          setAmountInputValue('');
          setNewTransaction({...newTransaction, amount: 0});
          return;
      }

      const amountNumber = parseFloat(rawValue) / 100;
      const formatted = amountNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      setAmountInputValue(formatted);
      setNewTransaction({...newTransaction, amount: amountNumber});
  };

  const handleMemberSelect = (member: Member) => {
    setMemberSearchTerm(member.name);
    setNewTransaction(prev => ({
        ...prev,
        memberId: member.id,
        description: `Dízimo - ${member.name}`
    }));
    setShowMemberDropdown(false);
  }

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) return;

    if (newTransaction.type === 'income') {
        setIncomeCategories([...incomeCategories, newCategoryName]);
    } else {
        setExpenseCategories([...expenseCategories, newCategoryName]);
    }

    setNewTransaction({...newTransaction, category: newCategoryName});
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTransaction.amount || !newTransaction.description) return;

    const transaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        amount: Number(newTransaction.amount),
        description: newTransaction.description || '',
        category: newTransaction.category || 'Outros',
        date: newTransaction.date || new Date().toISOString().split('T')[0],
        type: newTransaction.type as 'income' | 'expense',
        paymentMethod: newTransaction.paymentMethod as any || 'Outros',
        memberId: newTransaction.memberId
    };

    setTransactions([transaction, ...transactions]);
    setShowModal(false);
    
    // Reset form
    setAmountInputValue('');
    setMemberSearchTerm('');
    setNewTransaction({
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        category: 'Dízimos',
        paymentMethod: 'Pix',
        amount: undefined,
        description: '',
        memberId: undefined
    });
  };

  // --- CSV IMPORT LOGIC ---
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const text = event.target?.result as string;
              if (!text) return;

              // Detect delimiter (comma or semicolon) based on first line
              const firstLine = text.split('\n')[0];
              const delimiter = firstLine.includes(';') ? ';' : ',';

              const rows = text.split('\n');
              // Remove header
              const header = rows.shift()?.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
              
              if(!header) return;

              // Map column indexes based on header names (flexible matching)
              const idxDesc = header.findIndex(h => h.includes('desc') || h.includes('historico'));
              const idxVal = header.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('quantia'));
              const idxDate = header.findIndex(h => h.includes('data') || h.includes('date'));
              const idxCat = header.findIndex(h => h.includes('cat') || h.includes('class')); // Categoria
              const idxType = header.findIndex(h => h.includes('tipo') || h.includes('type'));
              const idxMethod = header.findIndex(h => h.includes('forma') || h.includes('pagamento') || h.includes('method'));

              const importedTransactions: Transaction[] = [];

              rows.forEach(rowStr => {
                  if (!rowStr.trim()) return;
                  
                  // Handle quotes properly if needed, but simple split for now for simplicity
                  // A robust regex split would be: rowStr.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                  // For now, simple split assuming standard CSV export without complex escaped delimiters
                  const cols = rowStr.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));

                  if (cols.length < 3) return; // Skip invalid rows

                  // 1. Description
                  const description = idxDesc >= 0 ? cols[idxDesc] : 'Importado via CSV';
                  if(!description) return;

                  // 2. Amount (Parse R$ 1.000,00 or 1000.00)
                  let amountStr = idxVal >= 0 ? cols[idxVal] : '0';
                  // Remove symbols e.g. "R$"
                  amountStr = amountStr.replace(/[^\d.,-]/g, '');
                  // If format is 1.000,00 (Brazilian), swap dots and commas
                  if (amountStr.includes(',') && amountStr.indexOf('.') < amountStr.indexOf(',')) {
                      amountStr = amountStr.replace(/\./g, '').replace(',', '.');
                  } else if (amountStr.includes(',')) {
                      // Case 1000,00 without thousands separator
                       amountStr = amountStr.replace(',', '.');
                  }
                  const amount = Math.abs(parseFloat(amountStr)); // Store absolute, type defines sign

                  // 3. Date (Parse DD/MM/YYYY or YYYY-MM-DD)
                  let dateStr = idxDate >= 0 ? cols[idxDate] : new Date().toISOString().split('T')[0];
                  if (dateStr.includes('/')) {
                      const parts = dateStr.split('/');
                      if (parts.length === 3) {
                          // Assume DD/MM/YYYY
                          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                      }
                  }
                  // Validate date
                  if(isNaN(Date.parse(dateStr))) dateStr = new Date().toISOString().split('T')[0];

                  // 4. Type (Income/Expense detection)
                  let type: 'income' | 'expense' = 'expense';
                  if (idxType >= 0) {
                      const tVal = cols[idxType].toLowerCase();
                      if (tVal.includes('entrada') || tVal.includes('receita') || tVal.includes('crédito') || tVal.includes('income')) {
                          type = 'income';
                      }
                  } else {
                      // Fallback: try to guess from category or amount sign if originally present
                      // Since we did Math.abs above, we rely on user input or defaults
                  }
                  
                  // 5. Category
                  const category = idxCat >= 0 && cols[idxCat] ? cols[idxCat] : (type === 'income' ? 'Outros' : 'Outros');

                  // 6. Method
                  const methodStr = idxMethod >= 0 ? cols[idxMethod] : 'Outros';
                  let paymentMethod: any = 'Outros';
                  if(methodStr.toLowerCase().includes('pix')) paymentMethod = 'Pix';
                  else if(methodStr.toLowerCase().includes('dinheiro')) paymentMethod = 'Dinheiro';
                  else if(methodStr.toLowerCase().includes('cart')) paymentMethod = 'Cartão';

                  importedTransactions.push({
                      id: Math.random().toString(36).substr(2, 9),
                      description,
                      amount,
                      type,
                      category,
                      date: dateStr,
                      paymentMethod
                  });
              });

              if (importedTransactions.length > 0) {
                  if(confirm(`Identificamos ${importedTransactions.length} transações. Deseja importar?\n\nIsso adicionará os registros à sua lista atual.`)) {
                      setTransactions(prev => [...importedTransactions, ...prev]);
                      alert("Importação concluída com sucesso!");
                  }
              } else {
                  alert("Não foi possível ler as transações. Verifique se o CSV tem cabeçalhos como 'Descrição', 'Valor' e 'Data'.");
              }

          } catch (error) {
              console.error(error);
              alert("Erro ao processar o arquivo. Certifique-se que é um CSV válido.");
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

  const initiatePayment = (method: 'pix' | 'card') => {
      if (!donationAmount || Number(donationAmount) <= 0) {
          alert("Por favor, insira um valor válido.");
          return;
      }
      setPaymentMethod(method);
      setShowPaymentModal(true);
      setCopiedPix(false);
  };

  const handleCopyPix = () => {
      navigator.clipboard.writeText("00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913Igreja ADBetel6009SAO PAULO62070503***6304E6CA");
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
  };

  if (userRole === 'member') {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contribuições</h1>
                <p className="text-slate-500 dark:text-slate-400">"Cada um contribua segundo propôs no seu coração." - 2 Co 9:7</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                            <input 
                                type="number" 
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                                placeholder="0,00" 
                                className="w-full text-3xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 border-b-2 border-slate-200 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none py-2 bg-transparent" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => initiatePayment('pix')}
                                className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                            >
                                <QrCode className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-2" />
                                <span className="font-bold text-slate-700 dark:text-slate-300">PIX</span>
                            </button>
                            <button 
                                onClick={() => initiatePayment('card')}
                                className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                            >
                                <CreditCard className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2" />
                                <span className="font-bold text-slate-700 dark:text-slate-300">Cartão</span>
                            </button>
                        </div>
                    </div>
                </div>

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
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{privacyMode ? '****' : `+ R$ ${t.amount.toFixed(2)}`}</span>
                             </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Ver todo o histórico</button>
                </div>
            </div>

            {showPaymentModal && (
                <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                        <div className="flex justify-end">
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        {paymentMethod === 'pix' ? (
                            <div className="space-y-6">
                                <div>
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <QrCode className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pagamento via PIX</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Escaneie o código abaixo para pagar <br/> <span className="font-bold text-slate-800 dark:text-white">R$ {parseFloat(donationAmount).toFixed(2)}</span></p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border-2 border-slate-100 dark:border-slate-600 inline-block">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913Igreja ADBetel6009SAO PAULO62070503***6304E6CA" alt="QR Code PIX" className="w-40 h-40 mix-blend-multiply dark:mix-blend-normal" />
                                </div>
                                <button onClick={handleCopyPix} className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                    {copiedPix ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    {copiedPix ? 'Código Copiado!' : 'Copiar Código PIX'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CreditCard className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pagamento via Cartão</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Você será redirecionado para o ambiente seguro do nosso processador de pagamentos.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-left">
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Resumo</p>
                                        <div className="flex justify-between font-medium text-slate-800 dark:text-white">
                                            <span>{contributionType === 'dizimo' ? 'Dízimo' : 'Oferta'}</span>
                                            <span>R$ {parseFloat(donationAmount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                        Ir para Pagamento
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
  }

  // --------------- ADMIN VIEW (MANAGEMENT) ---------------
  return (
    <div className="space-y-8">
      <div className="sticky top-0 md:top-[74px] z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm pb-4 pt-2 -mx-6 px-6 md:-mx-8 md:px-8 mb-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-transparent">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tesouraria</h1>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              Gestão financeira, dízimos, ofertas e despesas.
              {privacyMode && (
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <Shield className="w-3 h-3" />
                      Privacidade Ativa
                  </span>
              )}
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors"
                title="Importar planilha (CSV)"
            >
                <Upload className="w-4 h-4" />
                Importar CSV
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImportCSV}
                    className="hidden" 
                    accept=".csv"
                />
            </button>
            
            <button 
                onClick={() => generateFinancialReport(filteredTransactions)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
            label="Entradas (Filtro)" 
            value={formatValue(stats.income)}
            trend="Período selecionado" 
            trendUp={true} 
            icon={TrendingUp} 
            color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" 
        />
        <StatsCard 
            label="Saídas (Filtro)" 
            value={formatValue(stats.expense)}
            trend="Período selecionado" 
            trendUp={false} 
            icon={TrendingDown} 
            color="text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400" 
        />
        <StatsCard 
            label="Saldo (Filtro)" 
            value={formatValue(stats.balance)}
            trend={stats.balance >= 0 ? "Positivo" : "Negativo"} 
            trendUp={stats.balance >= 0} 
            icon={DollarSign} 
            color="text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" 
        />
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors relative">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Fluxo de Caixa (Anual)</h3>
            <span className="text-xs text-slate-400">* O gráfico mostra visão anual geral</span>
        </div>
        
        {privacyMode && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <Shield className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">Visualização Protegida</p>
                </div>
            </div>
        )}

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
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Forma</th>
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
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {t.paymentMethod || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {privacyMode ? '****' : (t.type === 'income' ? '+' : '-') + ' R$ ' + t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
              ) : (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma transação encontrada para este filtro.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transition-colors flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nova Transação</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSaveTransaction} className="space-y-4 overflow-y-auto pr-1">
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
                            type="text" 
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={amountInputValue}
                            onChange={handleAmountChange}
                            placeholder="0,00"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
                            {!isAddingCategory && (
                                <button 
                                    type="button"
                                    onClick={() => setIsAddingCategory(true)}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Nova Categoria
                                </button>
                            )}
                        </div>
                        
                        {isAddingCategory ? (
                            <div className="flex gap-2 animate-in fade-in zoom-in duration-200">
                                <input 
                                    type="text"
                                    autoFocus
                                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder={`Nova categoria de ${newTransaction.type === 'income' ? 'receita' : 'despesa'}...`}
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={handleSaveCategory}
                                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    title="Salvar Categoria"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsAddingCategory(false);
                                        setNewCategoryName('');
                                    }}
                                    className="p-2 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                    title="Cancelar"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <select 
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={newTransaction.category}
                                onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                            >
                                {(newTransaction.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* SELETOR DE MEMBRO COM BUSCA */}
                    {newTransaction.category === 'Dízimos' && (
                        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600 relative" ref={dropdownRef}>
                             <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
                                <Search className="w-3 h-3" />
                                Selecionar Membro (Digite para buscar)
                             </label>
                             <div className="relative">
                                <input 
                                    type="text"
                                    className="w-full pl-3 pr-8 py-2 border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Digite o nome..."
                                    value={memberSearchTerm}
                                    onChange={(e) => {
                                        setMemberSearchTerm(e.target.value);
                                        setShowMemberDropdown(true);
                                        if(e.target.value === '') {
                                             setNewTransaction(prev => ({...prev, memberId: undefined}));
                                        }
                                    }}
                                    onFocus={() => setShowMemberDropdown(true)}
                                />
                                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                             </div>

                             {showMemberDropdown && (
                                 <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                     {filteredMembers.length > 0 ? (
                                         filteredMembers.map(member => (
                                             <div 
                                                key={member.id} 
                                                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                                                onClick={() => handleMemberSelect(member)}
                                             >
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0 text-xs">
                                                    {member.photoUrl ? (
                                                        <img src={member.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User className="w-3 h-3" />
                                                    )}
                                                </div>
                                                {member.name}
                                             </div>
                                         ))
                                     ) : (
                                         <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                                             Nenhum membro encontrado.
                                         </div>
                                     )}
                                 </div>
                             )}
                             <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                Ao selecionar, a descrição será preenchida automaticamente.
                             </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Forma de Recebimento</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={newTransaction.paymentMethod}
                            onChange={e => setNewTransaction({...newTransaction, paymentMethod: e.target.value as any})}
                        >
                            <option value="Pix">Pix</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Cartão">Cartão</option>
                            <option value="Outros">Outros</option>
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
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none mt-4 shrink-0"
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
