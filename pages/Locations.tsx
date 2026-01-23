import React from 'react';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { Location } from '../types';

const LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Sede Principal',
    type: 'Sede',
    address: 'Av. das Nações, 1000 - Centro',
    city: 'São Paulo - SP',
    serviceTimes: 'Dom: 18h | Qua: 20h',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Av.+das+Nações,+1000+-+Centro'
  },
  {
    id: '2',
    name: 'Congregação Jardim das Flores',
    type: 'Congregação',
    address: 'Rua das Margaridas, 45',
    city: 'São Paulo - SP',
    serviceTimes: 'Dom: 09h e 19h | Sex: 20h',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rua+das+Margaridas,+45'
  },
  {
    id: '3',
    name: 'Ponto de Pregação - Zona Norte',
    type: 'Congregação',
    address: 'Rua do Norte, 120',
    city: 'São Paulo - SP',
    serviceTimes: 'Sab: 19:30h',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rua+do+Norte,+120'
  }
];

export const Locations: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Endereços & Locais</h1>
        <p className="text-slate-500 dark:text-slate-400">Encontre a igreja mais próxima e horários de culto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LOCATIONS.map((loc) => (
          <div key={loc.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all group">
            <div className="h-32 bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                {/* Simulated Map Background */}
                <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-blue-300 opacity-50" />
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
    </div>
  );
};