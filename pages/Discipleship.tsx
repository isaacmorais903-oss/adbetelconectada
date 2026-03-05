
import React, { useState, useEffect } from 'react';
import { Sprout, Phone, Calendar, User, BookOpen, CheckCircle, ArrowRight, MessageSquare, Clock, X, Send, PlusCircle } from 'lucide-react';
import { Member, FollowUpStage, MemberNote } from '../types';
import { supabase, isConfigured } from '../services/supabase';

interface DiscipleshipProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  currentUserEmail?: string;
}

const STAGES: FollowUpStage[] = ['Novo', 'Contato Feito', 'Visita Agendada', 'Em Discipulado', 'Pronto para Batismo', 'Integrado'];

export const Discipleship: React.FC<DiscipleshipProps> = ({ members, setMembers, currentUserEmail }) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [notes, setNotes] = useState<MemberNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Filtra membros que são visitantes OU que já têm algum estágio de acompanhamento definido
  const visitorsAndConverts = members.filter(m => m.status === 'Visitante' || m.followupStage);

  // Carrega notas ao selecionar um membro
  useEffect(() => {
    if (selectedMember && isConfigured) {
      setLoadingNotes(true);
      supabase.from('member_notes')
        .select('*')
        .eq('memberId', selectedMember.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setNotes(data.map((n:any) => ({
             id: n.id,
             memberId: n.memberId,
             content: n.content,
             author: n.author,
             createdAt: n.created_at
          })));
          setLoadingNotes(false);
        });
    } else {
        setNotes([]);
    }
  }, [selectedMember]);

  const handleUpdateStage = async (memberId: string, newStage: FollowUpStage) => {
      // Atualiza localmente
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, followupStage: newStage } : m));
      if (selectedMember && selectedMember.id === memberId) {
          setSelectedMember(prev => prev ? { ...prev, followupStage: newStage } : null);
      }

      // Atualiza no banco
      if (isConfigured) {
          await supabase.from('members').update({ followupStage: newStage }).eq('id', memberId);
          
          // Adiciona nota automática de mudança de estágio
          const systemNote = `Mudança de estágio para: ${newStage}`;
          await supabase.from('member_notes').insert({
              memberId,
              content: systemNote,
              author: 'Sistema'
          });
      }
  };

  const handleAddNote = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newNote.trim() || !selectedMember) return;
      setSavingNote(true);

      const notePayload = {
          memberId: selectedMember.id,
          content: newNote,
          author: currentUserEmail || 'Admin'
      };

      if (isConfigured) {
          const { data } = await supabase.from('member_notes').insert(notePayload).select();
          if (data) {
              const createdNote = {
                  id: data[0].id,
                  memberId: data[0].memberId,
                  content: data[0].content,
                  author: data[0].author,
                  createdAt: data[0].created_at
              };
              setNotes([createdNote, ...notes]);
          }
      } else {
          // Fallback offline
          const fakeNote: MemberNote = {
              id: Math.random().toString(),
              memberId: selectedMember.id,
              content: newNote,
              author: currentUserEmail || 'Admin',
              createdAt: new Date().toISOString()
          };
          setNotes([fakeNote, ...notes]);
      }
      
      setNewNote('');
      setSavingNote(false);
  };

  const getStageColor = (stage?: FollowUpStage) => {
      switch(stage) {
          case 'Novo': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Contato Feito': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
          case 'Visita Agendada': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'Em Discipulado': return 'bg-amber-100 text-amber-700 border-amber-200';
          case 'Pronto para Batismo': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'Integrado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          default: return 'bg-slate-100 text-slate-600 border-slate-200';
      }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sprout className="w-8 h-8 text-green-600" />
              Jornada do Discipulado
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Acompanhamento de visitantes e novos convertidos.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          
          {/* LISTA DE PESSOAS (Left Column) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">Em Acompanhamento</h3>
                  <p className="text-xs text-slate-400">{visitorsAndConverts.length} pessoas listadas</p>
              </div>
              <div className="overflow-y-auto p-2 space-y-2 flex-1">
                  {visitorsAndConverts.length === 0 ? (
                      <div className="text-center p-8 text-slate-400">
                          <p>Nenhum visitante ou discipulando encontrado.</p>
                          <p className="text-xs mt-2">Cadastre membros com status "Visitante" para vê-los aqui.</p>
                      </div>
                  ) : (
                      visitorsAndConverts.map(m => (
                          <div 
                            key={m.id}
                            onClick={() => setSelectedMember(m)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                selectedMember?.id === m.id 
                                ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500 ring-1 ring-blue-500' 
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-blue-300'
                            }`}
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-slate-800 dark:text-white truncate">{m.name}</h4>
                                  {m.status === 'Visitante' && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded-full font-bold">Visitante</span>
                                  )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                   <span className={`text-[10px] px-2 py-1 rounded-full font-semibold border ${getStageColor(m.followupStage || 'Novo')}`}>
                                       {m.followupStage || 'Novo'}
                                   </span>
                                   <div className="flex items-center gap-1 text-slate-400 text-xs">
                                       <Clock className="w-3 h-3" />
                                       <span>{new Date(m.joinedAt).toLocaleDateString('pt-BR')}</span>
                                   </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* DETALHES E AÇÕES (Right Columns) */}
          <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
              {selectedMember ? (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden">
                      
                      {/* Header do Membro */}
                      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                                  {selectedMember.photoUrl ? (
                                      <img src={selectedMember.photoUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                      <User className="w-full h-full p-3 text-slate-400" />
                                  )}
                              </div>
                              <div>
                                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedMember.name}</h2>
                                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                                      <Phone className="w-3 h-3" /> {selectedMember.phone}
                                  </p>
                              </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-slate-400 uppercase mb-1">Fase Atual</span>
                              <div className="relative group">
                                  <select 
                                      value={selectedMember.followupStage || 'Novo'}
                                      onChange={(e) => handleUpdateStage(selectedMember.id, e.target.value as FollowUpStage)}
                                      className={`appearance-none pl-4 pr-8 py-2 rounded-lg font-bold text-sm cursor-pointer border focus:ring-2 focus:ring-offset-1 transition-all ${getStageColor(selectedMember.followupStage || 'Novo')}`}
                                  >
                                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <ArrowRight className="w-4 h-4 absolute right-2 top-2.5 opacity-50 pointer-events-none" />
                              </div>
                          </div>
                      </div>

                      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                          
                          {/* Coluna 1: Régua Visual */}
                          <div className="md:w-1/3 p-6 border-r border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 overflow-y-auto">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Progresso</h4>
                              <div className="space-y-0 relative">
                                  {/* Linha vertical conectora */}
                                  <div className="absolute left-3.5 top-2 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700 z-0"></div>

                                  {STAGES.map((step, idx) => {
                                      const currentIdx = STAGES.indexOf(selectedMember.followupStage || 'Novo');
                                      const isCompleted = idx <= currentIdx;
                                      const isCurrent = idx === currentIdx;

                                      return (
                                          <div 
                                            key={step} 
                                            onClick={() => handleUpdateStage(selectedMember.id, step)}
                                            className={`relative z-10 flex items-center gap-3 py-3 cursor-pointer group ${isCurrent ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'}`}
                                          >
                                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-300'}
                                                  ${isCurrent ? 'ring-4 ring-green-100 dark:ring-green-900/30 scale-110' : ''}
                                              `}>
                                                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                              </div>
                                              <span className={`text-sm font-medium transition-colors ${isCurrent ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600'}`}>
                                                  {step}
                                              </span>
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>

                          {/* Coluna 2: Histórico e Notas */}
                          <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 p-6 overflow-hidden">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4" /> Histórico de Acompanhamento
                              </h4>
                              
                              {/* Lista de Notas */}
                              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
                                  {loadingNotes ? (
                                      <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>
                                  ) : notes.length === 0 ? (
                                      <div className="text-center py-10 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                          <p>Nenhuma anotação registrada.</p>
                                          <p className="text-xs">Registre conversas, pedidos de oração ou observações.</p>
                                      </div>
                                  ) : (
                                      notes.map(note => (
                                          <div key={note.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                              <div className="mt-1">
                                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                      {note.author?.charAt(0).toUpperCase()}
                                                  </div>
                                              </div>
                                              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg rounded-tl-none border border-slate-100 dark:border-slate-700 flex-1">
                                                  <div className="flex justify-between items-start mb-1">
                                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{note.author || 'Sistema'}</span>
                                                      <span className="text-[10px] text-slate-400">{new Date(note.createdAt).toLocaleString('pt-BR')}</span>
                                                  </div>
                                                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                                              </div>
                                          </div>
                                      ))
                                  )}
                              </div>

                              {/* Input Nova Nota */}
                              <form onSubmit={handleAddNote} className="mt-auto relative">
                                  <textarea
                                      rows={2}
                                      className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm dark:text-white uppercase"
                                      placeholder="Adicionar nova observação..."
                                      value={newNote}
                                      onChange={e => setNewNote(e.target.value.toUpperCase())}
                                      onKeyDown={e => {
                                          if(e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              handleAddNote(e);
                                          }
                                      }}
                                  ></textarea>
                                  <button 
                                    type="submit" 
                                    disabled={!newNote.trim() || savingNote}
                                    className="absolute right-2 bottom-2.5 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 transition-colors"
                                  >
                                      <Send className="w-4 h-4" />
                                  </button>
                              </form>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
                          <Sprout className="w-12 h-12 text-green-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Selecione um membro</h3>
                      <p className="max-w-xs text-center text-sm mt-2">Clique em um nome na lista ao lado para ver o progresso do discipulado e adicionar notas.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
