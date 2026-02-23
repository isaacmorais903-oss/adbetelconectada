
-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE) - ATUALIZADO
-- Inclui novas regras de e-mail para Administradores (pastor, adm, lider, etc)
-- ============================================================================

-- 1. CRIAÇÃO DAS TABELAS (Se não existirem)

CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT, 
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  "photoUrl" TEXT,
  role TEXT DEFAULT 'Membro',
  status TEXT DEFAULT 'Ativo',
  "birthDate" DATE,
  cpf TEXT,
  rg TEXT,
  "maritalStatus" TEXT,
  nationality TEXT,
  naturalness TEXT,
  "naturalnessState" TEXT,
  profession TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  "postalCode" TEXT,
  congregation TEXT,
  ministry TEXT,
  "joinedAt" DATE DEFAULT NOW(),
  "baptismDate" DATE,
  "holySpiritBaptismDate" DATE,
  "previousChurch" TEXT,
  "lgpdConsent" BOOLEAN DEFAULT false,
  "lgpdConsentDate" TIMESTAMPTZ,
  "followupStage" TEXT, -- Campo novo para Discipulado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela Nova: Anotações sobre Membros (Histórico de Discipulado)
CREATE TABLE IF NOT EXISTS member_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "memberId" UUID REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT, -- Quem escreveu a nota
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela Nova: Ministérios (Para persistir a lista de opções)
CREATE TABLE IF NOT EXISTS ministries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  "paymentMethod" TEXT,
  date DATE NOT NULL,
  "memberId" UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 1,
  "estimatedValue" NUMERIC(10,2) DEFAULT 0,
  "acquisitionDate" DATE,
  location TEXT,
  status TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT,
  date DATE DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  address TEXT,
  city TEXT,
  "serviceTimes" TEXT,
  "mapUrl" TEXT,
  "imageUrl" TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "requesterName" TEXT,
  request TEXT NOT NULL,
  date DATE DEFAULT NOW(),
  status TEXT DEFAULT 'Novo',
  "isPrivate" BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS church_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ATUALIZAÇÃO DE COLUNAS (Caso tabelas existam mas falte campos)
DO $$
BEGIN
    -- Members: followupStage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='followupStage') THEN
        ALTER TABLE members ADD COLUMN "followupStage" TEXT;
    END IF;

    -- Members: code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='code') THEN
        ALTER TABLE members ADD COLUMN code TEXT;
    END IF;
    -- Members: lgpdConsent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='lgpdConsent') THEN
        ALTER TABLE members ADD COLUMN "lgpdConsent" BOOLEAN DEFAULT false;
    END IF;
    -- Members: lgpdConsentDate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='lgpdConsentDate') THEN
        ALTER TABLE members ADD COLUMN "lgpdConsentDate" TIMESTAMPTZ;
    END IF;
    -- Locations: imageUrl
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='imageUrl') THEN
        ALTER TABLE locations ADD COLUMN "imageUrl" TEXT;
    END IF;
    -- Transactions: paymentMethod
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='paymentMethod') THEN
        ALTER TABLE transactions ADD COLUMN "paymentMethod" TEXT;
    END IF;
    -- Church Settings: financial_pin
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='church_settings' AND column_name='financial_pin') THEN
        ALTER TABLE church_settings ADD COLUMN "financial_pin" TEXT DEFAULT '0000';
    END IF;
END
$$;

-- 3. HABILITAR RLS (Row Level Security)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACESSO (Recriação Segura)

-- TABLE: MEMBERS
DROP POLICY IF EXISTS "Leitura Membros" ON members;
DROP POLICY IF EXISTS "Leitura Membros Restrita" ON members; -- Adicionado para garantir limpeza
DROP POLICY IF EXISTS "Escrita Membros" ON members;
DROP POLICY IF EXISTS "Admin Insert Delete Membros" ON members;
DROP POLICY IF EXISTS "Admin Delete Membros" ON members;
DROP POLICY IF EXISTS "Admin Update Membros" ON members;
DROP POLICY IF EXISTS "Self Update Membros" ON members;

-- Leitura: Todos autenticados podem ler (necessário para listar membros, mas frontend filtra)
-- Idealmente, membros comuns só deveriam ler o próprio perfil, mas para recursos sociais (aniversariantes, etc) deixamos aberto leitura.
-- NOTA: Esta política antiga é substituída pela "Leitura Membros Restrita" mais abaixo, mas mantemos o DROP acima por segurança.

-- Escrita (INSERT/DELETE): Apenas Admins
CREATE POLICY "Admin Insert Delete Membros" ON members FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria'
);

CREATE POLICY "Admin Delete Membros" ON members FOR DELETE TO authenticated USING (
    auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria'
);

-- Atualização (UPDATE): Admins (Tudo) OU Próprio Usuário (Restrito via Trigger abaixo)
CREATE POLICY "Admin Update Membros" ON members FOR UPDATE TO authenticated USING (
    auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria'
);

CREATE POLICY "Self Update Membros" ON members FOR UPDATE TO authenticated USING (
    email = auth.jwt() ->> 'email'
);


-- 5. TRIGGERS DE SEGURANÇA (NOVO)
-- Impede que um usuário comum altere seu próprio cargo (role) ou status para virar admin
CREATE OR REPLACE FUNCTION check_member_update_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o usuário NÃO for admin (verificado pelo email no JWT)
    IF NOT (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria') THEN
        -- Não pode alterar o ROLE
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Apenas administradores podem alterar cargos.';
        END IF;
        -- Não pode alterar o STATUS
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Apenas administradores podem alterar o status.';
        END IF;
         -- Não pode alterar a CONGREGAÇÃO (evitar bagunça)
        IF NEW.congregation IS DISTINCT FROM OLD.congregation THEN
            RAISE EXCEPTION 'Apenas administradores podem alterar a congregação.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove trigger anterior se existir para recriar
DROP TRIGGER IF EXISTS on_member_update_check ON members;

CREATE TRIGGER on_member_update_check
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION check_member_update_permissions();


-- 6. VIEW PÚBLICA E SEGURANÇA DE DADOS (NOVO - BLINDAGEM)

-- Cria uma "View" (Tabela Virtual) que mostra APENAS dados seguros.
-- Usamos SECURITY DEFINER para que esta view tenha permissão de ler a tabela members
-- mesmo que o usuário comum não tenha permissão direta de leitura na tabela members.
DROP VIEW IF EXISTS members_public_view;
CREATE OR REPLACE VIEW members_public_view WITH (security_invoker = false) AS
SELECT 
    id, 
    code, -- ADICIONADO: Código do membro é público
    name, 
    role, 
    status, 
    "photoUrl", 
    congregation, 
    ministry, 
    "joinedAt",
    email, -- Necessário para identificar o usuário
    "lgpdConsent", -- ADICIONADO: Status do aceite é relevante
    "lgpdConsentDate" -- ADICIONADO
FROM members
WHERE status != 'Inativo'; -- Opcional: não listar inativos publicamente

-- Concede permissão de leitura na view para usuários autenticados
GRANT SELECT ON members_public_view TO authenticated;

-- REFAZ A POLÍTICA DE LEITURA DA TABELA MEMBERS (Agora Restritiva)
DROP POLICY IF EXISTS "Leitura Membros" ON members;

-- Nova Política: 
-- 1. Admins veem tudo.
-- 2. O próprio usuário vê seu registro completo (para editar perfil).
-- 3. NINGUÉM MAIS vê dados diretos da tabela members (devem usar a view acima).
CREATE POLICY "Leitura Membros Restrita" ON members FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria') 
    OR 
    (email = auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Admin Notes" ON member_notes;
CREATE POLICY "Admin Notes" ON member_notes FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');

-- TABLE: MINISTRIES
DROP POLICY IF EXISTS "Leitura Ministerios" ON ministries;
DROP POLICY IF EXISTS "Escrita Ministerios" ON ministries;
CREATE POLICY "Leitura Ministerios" ON ministries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Ministerios" ON ministries FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');

-- TABLE: TRANSACTIONS
DROP POLICY IF EXISTS "Admin Financeiro" ON transactions;
CREATE POLICY "Admin Financeiro" ON transactions FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');

-- TABLE: INVENTORY
DROP POLICY IF EXISTS "Leitura Inventario" ON inventory;
DROP POLICY IF EXISTS "Escrita Inventario" ON inventory;
CREATE POLICY "Leitura Inventario" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Inventario" ON inventory FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');

-- TABLE: ANNOUNCEMENTS
DROP POLICY IF EXISTS "Leitura Avisos" ON announcements;
DROP POLICY IF EXISTS "Escrita Avisos" ON announcements;
CREATE POLICY "Leitura Avisos" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Avisos" ON announcements FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');

-- TABLE: LOCATIONS
DROP POLICY IF EXISTS "Leitura Locais" ON locations;
DROP POLICY IF EXISTS "Escrita Locais" ON locations;
CREATE POLICY "Leitura Locais" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Locais" ON locations FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');

-- TABLE: PRAYER_REQUESTS
DROP POLICY IF EXISTS "Criar Pedido" ON prayer_requests;
DROP POLICY IF EXISTS "Ler Pedidos Publicos" ON prayer_requests;
DROP POLICY IF EXISTS "Admin Orações" ON prayer_requests;
CREATE POLICY "Criar Pedido" ON prayer_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Ler Pedidos Publicos" ON prayer_requests FOR SELECT TO authenticated USING ("isPrivate" = false OR auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');
CREATE POLICY "Admin Orações" ON prayer_requests FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');

-- TABLE: CHURCH_SETTINGS
DROP POLICY IF EXISTS "Leitura Configs" ON church_settings;
DROP POLICY IF EXISTS "Escrita Configs" ON church_settings;
CREATE POLICY "Leitura Configs" ON church_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Configs" ON church_settings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');

-- 7. MÓDULO PASTORAL (NOVO)
CREATE TABLE IF NOT EXISTS pastoral_care (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  person_name TEXT NOT NULL,
  date DATE DEFAULT NOW(),
  subject TEXT NOT NULL,
  notes TEXT NOT NULL,
  status TEXT DEFAULT 'Aberto',
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pastoral_care ENABLE ROW LEVEL SECURITY;

-- Política de Segurança Extrema: Apenas Admins (Pastores) podem ver ou tocar nesta tabela.
-- NENHUM membro comum tem acesso, nem leitura.
DROP POLICY IF EXISTS "Admin Pastoral" ON pastoral_care;
CREATE POLICY "Admin Pastoral" ON pastoral_care FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');

-- 8. MÓDULO CONTAS A PAGAR (NOVO)
CREATE TABLE IF NOT EXISTS accounts_payable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  "dueDate" DATE NOT NULL,
  "paymentDate" DATE,
  status TEXT DEFAULT 'Pendente', -- Pendente, Pago, Atrasado
  "hasInterest" BOOLEAN DEFAULT false,
  "interestAmount" NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin Contas Pagar" ON accounts_payable;
CREATE POLICY "Admin Contas Pagar" ON accounts_payable FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ~* 'admin|adm|pastor|lider|secretaria|tesouraria');
