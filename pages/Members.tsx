import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Filter, Camera, User, Calendar, MapPin, Droplet, UserCheck, Edit2, FileBadge, IdCard, CheckCircle, Award, Briefcase, Flag, Fingerprint, Heart, Church, Sparkles } from 'lucide-react';
import { Member, MemberStatus, UserRole } from '../types';
import { generateMembershipCard, generateCertificate } from '../services/pdfService';

const INITIAL_MEMBERS: Member[] = [
  { 
    id: '1', name: 'Carlos Silva', role: 'Membro', email: 'carlos@email.com', phone: '(11) 99999-9999', status: MemberStatus.ACTIVE, joinedAt: '2023-01-15', photoUrl: 'https://ui-avatars.com/api/?name=Carlos+Silva&background=random', address: 'Rua das Palmeiras, 123', birthDate: '1985-05-15', baptismDate: '2005-10-20', city: 'São Paulo', postalCode: '01001-000',
    rg: '12.345.678-9', cpf: '123.456.789-00', maritalStatus: 'Casado', profession: 'Motorista', naturalness: 'São Paulo - SP', nationality: 'Brasileira', congregation: 'Sede', ministry: 'Nenhum'
  },
  { 
    id: '2', name: 'Ana Souza', role: 'Diaconisa', email: 'ana@email.com', phone: '(11) 98888-8888', status: MemberStatus.ACTIVE, joinedAt: '2022-05-20', photoUrl: 'https://ui-avatars.com/api/?name=Ana+Souza&background=random',
    maritalStatus: 'Casada', congregation: 'Sede' 
  },
];

interface MembersProps {
    userRole: UserRole;
}

export const Members: React.FC<MembersProps> = ({ userRole }) => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Admin State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<Member>>({});

  // Certificate Modal State
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedMemberForCert, setSelectedMemberForCert] = useState<Member | null>(null);
  const [certType, setCertType] = useState('Batismo nas Águas');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Member State (Self Profile)
  const [myProfile, setMyProfile] = useState<Member>(INITIAL_MEMBERS[0]);

  // Helper: Calculate Age
  const calculateAge = (birthDate?: string) => {
    if(!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
  };

  // -------------- MEMBER VIEW (MY PROFILE EDIT) --------------
  const handleMyProfileChange = (field: keyof Member, value: string) => {
    setMyProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveMyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Dados atualizados com sucesso!");
    setMembers(members.map(m => m.id === myProfile.id ? myProfile : m));
  };

  const handleGenerateCard = async (member: Member) => {
    setIsGeneratingPdf(true);
    await generateMembershipCard(member);
    setIsGeneratingPdf(false);
  };

  // Common Form Component for Reusability (Admin Modal & Member Page)
  const MemberFormContent = ({ 
    data, 
    onChange, 
    isAdmin = false 
  }: { 
    data: Partial<Member>, 
    onChange: (field: keyof Member, value: any) => void,
    isAdmin?: boolean
  }) => (
    <div className="space-y-8">
        
        {/* 1. INFORMAÇÕES PESSOAIS */}
        <section>
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide border-b border-blue-100 dark:border-blue-900/50 pb-2 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                1. Informações Pessoais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome Completo</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.name || ''} onChange={e => onChange('name', e.target.value)} required />
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de Nascimento</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.birthDate || ''} onChange={e => onChange('birthDate', e.target.value)} />
                </div>
                
                <div className="md:col-span-2">
                     <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Idade</label>
                     <input type="text" className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                        value={calculateAge(data.birthDate)} readOnly disabled />
                </div>
                <div className="md:col-span-5">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Naturalidade</label>
                    <input type="text" placeholder="Cidade - UF" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.naturalness || ''} onChange={e => onChange('naturalness', e.target.value)} />
                </div>
                <div className="md:col-span-5">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nacionalidade</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.nationality || 'Brasileira'} onChange={e => onChange('nationality', e.target.value)} />
                </div>

                <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><IdCard className="w-3 h-3"/> RG</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.rg || ''} onChange={e => onChange('rg', e.target.value)} />
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Fingerprint className="w-3 h-3"/> CPF</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.cpf || ''} onChange={e => onChange('cpf', e.target.value)} />
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Heart className="w-3 h-3"/> Estado Civil</label>
                    <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        value={data.maritalStatus || ''} onChange={e => onChange('maritalStatus', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                </div>
                <div className="md:col-span-12">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3"/> Profissão</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.profession || ''} onChange={e => onChange('profession', e.target.value)} />
                </div>
            </div>
        </section>

        {/* 2. CONTATO E ENDEREÇO */}
        <section>
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide border-b border-blue-100 dark:border-blue-900/50 pb-2 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                2. Contato e Endereço
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Telefone / WhatsApp</label>
                    <input type="tel" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.phone || ''} onChange={e => onChange('phone', e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">E-mail</label>
                    <input type="email" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.email || ''} onChange={e => onChange('email', e.target.value)} required 
                        readOnly={!isAdmin} title={!isAdmin ? "Contate a secretaria para alterar o email" : ""} 
                        style={!isAdmin ? {opacity: 0.7} : {}}
                    />
                </div>
                <div className="md:col-span-12">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Endereço Completo</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.address || ''} onChange={e => onChange('address', e.target.value)} placeholder="Rua, Número, Bairro" />
                </div>
                <div className="md:col-span-8">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cidade - UF</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.city || ''} onChange={e => onChange('city', e.target.value)} />
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">CEP</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.postalCode || ''} onChange={e => onChange('postalCode', e.target.value)} />
                </div>
            </div>
        </section>

        {/* 3. INFORMAÇÕES ECLESIÁSTICAS */}
        <section>
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide border-b border-blue-100 dark:border-blue-900/50 pb-2 mb-4 flex items-center gap-2">
                <Church className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                3. Informações Eclesiásticas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cargo / Função</label>
                     {isAdmin ? (
                         <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                             value={data.role || 'Membro'} onChange={e => onChange('role', e.target.value)}>
                             <option value="Membro">Membro</option>
                             <option value="Diácono">Diácono</option>
                             <option value="Presbítero">Presbítero</option>
                             <option value="Evangelista">Evangelista</option>
                             <option value="Pastor">Pastor</option>
                             <option value="Missionário">Missionário</option>
                             <option value="Músico">Músico</option>
                             <option value="Líder">Líder</option>
                             <option value="Visitante">Visitante</option>
                         </select>
                     ) : (
                         <input type="text" className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400" value={data.role || ''} readOnly />
                     )}
                </div>
                <div className="md:col-span-4">
                     <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                     {isAdmin ? (
                         <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                             value={data.status || MemberStatus.ACTIVE} onChange={e => onChange('status', e.target.value)}>
                             <option value={MemberStatus.ACTIVE}>Ativo</option>
                             <option value={MemberStatus.INACTIVE}>Inativo</option>
                             <option value={MemberStatus.VISITOR}>Visitante</option>
                         </select>
                     ) : (
                        <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${data.status === MemberStatus.ACTIVE ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {data.status}
                        </div>
                     )}
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Congregação</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.congregation || ''} onChange={e => onChange('congregation', e.target.value)} />
                </div>

                <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ministério / Depto.</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.ministry || ''} onChange={e => onChange('ministry', e.target.value)} placeholder="Ex: Louvor, Infantil..." />
                </div>
                <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de Admissão</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.joinedAt || ''} onChange={e => onChange('joinedAt', e.target.value)} />
                </div>

                <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-500"/> Data Batismo Águas</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.baptismDate || ''} onChange={e => onChange('baptismDate', e.target.value)} />
                </div>
                <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-500"/> Data Batismo Esp. Santo</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.holySpiritBaptismDate || ''} onChange={e => onChange('holySpiritBaptismDate', e.target.value)} />
                </div>
                
                <div className="md:col-span-12">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Igreja Anterior</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={data.previousChurch || ''} onChange={e => onChange('previousChurch', e.target.value)} />
                </div>
            </div>
        </section>
    </div>
  );

  // VIEW FOR MEMBER (SELF-EDIT)
  if (userRole === 'member') {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meus Dados</h1>
                    <p className="text-slate-500 dark:text-slate-400">Mantenha seu cadastro completo.</p>
                </div>
                <button 
                    onClick={() => handleGenerateCard(myProfile)}
                    disabled={isGeneratingPdf}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                >
                    <IdCard className="w-4 h-4" />
                    {isGeneratingPdf ? 'Gerando...' : 'Minha Carteirinha'}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-sky-600 relative">
                    <div className="absolute -bottom-12 left-8 group cursor-pointer">
                        <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden shadow-md relative transition-colors">
                            <img src={myProfile.photoUrl} alt={myProfile.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pt-14 px-8 pb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{myProfile.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{myProfile.role} • {myProfile.congregation || 'Sede'}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-900/50 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {myProfile.status}
                        </span>
                    </div>

                    <form onSubmit={handleSaveMyProfile}>
                        <MemberFormContent 
                            data={myProfile} 
                            onChange={handleMyProfileChange} 
                            isAdmin={false} 
                        />
                        <div className="flex justify-end pt-8 border-t border-slate-100 dark:border-slate-700 mt-8">
                            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
  }

  // -------------- ADMIN VIEW (LIST & EDIT) --------------

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentMember({
        name: '', email: '', role: 'Membro', status: MemberStatus.ACTIVE,
        joinedAt: new Date().toISOString().split('T')[0],
        nationality: 'Brasileira'
    });
    setShowAddModal(true);
  };

  const openEditModal = (member: Member) => {
    setIsEditing(true);
    setCurrentMember({ ...member });
    setShowAddModal(true);
  };

  const handleGenerateCert = (member: Member) => {
    setSelectedMemberForCert(member);
    setShowCertModal(true);
  }

  const handlePrintCertificate = async () => {
    if (!selectedMemberForCert) return;
    setIsGeneratingPdf(true);
    // (Lógica de certificado mantida igual...)
    let desc = "";
    switch(certType) {
        case 'Batismo nas Águas':
            desc = `confessou publicamente sua fé em Jesus Cristo, sendo batizado(a) em nome do Pai, do Filho e do Espírito Santo, passando a fazer parte do corpo de membros desta igreja.`;
            break;
        case 'Consagração Ministerial':
            desc = `foi separado(a) e consagrado(a) ao ministério, tendo demonstrado fidelidade e aptidão para o exercício da obra do Senhor, conforme as Sagradas Escrituras.`;
            break;
        case 'Conclusão de Discipulado':
            desc = `concluiu com êxito o curso de fundamentos da fé cristã, estando apto(a) a servir e crescer no conhecimento da graça e de nosso Senhor Jesus Cristo.`;
            break;
        case 'Curso de Teologia Básica':
            desc = `completou a grade curricular do Curso Básico de Teologia, demonstrando dedicação no estudo da Palavra de Deus.`;
            break;
        default:
            desc = `participou ativamente e concluiu as atividades propostas pela igreja com excelência.`;
    }
    await generateCertificate(selectedMemberForCert, certType, desc);
    setIsGeneratingPdf(false);
    setShowCertModal(false);
  }

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember.name || !currentMember.email) return;

    if (isEditing && currentMember.id) {
        // Update existing
        setMembers(members.map(m => m.id === currentMember.id ? { ...m, ...currentMember } as Member : m));
    } else {
        // Create new
        const member: Member = {
            ...currentMember as Member,
            id: Math.random().toString(36).substr(2, 9),
            joinedAt: currentMember.joinedAt || new Date().toISOString().split('T')[0],
            photoUrl: currentMember.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentMember.name || '')}&background=random`
        };
        setMembers([member, ...members]);
    }

    setShowAddModal(false);
  };

  const getStatusColor = (status: MemberStatus) => {
    switch(status) {
      case MemberStatus.ACTIVE: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50';
      case MemberStatus.INACTIVE: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50';
      case MemberStatus.VISITOR: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Membros</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestão completa e emissão de documentos.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-200 dark:shadow-none font-medium"
        >
          <Plus className="w-5 h-5" />
          Novo Membro
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {/* Filtros e Busca (Mantido igual) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar membro..." 
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

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Membro</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cargo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                           <Calendar className="w-3 h-3" />
                           Desde {new Date(member.joinedAt).getFullYear()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600 dark:text-slate-300">{member.email}</div>
                    <div className="text-sm text-slate-400 dark:text-slate-500">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-600">
                        {member.role}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => handleGenerateCard(member)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Gerar Carteirinha"
                        >
                            <IdCard className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleGenerateCert(member)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors" title="Gerar Certificado"
                        >
                            <FileBadge className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => openEditModal(member)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Editar"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL (ADMIN) */}
      {showAddModal && (
        // ALTERADO: Adicionado md:left-72 para compensar a barra lateral fixa no desktop
        <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10 flex justify-between items-center">
              <div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Editar Membro' : 'Novo Cadastro'}</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">{isEditing ? 'Atualize as informações do membro' : 'Preencha os dados completos do membro'}.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveMember} className="overflow-y-auto p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                  {/* Photo Column */}
                  <div className="flex flex-col items-center space-y-3 lg:w-48 flex-shrink-0">
                      <div className="w-32 h-40 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-blue-400 transition-colors relative overflow-hidden group">
                        {currentMember.photoUrl ? (
                            <img src={currentMember.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium">Foto 3x4</span>
                            </>
                        )}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      </div>
                      <span className="text-xs text-slate-400 text-center">Clique para enviar<br/>uma foto</span>
                  </div>

                  {/* Form Fields Column */}
                  <div className="flex-1">
                      <MemberFormContent 
                        data={currentMember} 
                        onChange={(field, value) => setCurrentMember(prev => ({...prev, [field]: value}))}
                        isAdmin={true}
                      />
                  </div>
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 dark:shadow-none transition-colors"
                >
                  {isEditing ? 'Atualizar Dados' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE GENERATION MODAL (Reused logic) */}
      {showCertModal && selectedMemberForCert && (
        // ALTERADO: Adicionado md:left-72 aqui também
        <div className="fixed inset-0 md:left-72 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                {/* ... (Modal content same as before) ... */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                        <Award className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gerar Certificado</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Para: {selectedMemberForCert.name}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Certificado</label>
                        <select 
                            className="w-full px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            value={certType}
                            onChange={e => setCertType(e.target.value)}
                        >
                            <option value="Batismo nas Águas">Batismo nas Águas</option>
                            <option value="Consagração Ministerial">Consagração Ministerial</option>
                            <option value="Conclusão de Discipulado">Conclusão de Discipulado</option>
                            <option value="Curso de Teologia Básica">Curso de Teologia Básica</option>
                            <option value="Honra ao Mérito">Honra ao Mérito</option>
                        </select>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-100 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 italic">
                        "Este documento certifica a conclusão ou participação do membro nas atividades eclesiásticas selecionadas."
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={() => setShowCertModal(false)}
                            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="button"
                            onClick={handlePrintCertificate}
                            disabled={isGeneratingPdf}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50"
                        >
                            {isGeneratingPdf ? 'Gerando...' : 'Emitir PDF'}
                        </button>
                    </div>
                </div>
             </div>
        </div>
      )}

    </div>
  );
};