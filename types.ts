

export type UserRole = 'admin' | 'member';

export enum MemberStatus {
  ACTIVE = 'Ativo',
  INACTIVE = 'Inativo',
  VISITOR = 'Visitante'
}

export interface Member {
  id: string;
  // 1. Informações Pessoais
  name: string;
  birthDate?: string;
  // Idade é calculado no front
  naturalness?: string; // Agora usado para Cidade da Naturalidade
  naturalnessState?: string; // Novo: UF da Naturalidade
  nationality?: string; // Nacionalidade
  rg?: string;
  cpf?: string;
  maritalStatus?: string; // Estado Civil
  profession?: string;
  photoUrl?: string;

  // 2. Contato e Endereço
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string; // Novo: UF do Endereço
  postalCode?: string;

  // 3. Informações Eclesiásticas
  role: string; // Cargo/Função
  status: MemberStatus;
  congregation?: string;
  ministry?: string; // Ministério (ex: Louvor, Infantil)
  baptismDate?: string; // Batismo nas Águas
  holySpiritBaptismDate?: string; // Batismo Espírito Santo
  previousChurch?: string; // Igreja Anterior
  joinedAt: string; // Data de Admissão
}

export enum AnnouncementType {
  GENERAL = 'Geral',
  URGENT = 'Urgente',
  EVENT = 'Evento'
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  date: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod?: 'Pix' | 'Dinheiro' | 'Cartão' | 'Outros'; // Campo Adicionado
  date: string;
  memberId?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  type: 'Sede' | 'Congregação' | 'Ponto de Pregação' | string;
  serviceTimes: string;
  mapUrl: string; // Google Maps Link
  imageUrl?: string; // Foto da fachada
}

export interface PrayerRequest {
  id: string;
  requesterName: string;
  request: string;
  date: string;
  status: 'Novo' | 'Em Oração' | 'Respondido';
  isPrivate: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // Móveis, Eletrônicos, Instrumentos, Liturgia
  quantity: number;
  estimatedValue: number; // Valor unitário estimado
  acquisitionDate?: string;
  location: string; // Templo Principal, Salão Anexo, Secretaria
  status: 'Novo' | 'Bom' | 'Desgastado' | 'Danificado' | 'Em Manutenção';
  description?: string;
}

export type View = 'dashboard' | 'members' | 'finance' | 'announcements' | 'locations' | 'prayers' | 'inventory';