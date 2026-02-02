
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Plus, Trash2, Building2 } from 'lucide-react';
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
    mapUrl: 'https://www.google.com/maps'
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
      serviceTimes: 'Dom: 19h | Qui: 20h'
  });

  useEffect(() => {
    if(isConfigured) {
        supabase.from('locations').select('*')
        .then(({ data }) => {
            if(data && data.length > 0) setLocations(data);
        });
    }
  }, []);

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
          setNewLocation({ type: 'Congregação', city: 'São Paulo - SP', serviceTimes: '', name: '', address: '' });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all group relative">
            
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleDelete(loc.id)} className="bg-white dark:bg-slate-700 text-red-500 p-2 rounded-full shadow-md hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
            </div>

            <div className="h-32 bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                {/* Pattern Background */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#3b82f6_1px,transparent_0)] bg-[size:10px_10px]"></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-500" />
                </div>
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${loc.type === 'Sede' ? 'bg-blue-600' : 'bg-sky-500'}`}>
                        {loc.type}
                    </span>
                </div>
            </div>
            <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{loc.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{loc.city}</p>
                
                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{loc.address}</span>
                    </div>
                    <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{loc.serviceTimes}</span>
                    </div>
                </div>

                <a 
                    href={loc.mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold dark:text-white mb-4">Novo Endereço</h3>
                  <form onSubmit={handleAddLocation} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Local</label>
                          <input type="text" className="w-full border p-2 rounded-lg dark:bg-slate-700 dark:text-white" required value={newLocation.name || ''} onChange={e => setNewLocation({...newLocation, name: e.target.value})} placeholder="Ex: Congregação Vale da Bênção" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                          <select className="w-full border p-2 rounded-lg dark:bg-slate-700 dark:text-white" value={newLocation.type} onChange={e => setNewLocation({...newLocation, type: e.target.value as any})}>
                              <option value="Congregação">Congregação</option>
                              <option value="Sede">Sede</option>
                              <option value="Ponto de Pregação">Ponto de Pregação</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Endereço</label>
                          <input type="text" className="w-full border p-2 rounded-lg dark:bg-slate-700 dark:text-white" required value={newLocation.address || ''} onChange={e => setNewLocation({...newLocation, address: e.target.value})} placeholder="Rua, Número, Bairro" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Cidade - UF</label>
                          <input type="text" className="w-full border p-2 rounded-lg dark:bg-slate-700 dark:text-white" required value={newLocation.city || ''} onChange={e => setNewLocation({...newLocation, city: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Horários de Culto</label>
                          <input type="text" className="w-full border p-2 rounded-lg dark:bg-slate-700 dark:text-white" required value={newLocation.serviceTimes || ''} onChange={e => setNewLocation({...newLocation, serviceTimes: e.target.value})} placeholder="Dom: 19h | Qua: 20h" />
                      </div>
                      <div className="flex gap-3 mt-6">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg dark:text-white">Cancelar</button>
                          <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">{isSaving ? 'Salvando...' : 'Adicionar'}</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
