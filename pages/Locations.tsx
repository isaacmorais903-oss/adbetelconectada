
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Plus, Trash2, Building2, Camera, Upload, Link as LinkIcon } from 'lucide-react';
import { Location } from '../types';
import { supabase, isConfigured } from '../services/supabaseClient';

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

export const Locations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
        .then(({ data }) => {
            if(data && data.length > 0) setLocations(data);
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

  const handleAddLocation = async (e: React.FormEvent) => {
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
               const { data, error } = await supabase.from('locations').insert(payload).select();
               if(error) throw error;
               if(data) setLocations([...locations, data[0] as Location]);
          } else {
               const loc = { ...payload, id: Math.random().toString() } as Location;
               setLocations([...locations, loc]);
          }
          setShowModal(false);
          setNewLocation({ type: 'Congregação', city: 'São Paulo - SP', serviceTimes: '', name: '', address: '', imageUrl: '', mapUrl: '' });
      } catch (error) {
          alert('Erro ao salvar local.');
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
        <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
        >
            <Plus className="w-5 h-5" /> Adicionar Local
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all group relative flex flex-col h-full">
            
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleDelete(loc.id)} className="bg-white/90 dark:bg-slate-700/90 text-red-500 p-2 rounded-full shadow-md hover:bg-red-50 backdrop-blur-sm"><Trash2 className="w-4 h-4"/></button>
            </div>

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
                    Abrir no GPS
                </a>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 overflow-y-auto max-h-[90vh]">
                  <h3 className="text-xl font-bold dark:text-white mb-4">Novo Endereço</h3>
                  <form onSubmit={handleAddLocation} className="space-y-4">
                      
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
                          <input type="text" className={inputClass} required value={newLocation.name || ''} onChange={e => setNewLocation({...newLocation, name: e.target.value})} placeholder="Ex: Congregação Vale da Bênção" />
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
                          <input type="text" className={inputClass} required value={newLocation.address || ''} onChange={e => setNewLocation({...newLocation, address: e.target.value})} placeholder="Rua, Número, Bairro" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Cidade - UF</label>
                          <input type="text" className={inputClass} required value={newLocation.city || ''} onChange={e => setNewLocation({...newLocation, city: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Horários de Culto</label>
                          <input type="text" className={inputClass} required value={newLocation.serviceTimes || ''} onChange={e => setNewLocation({...newLocation, serviceTimes: e.target.value})} placeholder="Dom: 19h | Qua: 20h" />
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
                          <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">{isSaving ? 'Salvando...' : 'Adicionar Local'}</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
