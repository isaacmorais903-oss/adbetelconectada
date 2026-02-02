import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Send, Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { Announcement, AnnouncementType } from '../types';
import { generateAnnouncementContent } from '../services/geminiService';
import { supabase, isConfigured } from '../services/supabaseClient';

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { 
    id: '1', 
    title: 'Culto da Família', 
    content: 'Neste domingo teremos um culto especial voltado para a bênção das famílias. Traga seus parentes e convidados para um tempo precioso de comunhão.', 
    type: AnnouncementType.EVENT, 
    date: '2023-10-25' 
  },
];

export const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    type: AnnouncementType.GENERAL
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  // Carrega Avisos
  useEffect(() => {
    if(isConfigured) {
      supabase.from('announcements').select('*').order('date', { ascending: false })
      .then(({ data }) => {
        if(data) setAnnouncements(data);
      });
    }
  }, []);

  const handleGenerateContent = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    const content = await generateAnnouncementContent(aiTopic, 'Acolhedor e inspirador');
    setNewAnnouncement(prev => ({ ...prev, content }));
    setIsGenerating(false);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    setIsSaving(true);

    try {
        const payload = {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: newAnnouncement.type || AnnouncementType.GENERAL,
          date: new Date().toISOString().split('T')[0]
        };

        if (isConfigured) {
            const { data, error } = await supabase.from('announcements').insert(payload).select();
            if(error) throw error;
            if(data) setAnnouncements([data[0], ...announcements]);
        } else {
             // Fallback
             const announcement = { ...payload, id: Math.random().toString(36).substr(2,9) };
             setAnnouncements([announcement, ...announcements]);
        }

        setNewAnnouncement({ title: '', content: '', type: AnnouncementType.GENERAL });
        setAiTopic('');
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar aviso.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Deseja excluir este aviso?')) return;
    try {
        if(isConfigured) {
            await supabase.from('announcements').delete().eq('id', id);
        }
        setAnnouncements(announcements.filter(a => a.id !== id));
    } catch(e) {
        console.error(e);
    }
  };

  const getTypeColor = (type: AnnouncementType) => {
    switch(type) {
      case AnnouncementType.URGENT: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50';
      case AnnouncementType.EVENT: return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-900/50';
      default: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50';
    }
  };

  const getTypeIcon = (type: AnnouncementType) => {
    switch(type) {
      case AnnouncementType.URGENT: return <AlertTriangle className="w-4 h-4" />;
      case AnnouncementType.EVENT: return <Calendar className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Create Announcement */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sticky top-6 transition-colors">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Novo Aviso
          </h2>
          
          <form onSubmit={handleAddAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
              <input 
                type="text" 
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newAnnouncement.title}
                onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                placeholder="Ex: Culto de Jovens"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newAnnouncement.type}
                onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value as AnnouncementType})}
              >
                <option value={AnnouncementType.GENERAL}>Geral</option>
                <option value={AnnouncementType.URGENT}>Urgente</option>
                <option value={AnnouncementType.EVENT}>Evento</option>
              </select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  IA Writer (Gemini)
                </label>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Descreva o tópico e deixe a IA escrever por você.</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-3 py-1.5 text-sm border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Convite para ceia..."
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !aiTopic}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? '...' : 'Gerar'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conteúdo</label>
              <textarea 
                required
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={newAnnouncement.content}
                onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                placeholder="Digite o aviso completo aqui..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-slate-900 dark:bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
            >
              {isSaving ? 'Publicando...' : 'Publicar Aviso'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: List */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mural de Avisos</h1>
          <p className="text-slate-500 dark:text-slate-400">Comunicados recentes e alertas para a congregação.</p>
        </div>

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
              <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Nenhum aviso publicado.</p>
            </div>
          ) : (
            announcements.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 relative group transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                    {item.type}
                  </div>
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{item.content}</p>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};