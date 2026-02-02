
import React, { useState } from 'react';
import { Plus, Search, Camera, User, Droplet, Sparkles, Edit2, CreditCard, Church, MapPin, Briefcase, Trash2, FileBadge, CheckCircle, X } from 'lucide-react';
import { Member, MemberStatus, UserRole } from '../types';
import { generateMembershipCard, generateCertificate } from '../services/pdfService';
import { supabase, isConfigured } from '../services/supabaseClient';

const BRAZIL_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const formatCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);
const formatCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/\.(\d{3})(\d)/, '.$1-$2').slice(0, 10);

const maskData = (value: string | undefined, type: any, isPrivacyActive: boolean) => {
    if (!value) return '';
    if (!isPrivacyActive) return value;
    if (type === 'email') return `${value.split('@')[0].substring(0, 2)}***@${value.split('@')[1]}`;
    return '********';
};

interface MemberFormContentProps {
    data: Partial<Member>;
    onChange: (field: keyof Member, value: any) => void;
    isAdmin: boolean;
    availableCongregations: string[];
    onAddCongregation: (name: string) => void;
}

const MemberFormContent: React.FC<MemberFormContentProps> = ({ data, onChange, isAdmin, availableCongregations, onAddCongregation }) => {
  const [isAddingCongregation, setIsAddingCongregation] = useState(false);
  const [newCongregationName, setNewCongregationName] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange('photoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCongregation = () => {
    if(newCongregationName.trim()) {
      onAddCongregation(newCongregationName);
      onChange('congregation', newCongregationName);
      setNewCongregationName('');
      setIsAddingCongregation(false);
    }
  };

  return (
  <div className="space-y-8">
      
      {/* SEÇÃO DA FOTO DE PERFIL */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-xl">
                {data.photoUrl ? (
                    <img src={data.photoUrl} alt="Foto Perfil" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User className="w-16 h-16" />
                    </div>
                )}
            </div>
            <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                <Camera className="w-5 h-5" />
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">Foto do Membro</p>
      </div>

      {/* 1. INFORMAÇÕES PESSOAIS */}
      <section>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide border-b border-blue-100 dark:border-blue-900/50 pb-2 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 1. Informações Pessoais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome Completo</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                      value={data.name || ''} onChange={e => onChange('name', e.target.value)} required />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de Nascimento</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                      value={data.birthDate || ''} onChange={e => onChange('birthDate', e.target.value)} />
              </div>

              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">CPF</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.cpf || ''} onChange={e => onChange('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">RG</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.rg || ''} onChange={e => onChange('rg', e.target.value)} />
              </div>
              <div className="md:col-span-4">
                   <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Estado Civil</label>
                   <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.maritalStatus || 'Solteiro(a)'} onChange={e => onChange('maritalStatus', e.target.value)}>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                   </select>
              </div>

              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nacionalidade</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.nationality || 'Brasileira'} onChange={e => onChange('nationality', e.target.value)} />
              </div>
              <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Naturalidade (Cidade)</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.naturalness || ''} onChange={e => onChange('naturalness', e.target.value)} />
              </div>
              <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">UF (Naturalidade)</label>
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.naturalnessState || ''} onChange={e => onChange('naturalnessState', e.target.value)}>
                     <option value="">Selecione</option>
                     {BRAZIL_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
              </div>

              <div className="md:col-span-12">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Profissão</label>
                  <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input className="w-full pl-9 border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.profession || ''} onChange={e => onChange('profession', e.target.value)} placeholder="Ex: Professor, Autônomo..." />
                  </div>
              </div>
          </div>
      </section>

      {/* 2. CONTATO */}
      <section>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide border-b border-blue-100 dark:border-blue-900/50 pb-2 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 2. Contato & Endereço
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Telefone / WhatsApp</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.phone || ''} onChange={e => onChange('phone', formatPhone(e.target.value))} placeholder="(00) 00000-0000" />
              </div>
              <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                  <input type="email" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.email || ''} onChange={e => onChange('email', e.target.value)} />
              </div>
              
              <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">CEP</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.postalCode || ''} onChange={e => onChange('postalCode', formatCEP(e.target.value))} />
              </div>
              <div className="md:col-span-9">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Endereço Completo</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.address || ''} onChange={e => onChange('address', e.target.value)} placeholder="Rua, Número, Bairro" />
              </div>
              
              <div className="md:col-span-8">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cidade</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.city || ''} onChange={e => onChange('city', e.target.value)} />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Estado (UF)</label>
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.state || ''} onChange={e => onChange('state', e.target.value)}>
                     <option value="">Selecione</option>
                     {BRAZIL_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
              </div>
          </div>
      </section>

      {/* 3. ECLESIASTICO */}
      <section>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide border-b border-blue-100 dark:border-blue-900/50 pb-2 mb-4 flex items-center gap-2">
              <Church className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 3. Dados Eclesiásticos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Congregação</label>
                 {isAddingCongregation ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        autoFocus
                        className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white"
                        placeholder="Nome da nova congregação"
                        value={newCongregationName}
                        onChange={e => setNewCongregationName(e.target.value)}
                      />
                      <button type="button" onClick={handleSaveCongregation} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"><CheckCircle className="w-4 h-4"/></button>
                      <button type="button" onClick={() => setIsAddingCongregation(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-600 p-2 rounded-lg hover:bg-slate-300"><X className="w-4 h-4"/></button>
                    </div>
                 ) : (
                    <div className="flex gap-2">
                      <select className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.congregation || 'Sede'} onChange={e => onChange('congregation', e.target.value)}>
                          {availableCongregations.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="button" onClick={() => setIsAddingCongregation(true)} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-2 rounded-lg hover:bg-blue-200" title="Adicionar Congregação"><Plus className="w-4 h-4"/></button>
                    </div>
                 )}
              </div>

              <div className="md:col-span-3">
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cargo / Função</label>
                 <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.role || 'Membro'} onChange={e => onChange('role', e.target.value)}>
                    <option value="Membro">Membro</option>
                    <option value="Cooperador">Cooperador</option>
                    <option value="Diácono">Diácono</option>
                    <option value="Presbítero">Presbítero</option>
                    <option value="Evangelista">Evangelista</option>
                    <option value="Pastor">Pastor</option>
                    <option value="Missionário">Missionário</option>
                    <option value="Músico">Músico</option>
                 </select>
              </div>
              <div className="md:col-span-3">
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Situação (Status)</label>
                 <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.status || 'Ativo'} onChange={e => onChange('status', e.target.value)}>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Visitante">Visitante</option>
                    <option value="Em Disciplina">Em Disciplina</option>
                 </select>
              </div>

              <div className="md:col-span-6">
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ministério / Departamento</label>
                 <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.ministry || ''} onChange={e => onChange('ministry', e.target.value)} placeholder="Ex: Louvor, Infantil, Jovens" />
              </div>
              <div className="md:col-span-6">
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Igreja Anterior</label>
                 <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.previousChurch || ''} onChange={e => onChange('previousChurch', e.target.value)} />
              </div>

              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de Admissão</label>
                  <input type="date" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.joinedAt || ''} onChange={e => onChange('joinedAt', e.target.value)} />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-500"/> Batismo nas Águas</label>
                  <input type="date" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.baptismDate || ''} onChange={e => onChange('baptismDate', e.target.value)} />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-500"/> Batismo Espírito Santo</label>
                  <input type="date" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={data.holySpiritBaptismDate || ''} onChange={e => onChange('holySpiritBaptismDate', e.target.value)} />
              </div>
          </div>
      </section>
  </div>
)};

interface MembersProps {
    userRole: UserRole;
    privacyMode?: boolean;
    members: Member[];
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

export const Members: React.FC<MembersProps> = ({ userRole, privacyMode = false, members, setMembers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<Member>>({});
  const [congregations, setCongregations] = useState<string[]>(['Sede', 'Congregação Jardim']);
  const [isSaving, setIsSaving] = useState(false);

  // Certificate State
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedMemberForCert, setSelectedMemberForCert] = useState<Member | null>(null);
  const [certType, setCertType] = useState('Batismo nas Águas');
  const [certDesc, setCertDesc] = useState('Declaramos que o membro acima está em plena comunhão com esta igreja.');

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentMember({
        name: '', email: '', role: 'Membro', status: MemberStatus.ACTIVE,
        joinedAt: new Date().toISOString().split('T')[0], nationality: 'Brasileira', congregation: 'Sede'
    });
    setShowAddModal(true);
  };

  const openEditModal = (member: Member) => {
    setIsEditing(true);
    setCurrentMember({ ...member });
    setShowAddModal(true);
  };

  const openCertModal = (member: Member) => {
    setSelectedMemberForCert(member);
    setCertType('Batismo nas Águas');
    setShowCertModal(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return;
    try {
        if (isConfigured) {
            const { error } = await supabase.from('members').delete().eq('id', id);
            if(error) throw error;
        }
        setMembers(members.filter(m => m.id !== id));
    } catch (error: any) {
        alert("Erro ao excluir: " + error.message);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember.name) return;
    setIsSaving(true);

    try {
        if (isConfigured) {
            // SUPABASE SAVE
            const payload = { ...currentMember };
            
            // Gerar avatar padrão se não tiver foto
            if (!payload.photoUrl) {
               payload.photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || '')}&background=random&color=fff&size=128`;
            }

            if (!isEditing) {
                delete payload.id; 
            }

            const { data, error } = await supabase
                .from('members')
                .upsert(payload)
                .select();

            if (error) throw error;
            
            if (data) {
                const savedMember = data[0] as Member;
                if (isEditing) {
                    setMembers(members.map(m => m.id === savedMember.id ? savedMember : m));
                } else {
                    setMembers([savedMember, ...members]);
                }
            }
        } else {
            // FALLBACK LOCAL STORAGE (DEMO)
            const member: Member = {
                ...currentMember as Member,
                id: currentMember.id || Math.random().toString(36).substr(2, 9),
                photoUrl: currentMember.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentMember.name || '')}&background=random&color=fff&size=128`
            };
            if (isEditing) {
                setMembers(members.map(m => m.id === member.id ? member : m));
            } else {
                setMembers([member, ...members]);
            }
        }
        setShowAddModal(false);
    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar membro: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleGenerateCard = (member: Member) => generateMembershipCard(member);
  
  const handleGenerateCertificate = () => {
    if(selectedMemberForCert) {
        generateCertificate(selectedMemberForCert, certType, certDesc);
        setShowCertModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 md:top-[74px] z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm pb-4 pt-2 -mx-6 px-6 md:-mx-8 md:px-8 mb-4 border-b border-transparent flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Membros</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestão de membros {isConfigured ? '(Online)' : '(Offline/Demo)'}</p>
        </div>
        <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none">
          <Plus className="w-5 h-5" /> Novo Membro
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" placeholder="Buscar por nome ou cargo..." className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Membro</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Contato</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden mr-3">
                         {member.photoUrl && <img src={member.photoUrl} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                          <div className="text-xs text-slate-500">{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <div>{maskData(member.email, 'email', privacyMode)}</div>
                      <div>{maskData(member.phone, 'phone', privacyMode)}</div>
                  </td>
                  <td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{member.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => handleGenerateCard(member)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded" title="Carteirinha"><CreditCard className="w-5 h-5"/></button>
                        <button onClick={() => openCertModal(member)} className="text-amber-600 hover:text-amber-800 p-2 hover:bg-amber-50 rounded" title="Gerar Certificado"><FileBadge className="w-5 h-5"/></button>
                        <button onClick={() => openEditModal(member)} className="text-slate-400 hover:text-blue-600 p-2 hover:bg-slate-100 rounded" title="Editar"><Edit2 className="w-5 h-5" /></button>
                        {userRole === 'admin' && (
                             <button onClick={() => handleDeleteMember(member.id)} className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between">
              <h3 className="text-xl font-bold dark:text-white">{isEditing ? 'Editar' : 'Novo'} Membro</h3>
              <button onClick={() => setShowAddModal(false)} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSaveMember} className="overflow-y-auto p-8">
               <MemberFormContent data={currentMember} onChange={(f: any, v: any) => setCurrentMember(prev => ({...prev, [f]: v}))} isAdmin={true} availableCongregations={congregations} onAddCongregation={(name: string) => setCongregations([...congregations, name])} />
               <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 border rounded-xl border-slate-300 dark:border-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none font-medium">
                      {isSaving ? 'Salvando...' : 'Salvar Membro'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CERTIFICADOS */}
      {showCertModal && (
          <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileBadge className="w-6 h-6 text-amber-500" />
                        Emitir Certificado
                    </h3>
                    <button onClick={() => setShowCertModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                 </div>
                 
                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Membro</label>
                         <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">
                             {selectedMemberForCert?.name}
                         </div>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Certificado</label>
                         <select 
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 dark:bg-slate-700 dark:text-white"
                            value={certType}
                            onChange={e => setCertType(e.target.value)}
                         >
                             <option value="Batismo nas Águas">Batismo nas Águas</option>
                             <option value="Apresentação de Criança">Apresentação de Criança</option>
                             <option value="Membro da Igreja">Membro da Igreja</option>
                             <option value="Consagração de Obreiro">Consagração de Obreiro</option>
                             <option value="Conclusão de Discipulado">Conclusão de Discipulado</option>
                             <option value="Reconhecimento">Honra ao Mérito</option>
                         </select>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Texto do Certificado / Observação</label>
                         <textarea 
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 dark:bg-slate-700 dark:text-white"
                            rows={4}
                            value={certDesc}
                            onChange={e => setCertDesc(e.target.value)}
                         ></textarea>
                     </div>

                     <button 
                        onClick={handleGenerateCertificate}
                        className="w-full py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 flex justify-center items-center gap-2 mt-4"
                     >
                         <FileBadge className="w-5 h-5" />
                         Gerar PDF
                     </button>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};
