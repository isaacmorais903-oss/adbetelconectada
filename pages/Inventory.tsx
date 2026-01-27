
import React, { useState } from 'react';
import { Package, Plus, Search, Filter, Trash2, Edit2, Archive, DollarSign, Box } from 'lucide-react';
import { InventoryItem } from '../types';
import { StatsCard } from '../components/StatsCard';

interface InventoryProps {
    initialItems: InventoryItem[];
    items?: (items: InventoryItem[]) => void; // Fallback type compatible with setState
}

export const Inventory: React.FC<InventoryProps> = ({ initialItems, items: setItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Use local state if not provided, but in this architecture it will always be provided by App
  const items = initialItems; 
  
  // Wrapper for updating parent state
  const handleUpdateItems = (newItems: InventoryItem[]) => {
      if(setItems) setItems(newItems);
  };

  // Form State
  const [currentItem, setCurrentItem] = useState<Partial<InventoryItem>>({
    status: 'Bom',
    quantity: 1,
    category: 'Móveis',
    location: 'Templo Principal',
    acquisitionDate: new Date().toISOString().split('T')[0]
  });

  // Calculate Stats
  const totalValue = items.reduce((acc, item) => acc + (item.estimatedValue * item.quantity), 0);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const itemsNeedingRepair = items.filter(i => i.status === 'Danificado' || i.status === 'Em Manutenção').length;

  // Filter Items
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.name) return;

    if (isEditing && currentItem.id) {
        handleUpdateItems(items.map(i => i.id === currentItem.id ? { ...i, ...currentItem } as InventoryItem : i));
    } else {
        const newItem: InventoryItem = {
            ...currentItem as InventoryItem,
            id: Math.random().toString(36).substr(2, 9),
            estimatedValue: Number(currentItem.estimatedValue) || 0,
            quantity: Number(currentItem.quantity) || 1
        };
        handleUpdateItems([newItem, ...items]);
    }
    setShowModal(false);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentItem({
        status: 'Novo',
        quantity: 1,
        category: 'Móveis',
        location: 'Templo Principal',
        acquisitionDate: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setIsEditing(true);
    setCurrentItem({ ...item });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item do inventário?')) {
        handleUpdateItems(items.filter(i => i.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Novo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
          case 'Bom': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
          case 'Desgastado': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
          case 'Em Manutenção': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
          case 'Danificado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
          default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 md:top-[74px] z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm pb-4 pt-2 -mx-6 px-6 md:-mx-8 md:px-8 mb-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-transparent">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patrimônio da Igreja</h1>
          <p className="text-slate-500 dark:text-slate-400">Controle de inventário e bens materiais.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-200 dark:shadow-none font-medium"
        >
          <Plus className="w-5 h-5" />
          Novo Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
            label="Valor Total do Patrimônio" 
            value={`R$ ${totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
            trend="Estimativa Atual" 
            trendUp={true} 
            icon={DollarSign} 
            color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" 
        />
        <StatsCard 
            label="Total de Itens" 
            value={totalItemsCount.toString()} 
            trend="Unidades cadastradas" 
            trendUp={true} 
            icon={Box} 
            color="text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" 
        />
        <StatsCard 
            label="Atenção Necessária" 
            value={itemsNeedingRepair.toString()} 
            trend="Itens danificados/manutenção" 
            trendUp={false} 
            icon={Archive} 
            color="text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400" 
        />
      </div>

      {/* Main Table Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar item por nome, categoria..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Local & Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qtd.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor Unit.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg mr-3 text-slate-500 dark:text-slate-400">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</div>
                            {item.description && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                    {item.description}
                                </div>
                            )}
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 dark:text-white">{item.location}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.quantity} un.</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-700 dark:text-slate-300">R$ {item.estimatedValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border border-transparent ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => openEditModal(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Editar"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Excluir"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>Nenhum item encontrado.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
               <div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Editar Item' : 'Novo Item de Patrimônio'}</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados do bem material.</p>
               </div>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                 <span className="text-2xl">&times;</span>
               </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="overflow-y-auto space-y-4 pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Item</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={currentItem.name || ''} 
                            onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                            placeholder="Ex: Projetor Epson X20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={currentItem.category}
                            onChange={e => setCurrentItem({...currentItem, category: e.target.value})}
                        >
                            <option value="Móveis">Móveis</option>
                            <option value="Eletrônicos">Eletrônicos</option>
                            <option value="Instrumentos">Instrumentos Musicais</option>
                            <option value="Liturgia">Utensílios de Liturgia</option>
                            <option value="Cozinha">Cozinha / Cantina</option>
                            <option value="Infantil">Departamento Infantil</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Localização</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={currentItem.location || ''} 
                            onChange={e => setCurrentItem({...currentItem, location: e.target.value})}
                            placeholder="Ex: Templo, Sala 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantidade</label>
                        <input 
                            type="number" 
                            min="1"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={currentItem.quantity || ''} 
                            onChange={e => setCurrentItem({...currentItem, quantity: parseInt(e.target.value)})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Unitário Estimado (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={currentItem.estimatedValue || ''} 
                            onChange={e => setCurrentItem({...currentItem, estimatedValue: parseFloat(e.target.value)})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Aquisição</label>
                        <input 
                            type="date" 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={currentItem.acquisitionDate || ''} 
                            onChange={e => setCurrentItem({...currentItem, acquisitionDate: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Condição / Status</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={currentItem.status}
                            onChange={e => setCurrentItem({...currentItem, status: e.target.value as any})}
                        >
                            <option value="Novo">Novo</option>
                            <option value="Bom">Bom Estado</option>
                            <option value="Desgastado">Desgastado pelo Uso</option>
                            <option value="Em Manutenção">Em Manutenção</option>
                            <option value="Danificado">Danificado / Quebrado</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição / Observações</label>
                        <textarea 
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                            value={currentItem.description || ''} 
                            onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
                            placeholder="Número de série, detalhes da cor, fornecedor..."
                        ></textarea>
                    </div>
                </div>

                <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button 
                        type="button" 
                        onClick={() => setShowModal(false)}
                        className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 dark:shadow-none transition-colors"
                    >
                        Salvar Item
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
