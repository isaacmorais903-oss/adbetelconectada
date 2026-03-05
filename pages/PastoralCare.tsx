import React, { useState, useEffect } from 'react';
import { supabase, isConfigured } from '../services/supabase';
import { UserRole, Member } from '../types';
import { Lock, Search, Plus, Calendar, Save, Trash2, User, FileText, AlertTriangle } from 'lucide-react';

interface PastoralCareProps {
    userRole: UserRole;
    currentUserEmail?: string;
    members: Member[];
}

interface CareRecord {
    id: string;
    member_id?: string; // Opcional, pode ser não-membro
    person_name: string; // Nome da pessoa atendida (se não for membro ou se quiser sobrescrever)
    date: string;
    subject: string; // Assunto: Orientação, Casamento, Disciplina, Visita, etc.
    notes: string; // Conteúdo confidencial
    status: 'Aberto' | 'Em Acompanhamento' | 'Concluído';
    is_private: boolean; // Reforço de segurança
    created_at?: string;
}

export const PastoralCare: React.FC<PastoralCareProps> = ({ userRole, currentUserEmail, members }) => {
    const [records, setRecords] = useState<CareRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<Partial<CareRecord>>({
        date: new Date().toISOString().split('T')[0],
        status: 'Aberto',
        is_private: true
    });
    const [isSaving, setIsSaving] = useState(false);

    // Verifica se é Pastor (Admin com email específico ou role 'pastor' se tivéssemos granularidade)
    // Por enquanto, vamos assumir que 'admin' tem acesso, mas idealmente seria só o Pastor Principal.
    // Vamos adicionar um aviso visual de confidencialidade.
    const isPastor = userRole === 'admin'; 

    useEffect(() => {
        if (isPastor && isConfigured) {
            fetchRecords();
        }
    }, [isPastor]);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('pastoral_care')
                .select('*')
                .order('date', { ascending: false });
            
            if (error) throw error;
            if (data) setRecords(data);
        } catch (error) {
            console.error("Erro ao buscar atendimentos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentRecord.person_name || !currentRecord.notes) return;
        
        setIsSaving(true);
        try {
            const payload = { ...currentRecord };
            
            // Se selecionou um membro, garante que o nome esteja sincronizado
            if (payload.member_id) {
                const member = members.find(m => m.id === payload.member_id);
                if (member) payload.person_name = member.name;
            }

            if (isConfigured) {
                const { data, error } = await supabase
                    .from('pastoral_care')
                    .upsert(payload)
                    .select();
                
                if (error) throw error;
                if (data) {
                    const saved = data[0];
                    setRecords(prev => {
                        const exists = prev.find(r => r.id === saved.id);
                        if (exists) return prev.map(r => r.id === saved.id ? saved : r);
                        return [saved, ...prev];
                    });
                }
            } else {
                // Demo Mode
                const newRecord = { ...payload, id: Math.random().toString(36).substr(2, 9) } as CareRecord;
                setRecords(prev => [newRecord, ...prev]);
            }
            setShowModal(false);
            setCurrentRecord({ date: new Date().toISOString().split('T')[0], status: 'Aberto', is_private: true });
        } catch (error: any) {
            alert("Erro ao salvar: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("CONFIDENCIAL: Tem certeza que deseja excluir este registro de atendimento? Esta ação é irreversível.")) return;
        
        try {
            if (isConfigured) {
                await supabase.from('pastoral_care').delete().eq('id', id);
            }
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    if (!isPastor) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <Lock className="w-16 h-16 mb-4 text-slate-300" />
                <h2 className="text-xl font-bold text-slate-600">Acesso Restrito</h2>
                <p>Este módulo é exclusivo para o atendimento pastoral.</p>
            </div>
        );
    }

    const filteredRecords = records.filter(r => 
        r.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                <div>
                    <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                        <User className="w-6 h-6" /> Gabinete Pastoral
                    </h1>
                    <p className="text-amber-700 dark:text-amber-300 text-sm flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Área Confidencial - Acesso exclusivo
                    </p>
                </div>
                <button 
                    onClick={() => {
                        setCurrentRecord({ date: new Date().toISOString().split('T')[0], status: 'Aberto', is_private: true });
                        setShowModal(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Novo Atendimento
                </button>
            </div>

            {/* Filtros */}
            <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou assunto..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-500 outline-none uppercase"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value.toUpperCase())}
                />
            </div>

            {/* Lista de Atendimentos */}
            <div className="grid grid-cols-1 gap-4">
                {filteredRecords.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum registro encontrado.</p>
                    </div>
                ) : (
                    filteredRecords.map(record => (
                        <div key={record.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        {record.person_name}
                                        {record.member_id && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Membro</span>}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                        <Calendar className="w-3 h-3" /> {new Date(record.date).toLocaleDateString('pt-BR')}
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className="font-medium text-amber-600 dark:text-amber-400">{record.subject}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                        record.status === 'Concluído' ? 'bg-green-100 text-green-700' : 
                                        record.status === 'Em Acompanhamento' ? 'bg-blue-100 text-blue-700' : 
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {record.status}
                                    </span>
                                    <button 
                                        onClick={() => {
                                            setCurrentRecord(record);
                                            setShowModal(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(record.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-serif">
                                    {record.notes}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Edição/Criação */}
            {showModal && (
                <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 rounded-t-2xl">
                            <div>
                                <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                                    <Lock className="w-5 h-5" /> Registro Pastoral
                                </h3>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">As informações aqui são estritamente confidenciais.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data do Atendimento</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={currentRecord.date}
                                        onChange={e => setCurrentRecord({...currentRecord, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select 
                                        className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={currentRecord.status}
                                        onChange={e => setCurrentRecord({...currentRecord, status: e.target.value as any})}
                                    >
                                        <option value="Aberto">Aberto</option>
                                        <option value="Em Acompanhamento">Em Acompanhamento</option>
                                        <option value="Concluído">Concluído</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pessoa Atendida</label>
                                <div className="flex gap-2 mb-2">
                                    <select 
                                        className="flex-1 p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        onChange={e => {
                                            const memberId = e.target.value;
                                            const member = members.find(m => m.id === memberId);
                                            if (member) {
                                                setCurrentRecord({
                                                    ...currentRecord, 
                                                    member_id: memberId, 
                                                    person_name: member.name
                                                });
                                            } else {
                                                setCurrentRecord({...currentRecord, member_id: '', person_name: ''});
                                            }
                                        }}
                                        value={currentRecord.member_id || ''}
                                    >
                                        <option value="">-- Selecionar Membro (Opcional) --</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Ou digite o nome (se não for membro)"
                                    className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white uppercase"
                                    value={currentRecord.person_name || ''}
                                    onChange={e => setCurrentRecord({...currentRecord, person_name: e.target.value.toUpperCase(), member_id: undefined})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assunto / Tema</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Aconselhamento Conjugal, Disciplina, Visita..."
                                    className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white uppercase"
                                    value={currentRecord.subject || ''}
                                    onChange={e => setCurrentRecord({...currentRecord, subject: e.target.value.toUpperCase()})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anotações Confidenciais</label>
                                <textarea 
                                    rows={8}
                                    placeholder="Descreva os detalhes do atendimento..."
                                    className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-serif leading-relaxed uppercase"
                                    value={currentRecord.notes || ''}
                                    onChange={e => setCurrentRecord({...currentRecord, notes: e.target.value.toUpperCase()})}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg shadow-amber-200 dark:shadow-none transition-colors flex justify-center items-center gap-2"
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar Registro'} <Save className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Icon helper
function X(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 18 18" />
      </svg>
    )
  }
