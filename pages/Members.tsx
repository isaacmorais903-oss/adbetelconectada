
import React, { useState, useEffect } from 'react';
import { Plus, Search, Camera, User, Droplet, Sparkles, Edit2, CreditCard, Church, MapPin, Briefcase, Trash2, FileBadge, CheckCircle, X, Hash, ShieldCheck, FileText, Lock, AlertCircle } from 'lucide-react';
import { Member, MemberStatus, UserRole } from '../types';
import { generateMembershipCard, generateCertificate } from '../services/pdfService';
import { supabase, isConfigured } from '../services/supabaseClient';
import { APP_CONFIG } from '../config';

const BRAZIL_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const DEFAULT_ROLES = ['Membro', 'Cooperador', 'Diácono', 'Presbítero', 'Evangelista', 'Pastor', 'Missionário', 'Músico'];

const formatCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);
const formatCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/\.(\d{3})(\d)/, '.$1-$2').slice(0, 10);

const maskData = (value: string | undefined, type: any, isPrivacyActive: boolean) => {
    if (!value) return '';
    if (!isPrivacyActive) return value;
    if (type === 'email') return `${value.split('@')[0].substring(0, 2)}***@${value.split('@')[1]}`;
    return '********';
};

// Extrai o código diretamente da string da congregação (ex: "002 - Jardim" -> "002")
const getCongregationCode = (congregationName: string) => {
    if (!congregationName) return '999';
    
    // Tenta encontrar o padrão "001 - Nome" no início da string
    const match = congregationName.match(/^(\d{3})/);
    if (match) return match[1];
    
    // Fallback para legado ou Sede sem número
    const name = congregationName.toLowerCase();
    if (name.includes('sede')) return '001';
    
    return '999'; // Código genérico se não seguir o padrão
};

// Texto do Termo LGPD para exibição na tela
const LGPD_TERM_TEXT = `
TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS
(Em conformidade com a Lei Geral de Proteção de Dados - Lei 13.709/2018)

1. FINALIDADE DO TRATAMENTO:
O Titular dos dados autoriza a ${APP_CONFIG.churchName} a realizar o tratamento de seus dados pessoais para as seguintes finalidades:
- Gestão administrativa e eclesiástica de membros;
- Comunicação interna (avisos, eventos, escalas, aniversários);
- Histórico de sacramentos (batismos, casamentos, consagrações);
- Controle de acesso e segurança nas dependências da igreja;
- Registro de contribuições financeiras (dízimos e ofertas) para fins fiscais e de transparência.

2. COMPARTILHAMENTO DE DADOS:
A Igreja compromete-se a não compartilhar seus dados pessoais com terceiros para fins comerciais. O compartilhamento poderá ocorrer apenas para cumprimento de obrigações legais ou com prestadores de serviço essenciais (ex: software de gestão, contabilidade), desde que estes também garantam a segurança dos dados.

3. DIREITOS DO TITULAR:
O titular poderá, a qualquer momento, solicitar acesso, correção, atualização ou a revogação deste consentimento (exceto para dados necessários ao cumprimento de obrigações legais), mediante requerimento à secretaria da igreja.

4. VIGÊNCIA:
O consentimento é válido enquanto o titular mantiver vínculo com a instituição ou até manifestação em contrário.
`;

interface MemberFormContentProps {
    data: Partial<Member>;
    onChange: (field: keyof Member, value: any) => void;
    isAdmin: boolean;
    availableCongregations: string[];
    onAddCongregation: (name: string) => void;
    availableRoles: string[];
    onAddRole: (name: string) => void;
    currentUserEmail?: string;
}

const MemberFormContent: React.FC<MemberFormContentProps> = ({ 
    data, 
    onChange, 
    isAdmin, 
    availableCongregations, 
    onAddCongregation,
    availableRoles,
    onAddRole,
    currentUserEmail
}) => {
  // Estado Congregação
  const [isAddingCongregation, setIsAddingCongregation] = useState(false);
  const [newCongregationName, setNewCongregationName] = useState('');

  // Estado Cargo/Função
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  
  // Verifica se o usuário logado é o dono deste perfil
  // Compara e-mail do form com e-mail da sessão (case insensitive e trim)
  const isOwnProfile = currentUserEmail && data.email && currentUserEmail.trim().toLowerCase() === data.email.trim().toLowerCase();

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
      const existingNumbers = availableCongregations
        .map(c => parseInt(c.split(' - ')[0]))
        .filter(n => !isNaN(n));
      
      const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 1;
      const nextNum = maxNum + 1;
      const formattedNum = nextNum.toString().padStart(3, '0');
      const finalName = `${formattedNum} - ${newCongregationName.trim()}`;

      onAddCongregation(finalName);
      onChange('congregation', finalName);
      setNewCongregationName('');
      setIsAddingCongregation(false);
    }
  };

  const handleSaveRole = () => {
      if(newRoleName.trim()) {
          const finalRole = newRoleName.trim();
          onAddRole(finalRole);
          onChange('role', finalRole);
          setNewRoleName('');
          setIsAddingRole(false);
      }
  };

  const inputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500";

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
        {data.code && (
            <div className="mt-3 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                Cód: {data.code}
            </div>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Foto do Membro</p>
      </div>

      {/* 1. INFORMAÇÕES PESSOAIS */}
      <section>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide border-b border-blue-100 dark:border-blue-900/50 pb-2 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 1. Informações Pessoais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome Completo</label>
                  <input type="text" className={inputClass} 
                      value={data.name || ''} onChange={e => onChange('name', e.target.value)} required />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de Nascimento</label>
                  <input type="date" className={inputClass} 
                      value={data.birthDate || ''} onChange={e => onChange('birthDate', e.target.value)} />
              </div>

              {/* FILIAÇÃO */}
              <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome da Mãe</label>
                  <input className={inputClass} value={data.motherName || ''} onChange={e => onChange('motherName', e.target.value)} placeholder="Opcional para carteirinha" />
              </div>
              <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome do Pai</label>
                  <input className={inputClass} value={data.fatherName || ''} onChange={e => onChange('fatherName', e.target.value)} placeholder="Opcional para carteirinha" />
              </div>

              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">CPF</label>
                  <input className={inputClass} value={data.cpf || ''} onChange={e => onChange('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">RG</label>
                  <input className={inputClass} value={data.rg || ''} onChange={e => onChange('rg', e.target.value)} />
              </div>
              <div className="md:col-span-4">
                   <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Estado Civil</label>
                   <select className={inputClass} value={data.maritalStatus || 'Solteiro(a)'} onChange={e => onChange('maritalStatus', e.target.value)}>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                   </select>
              </div>

              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nacionalidade</label>
                  <input className={inputClass} value={data.nationality || 'Brasileira'} onChange={e => onChange('nationality', e.target.value)} />
              </div>
              <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Naturalidade (Cidade)</label>
                  <input className={inputClass} value={data.naturalness || ''} onChange={e => onChange('naturalness', e.target.value)} />
              </div>
              <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">UF (Naturalidade)</label>
                  <select className={inputClass} value={data.naturalnessState || ''} onChange={e => onChange('naturalnessState', e.target.value)}>
                     <option value="">Selecione</option>
                     {BRAZIL_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
              </div>

              <div className="md:col-span-12">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Profissão</label>
                  <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input className={`${inputClass} pl-9`} value={data.profession || ''} onChange={e => onChange('profession', e.target.value)} placeholder="Ex: Professor, Autônomo..." />
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
                  <input className={inputClass} value={data.phone || ''} onChange={e => onChange('phone', formatPhone(e.target.value))} placeholder="(00) 00000-0000" />
              </div>
              <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                  <input type="email" className={inputClass} value={data.email || ''} onChange={e => onChange('email', e.target.value)} />
              </div>
              
              <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">CEP</label>
                  <input className={inputClass} value={data.postalCode || ''} onChange={e => onChange('postalCode', formatCEP(e.target.value))} />
              </div>
              <div className="md:col-span-9">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Endereço Completo</label>
                  <input className={inputClass} value={data.address || ''} onChange={e => onChange('address', e.target.value)} placeholder="Rua, Número, Bairro" />
              </div>
              
              <div className="md:col-span-8">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cidade</label>
                  <input className={inputClass} value={data.city || ''} onChange={e => onChange('city', e.target.value)} />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Estado (UF)</label>
                  <select className={inputClass} value={data.state || ''} onChange={e => onChange('state', e.target.value)}>
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
                        className={`${inputClass} flex-1`}
                        placeholder="Nome (ex: Jardim Esperança)"
                        value={newCongregationName}
                        onChange={e => setNewCongregationName(e.target.value)}
                      />
                      <button type="button" onClick={handleSaveCongregation} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700" title="Confirmar"><CheckCircle className="w-4 h-4"/></button>
                      <button type="button" onClick={() => setIsAddingCongregation(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-600 p-2 rounded-lg hover:bg-slate-300" title="Cancelar"><X className="w-4 h-4"/></button>
                    </div>
                 ) : (
                    <div className="flex gap-2">
                      <select className={`${inputClass} flex-1`} value={data.congregation || '001 - Sede'} onChange={e => onChange('congregation', e.target.value)}>
                          {availableCongregations.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="button" onClick={() => setIsAddingCongregation(true)} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-2 rounded-lg hover:bg-blue-200" title="Adicionar Nova Congregação"><Plus className="w-4 h-4"/></button>
                    </div>
                 )}
                 <p className="text-[10px] text-slate-400 mt-1">O sistema atribui numeração automática (001, 002...) para novas congregações.</p>
              </div>

              <div className="md:col-span-3">
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cargo / Função</label>
                 {isAddingRole ? (
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            autoFocus
                            className={`${inputClass} flex-1`}
                            placeholder="Ex: Tesoureiro"
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value)}
                        />
                        <button type="button" onClick={handleSaveRole} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700" title="Confirmar"><CheckCircle className="w-4 h-4"/></button>
                        <button type="button" onClick={() => setIsAddingRole(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-600 p-2 rounded-lg hover:bg-slate-300" title="Cancelar"><X className="w-4 h-4"/></button>
                     </div>
                 ) : (
                    <div className="flex gap-2">
                        <select className={`${inputClass} flex-1`} value={data.role || 'Membro'} onChange={e => onChange('role', e.target.value)}>
                            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button type="button" onClick={() => setIsAddingRole(true)} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-2 rounded-lg hover:bg-blue-200" title="Adicionar Novo Cargo"><Plus className="w-4 h-4"/></button>
                    </div>
                 )}
              </div>
              <div className="md:col-span-3">
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Situação (Status)</label>
                 <select className={inputClass} value={data.status || 'Ativo'} onChange={e => onChange('status', e.target.value)}>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Visitante">Visitante</option>
                    <option value="Em Disciplina">Em Disciplina</option>
                 </select>
              </div>

              <div className="md:col-span-6">
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ministério / Departamento</label>
                 <input className={inputClass} value={data.ministry || ''} onChange={e => onChange('ministry', e.target.value)} placeholder="Ex: Louvor, Infantil, Jovens" />
              </div>
              <div className="md:col-span-6">
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Igreja Anterior</label>
                 <input className={inputClass} value={data.previousChurch || ''} onChange={e => onChange('previousChurch', e.target.value)} />
              </div>

              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de Admissão</label>
                  <input type="date" className={inputClass} value={data.joinedAt || ''} onChange={e => onChange('joinedAt', e.target.value)} />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-500"/> Batismo nas Águas</label>
                  <input type="date" className={inputClass} value={data.baptismDate || ''} onChange={e => onChange('baptismDate', e.target.value)} />
              </div>
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-500"/> Batismo Espírito Santo</label>
                  <input type="date" className={inputClass} value={data.holySpiritBaptismDate || ''} onChange={e => onChange('holySpiritBaptismDate', e.target.value)} />
              </div>
          </div>
      </section>

      {/* 4. PRIVACIDADE E LGPD - NOVO MODELO DE ACEITE DIGITAL */}
      <section>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide border-b border-blue-100 dark:border-blue-900/50 pb-2 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 4. Privacidade e Consentimento (LGPD)
          </h4>
          
          <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              
              {/* CENÁRIO 1: JÁ DEU O ACEITE */}
              {data.lgpdConsent ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-3">
                          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Termo de Consentimento Aceito</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                          Aceite registrado em: <span className="font-mono font-bold">{new Date(data.lgpdConsentDate!).toLocaleDateString('pt-BR')} às {new Date(data.lgpdConsentDate!).toLocaleTimeString('pt-BR')}</span>
                      </p>
                      {isAdmin && (
                        <button 
                             type="button"
                             onClick={() => {
                                 if(confirm("Deseja revogar o aceite deste membro? Ele terá que aceitar novamente.")) {
                                     onChange('lgpdConsent', false);
                                     onChange('lgpdConsentDate', null);
                                 }
                             }}
                             className="mt-4 text-xs text-red-500 hover:text-red-700 underline"
                        >
                            (Admin) Revogar Aceite
                        </button>
                      )}
                  </div>
              ) : (
                  /* CENÁRIO 2: AINDA NÃO ACEITOU */
                  <>
                    {/* Se for o PRÓPRIO membro logado visualizando seu perfil */}
                    {isOwnProfile ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-bold text-sm">Ação Necessária: Leia e aceite os termos abaixo.</span>
                            </div>

                            {/* Caixa de Texto com o Termo */}
                            <div className="h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed shadow-inner">
                                <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm">{LGPD_TERM_TEXT}</pre>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                                    <input 
                                        type="checkbox" 
                                        className="w-6 h-6 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        checked={data.lgpdConsent || false}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                if(confirm("Ao confirmar, você declara estar de acordo com o tratamento de seus dados pela igreja conforme descrito no termo.")) {
                                                    onChange('lgpdConsent', true);
                                                    onChange('lgpdConsentDate', new Date().toISOString());
                                                }
                                            }
                                        }}
                                    />
                                    <div className="flex-1">
                                        <span className="block font-bold text-slate-800 dark:text-white">
                                            Li e concordo com o Termo de Consentimento
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Ao marcar esta opção, seu aceite será registrado digitalmente no sistema.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    ) : (
                        /* Se for um ADMIN ou outro usuário vendo o perfil (Visualização de Status) */
                        <div className="text-center py-6">
                             <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                <Lock className="w-8 h-8 text-slate-400" />
                             </div>
                             <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">Aguardando Aceite do Membro</h3>
                             <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                                 O membro deve acessar o sistema com seu próprio login para ler e aceitar o termo digitalmente.
                             </p>
                             
                             {/* Fallback Manual para Admin (Caso membro seja idoso/sem acesso) */}
                             {isAdmin && (
                                 <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                                     <p className="text-xs font-bold text-slate-400 uppercase mb-2">Opção Manual (Exceção)</p>
                                     <label className="flex items-center justify-center gap-2 cursor-pointer opacity-75 hover:opacity-100">
                                        <input 
                                            type="checkbox" 
                                            className="rounded text-slate-500"
                                            onChange={e => {
                                                if(confirm("ATENÇÃO: Utilize esta opção apenas se o membro assinou o termo físico e você está arquivando-o. Deseja registrar o aceite manual?")) {
                                                    onChange('lgpdConsent', true);
                                                    onChange('lgpdConsentDate', new Date().toISOString());
                                                }
                                            }}
                                        />
                                        <span className="text-xs text-slate-500">Registrar aceite manualmente (Membro assinou papel)</span>
                                     </label>
                                 </div>
                             )}
                        </div>
                    )}
                  </>
              )}
          </div>
      </section>
  </div>
)};

interface MembersProps {
    userRole: UserRole;
    privacyMode?: boolean;
    members: Member[];
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
    currentUserEmail?: string;
}

export const Members: React.FC<MembersProps> = ({ userRole, privacyMode = false, members, setMembers, currentUserEmail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<Member>>({});
  
  // LISTA DE CONGREGAÇÕES COM NUMERAÇÃO INICIAL
  const [congregations, setCongregations] = useState<string[]>(['001 - Sede']);
  
  // LISTA DE CARGOS DISPONÍVEIS
  const [availableRoles, setAvailableRoles] = useState<string[]>(DEFAULT_ROLES);
  
  // Atualiza a lista de congregações e cargos baseado nos membros existentes
  useEffect(() => {
    if (members.length > 0) {
        // Congregações
        const uniqueCongregations = new Set(congregations);
        
        // Cargos
        const uniqueRoles = new Set(availableRoles);

        members.forEach(m => {
            if (m.congregation) uniqueCongregations.add(m.congregation);
            if (m.role) uniqueRoles.add(m.role);
        });

        setCongregations(Array.from(uniqueCongregations).sort());
        setAvailableRoles(Array.from(uniqueRoles)); // Não ordenar para manter a ordem de hierarquia sugerida no DEFAULT_ROLES no topo, ou se preferir sort, adicionar .sort()
    }
  }, [members]);

  const [isSaving, setIsSaving] = useState(false);

  // Certificate State
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedMemberForCert, setSelectedMemberForCert] = useState<Member | null>(null);
  const [certType, setCertType] = useState('Batismo nas Águas');
  const [certDesc, setCertDesc] = useState('Declaramos que o membro acima está em plena comunhão com esta igreja.');

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.code && member.code.includes(searchTerm))
  );

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentMember({
        name: '', email: '', role: 'Membro', status: MemberStatus.ACTIVE,
        joinedAt: new Date().toISOString().split('T')[0], nationality: 'Brasileira', 
        congregation: '001 - Sede' // Padrão Sede
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
        // GERAÇÃO DO CÓDIGO DO MEMBRO (Ano.Congregação.Sequencia)
        // Só gera se não tiver código e se tivermos as informações necessárias
        if (!currentMember.code && currentMember.joinedAt && currentMember.congregation) {
            const admissionYear = new Date(currentMember.joinedAt).getFullYear();
            
            // Extrai o código "001" da string "001 - Sede"
            const congCode = getCongregationCode(currentMember.congregation);
            
            // Conta quantos membros existem nessa congregação nesse ano (para gerar sequência)
            const existingInYearAndCong = members.filter(m => {
                if(!m.joinedAt) return false;
                const mYear = new Date(m.joinedAt).getFullYear();
                const mCong = m.congregation || '001 - Sede';
                return mYear === admissionYear && mCong === currentMember.congregation;
            });
            
            const sequence = (existingInYearAndCong.length + 1).toString().padStart(3, '0');
            currentMember.code = `${admissionYear}.${congCode}.${sequence}`;
        }

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

  // Classe padrão para inputs nos modais
  const modalInputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500";

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
            <input type="text" placeholder="Buscar por nome, cargo ou código..." className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Membro</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Código</th>
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
                      <div className="relative h-10 w-10 mr-3">
                         <div className="h-full w-full rounded-full bg-slate-200 overflow-hidden">
                             {member.photoUrl && <img src={member.photoUrl} alt="" className="h-full w-full object-cover" />}
                         </div>
                         {member.lgpdConsent && (
                             <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5" title="Consentimento LGPD Ativo">
                                 <ShieldCheck className="w-4 h-4 text-green-500" />
                             </div>
                         )}
                      </div>
                      <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                          <div className="text-xs text-slate-500">{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      {member.code ? (
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                              {member.code}
                          </span>
                      ) : (
                          <span className="text-xs text-slate-400 italic">--</span>
                      )}
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
               <MemberFormContent 
                data={currentMember} 
                onChange={(f: any, v: any) => setCurrentMember(prev => ({...prev, [f]: v}))} 
                isAdmin={true} 
                availableCongregations={congregations} 
                onAddCongregation={(name: string) => setCongregations([...congregations, name])} 
                availableRoles={availableRoles}
                onAddRole={(name: string) => setAvailableRoles([...availableRoles, name])}
                currentUserEmail={currentUserEmail}
               />
               <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 border rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600">Cancelar</button>
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
                         <div className="p-3 bg-white border border-slate-200 dark:bg-slate-700 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-200">
                             {selectedMemberForCert?.name}
                         </div>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Certificado</label>
                         <select 
                            className={modalInputClass}
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
                            className={modalInputClass}
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
