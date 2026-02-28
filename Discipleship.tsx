import React, { useState, useEffect } from 'react';
import { HeartHandshake, Plus, MessageCircle, Lock, Globe, CheckCircle } from 'lucide-react';
import { PrayerRequest } from '../types';
import { supabase, isConfigured } from '../services/supabaseClient';

const INITIAL_PRAYERS: PrayerRequest[] = [
  { id: '1', requesterName: 'Maria José', request: 'Pela saúde do meu esposo que fará cirurgia.', date: '2023-10-25', status: 'Em Oração', isPrivate: false },
];

export const Prayers: React.FC = () => {
  const [prayers, setPrayers] = useState<PrayerRequest[]>(INITIAL_PRAYERS);
  const [showModal, setShowModal] = useState(false);
  const [newPrayer, setNewPrayer] = useState({ requesterName: '', request: '', isPrivate: false });
  const [isSaving, setIsSaving] = useState(false);

  // Carregar Orações
  useEffect(() => {
      if(isConfigured) {
          supabase.from('prayer_requests').select('*').order('date', {ascending: false})
          .then(({data}) => {
              if(data) setPrayers(data);
          });
      }
  }, []);

  const handleAddPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newPrayer.request) return;
    setIsSaving(true);
    
    try {
        const payload = {
          requesterName: newPrayer.requesterName || 'Anônimo',
          request: newPrayer.request,
          date: new Date().toISOString().split('T')[0],
          status: 'Novo',
          isPrivate: newPrayer.isPrivate
        };

        if(isConfigured) {
            const { data, error } = await supabase.from('prayer_requests').insert(payload).select();
            if(error) throw error;
            if(data) setPrayers([data[0], ...prayers]);
        } else {
             // Fallback
             const prayer = { ...payload, id: Math.random().toString() };
             setPrayers([prayer as PrayerRequest, ...prayers]);
        }
        
        setShowModal(false);
        setNewPrayer({ requesterName: '', request: '', isPrivate: false });
    } catch(error) {
        console.error(error);
        alert('Erro ao enviar oração.');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pedidos de Oração</h1>
          <p className="text-slate-500 dark:text-slate-400">Clamor e intercessão pela igreja.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-200 dark:shadow-none font-medium"
        >
          <Plus className="w-5 h-5" />
          Fazer Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prayers.map((prayer) => (
            <div key={prayer.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                         <div className={`p-2 rounded-full ${prayer.isPrivate ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'}`}>
                            {prayer.isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{prayer.isPrivate ? 'Anônimo' : prayer.requesterName}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(prayer.date).toLocaleDateString('pt-BR')}</p>
                         </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold 
                        ${prayer.status === 'Novo' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}
                        ${prayer.status === 'Em Oração' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
                        ${prayer.status === 'Respondido' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                    `}>
                        {prayer.status}
                    </span>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1 italic relative pl-4 border-l-2 border-blue-100 dark:border-blue-800">
                    "{prayer.request}"
                </p>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <button className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        Comentar
                    </button>
                    <button className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
                        <HeartHandshake className="w-4 h-4" />
                        Orar
                    </button>
                </div>
            </div>
        ))}
      </div>

      {showModal && (
          // ALTERADO: Adicionado md:left-72
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 transition-colors">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Novo Pedido de Oração</h3>
                <form onSubmit={handleAddPrayer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Seu Nome (Opcional)</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newPrayer.requesterName}
                            onChange={e => setNewPrayer({...newPrayer, requesterName: e.target.value})}
                            placeholder="Deixe em branco para anônimo"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo da Oração</label>
                        <textarea 
                            required
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            value={newPrayer.request}
                            onChange={e => setNewPrayer({...newPrayer, request: e.target.value})}
                            placeholder="Descreva seu pedido..."
                        ></textarea>
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="private"
                            checked={newPrayer.isPrivate}
                            onChange={e => setNewPrayer({...newPrayer, isPrivate: e.target.checked})}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="private" className="text-sm text-slate-600 dark:text-slate-300">Pedido Confidencial (Apenas pastores)</label>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button 
                        type="button" 
                        onClick={() => setShowModal(false)}
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                        Cancelar
                        </button>
                        <button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                        {isSaving ? 'Enviando...' : 'Enviar Pedido'}
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};