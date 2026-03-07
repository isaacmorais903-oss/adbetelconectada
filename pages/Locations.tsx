
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Plus, Trash2, Building2, Camera, Upload, Link as LinkIcon, Edit2 } from 'lucide-react';
import { Location } from '../types';
import { supabase, isConfigured } from '../services/supabase';

// Dados iniciais para fallback offline
const INITIAL_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Sede Principal',
    type: 'Sede',
    address: 'Av. das Nações, 1000 - Centro',
    city: 'São Paulo - SP',
    serviceTimes: 'Dom: 18h | Qua: 20h',
    mapUrl: 'https://www.google.com/maps',
    imageUrl: 'https://images.unsplash.com/photo-1548625361-ec8fdea2f992?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' // Exemplo
  }
];

const sortLocations = (locations: Location[]): Location[] => {
  return [...locations].sort((a, b) => {
    // 1. Sede sempre primeiro
    if (a.type === 'Sede' && b.type !== 'Sede') return -1;
    if (a.type !== 'Sede' && b.type === 'Sede') return 1;

    // 2. Congregações em segundo (prioridade sobre outros tipos)
    if (a.type === 'Congregação' && b.type !== 'Congregação') return -1;
    if (a.type !== 'Congregação' && b.type === 'Congregação') return 1;

    // 3. Extrair números do nome para ordenação
    const getNumber = (str: string) => {
      const match = str.match(/(\d+)/);
      return match ? parseInt(match[0], 10) : 999999;
    };

    const numA = getNumber(a.name);
    const numB = getNumber(b.name);

    if (numA !== numB) return numA - numB;
    
    // 4. Desempate alfabético
    return a.name.localeCompare(b.name);
  });
};

import { UserRole } from '../types';

interface LocationsProps {
  userRole?: UserRole;
}

export const Locations: React.FC<LocationsProps> = ({ userRole }) => {
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
      type: 'Congregação',
      city: 'São Paulo - SP',
      serviceTimes: 'Dom: 19h | Qui: 20h',
      imageUrl: '',
      mapUrl: ''
  });

  useEffect(() => {
    if(isConfigured) {
        supabase.from('locations').select('*')
        .then(({ data, error }) => {
            if (error) {
                console.error("Erro ao carregar locais:", error);
            } else if (data) {
                // Se conectou com sucesso, usa os dados do banco (mesmo que vazio, removendo o mock)
                setLocations(sortLocations(data));
            }
        });
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLocation(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
      setIsEditing(false);
      setNewLocation({
          type: 'Congregação',
          city: 'São Paulo - SP',
          serviceTimes: 'Dom: 19h | Qui: 20h',
          imageUrl: '',
          mapUrl: '',
          name: '',
          address: ''
      });
      setShowModal(true);
  };

  const openEditModal = (loc: Location) => {
      setIsEditing(true);
      setNewLocation({ ...loc });
      setShowModal(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newLocation.name || !newLocation.address) return;
      setIsSaving(true);

      try {
          const payload = {
              ...newLocation,
              // Gera link do maps simples se não informado
              mapUrl: newLocation.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newLocation.address + ' ' + newLocation.city)}`
          };

          if(isConfigured) {
               if (isEditing && newLocation.id) {
                   // UPDATE
                   const { error } = await supabase.from('locations').update(payload).eq('id', newLocation.id);
                   if(error) throw error;
                   
                   setLocations(sortLocations(locations.map(l => l.id === newLocation.id ? { ...l, ...payload } as Location : l)));
               } else {
                   // INSERT
                   const insertPayload = { ...payload };
                   delete insertPayload.id; // Garante que não envia ID na criação
                   
                   const { data, error } = await supabase.from('locations').insert(insertPayload).select();
                   if(error) throw error;
                   if(data) setLocations(sortLocations([...locations, data[0] as Location]));
               }
               alert('Local salvo com sucesso!');
          } else {
               // OFFLINE MODE
               if (isEditing && newLocation.id) {
                   setLocations(sortLocations(locations.map(l => l.id === newLocation.id ? { ...l, ...payload } as Location : l)));
               } else {
                   const loc = { ...payload, id: Math.random().toString() } as Location;
                   setLocations(sortLocations([...locations, loc]));
               }
               alert('Local salvo (Modo Offline/Demo)!');
          }
          setShowModal(false);
      } catch (error: any) {
          console.error(error);
          alert('Erro ao salvar local: ' + (error.message || error.details || JSON.stringify(error)));
      } finally {
          setIsSaving(false);
      }
  };

  const handleDelete = async (id: string) => {
      if(!confirm('Remover este endereço?')) return;
      if(isConfigured) {
          await supabase.from('locations').delete().eq('id', id);
      }
      setLocations(locations.filter(l => l.id !== id));
  };

  // Input Class Padrão
  const inputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Endereços & Locais</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie as congregações da igreja.</p>
        </div>
        {userRole === 'admin' && (
            <button 
                onClick={openAddModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
            >
                <Plus className="w-5 h-5" /> Adicionar Local
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all group relative flex flex-col h-full">
            
            {userRole === 'admin' && (
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                     <button onClick={() => openEditModal(loc)} className="bg-white/90 dark:bg-slate-700/90 text-blue-600 p-2 rounded-full shadow-md hover:bg-blue-50 backdrop-blur-sm transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4"/>
                     </button>
                     <button onClick={() => handleDelete(loc.id)} className="bg-white/90 dark:bg-slate-700/90 text-red-500 p-2 rounded-full shadow-md hover:bg-red-50 backdrop-blur-sm transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4"/>
                     </button>
                </div>
            )}

            <div className="h-48 bg-slate-100 dark:bg-slate-700 relative overflow-hidden flex-shrink-0">
                {loc.imageUrl ? (
                    <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <>
                        {/* Pattern Background */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#3b82f6_1px,transparent_0)] bg-[size:10px_10px]"></div>
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-slate-300 dark:text-slate-500" />
                        </div>
                    </>
                )}
                
                {/* Badge Tipo */}
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm backdrop-blur-md ${loc.type === 'Sede' ? 'bg-blue-600/90' : 'bg-sky-500/90'}`}>
                        {loc.type}
                    </span>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 leading-tight">{loc.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">{loc.city}</p>
                
                <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-snug">{loc.address}</span>
                    </div>
                    <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-snug">{loc.serviceTimes}</span>
                    </div>
                </div>

                <a 
                    href={loc.mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors mt-auto"
                >
                    <Navigation className="w-4 h-4" />
                    Abrir no Maps
                </a>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 overflow-y-auto max-h-[90vh]">
                  <h3 className="text-xl font-bold dark:text-white mb-4">{isEditing ? 'Editar Endereço' : 'Novo Endereço'}</h3>
                  <form onSubmit={handleSaveLocation} className="space-y-4">
                      
                      {/* Image Upload Field */}
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">Foto da Fachada</label>
                          <div className="relative w-full h-40 bg-slate-50 dark:bg-slate-700 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex justify-center items-center overflow-hidden group hover:border-blue-500 transition-colors cursor-pointer">
                              {newLocation.imageUrl ? (
                                  <>
                                    <img src={newLocation.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                  </>
                              ) : (
                                  <div className="text-center text-slate-400 group-hover:text-blue-500">
                                      <Upload className="w-8 h-8 mx-auto mb-2" />
                                      <span className="text-xs font-medium">Clique para enviar foto</span>
                                  </div>
                              )}
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Local</label>
                          <input type="text" className={`${inputClass} uppercase`} required value={newLocation.name || ''} onChange={e => setNewLocation({...newLocation, name: e.target.value.toUpperCase()})} placeholder="Ex: Congregação Vale da Bênção" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                          <select className={inputClass} value={newLocation.type} onChange={e => setNewLocation({...newLocation, type: e.target.value as any})}>
                              <option value="Congregação">Congregação</option>
                              <option value="Sede">Sede</option>
                              <option value="Ponto de Pregação">Ponto de Pregação</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Endereço</label>
                          <input type="text" className={`${inputClass} uppercase`} required value={newLocation.address || ''} onChange={e => setNewLocation({...newLocation, address: e.target.value.toUpperCase()})} placeholder="Rua, Número, Bairro" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Cidade - UF</label>
                          <input type="text" className={`${inputClass} uppercase`} required value={newLocation.city || ''} onChange={e => setNewLocation({...newLocation, city: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Horários de Culto</label>
                          <input type="text" className={`${inputClass} uppercase`} required value={newLocation.serviceTimes || ''} onChange={e => setNewLocation({...newLocation, serviceTimes: e.target.value.toUpperCase()})} placeholder="Dom: 19h | Qua: 20h" />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" /> Link do Google Maps (Opcional)
                          </label>
                          <input 
                            type="text" 
                            className={inputClass} 
                            value={newLocation.mapUrl || ''} 
                            onChange={e => setNewLocation({...newLocation, mapUrl: e.target.value})} 
                            placeholder="https://maps.app.goo.gl/..." 
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Se deixar em branco, o sistema gera um link de busca automático com o endereço.</p>
                      </div>
                      
                      <div className="flex gap-3 mt-6 pt-2">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-lg dark:text-white bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
                          <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
                              {isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar Local')}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
