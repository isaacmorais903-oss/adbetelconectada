
-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE)
-- Copie este código e cole no SQL Editor do seu projeto Supabase e clique em RUN.
-- ============================================================================

-- 1. CRIAÇÃO DAS TABELAS

-- Tabela de Membros
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT, -- Numeração (Ano.Congregacao.Sequencia)
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  "photoUrl" TEXT,
  role TEXT DEFAULT 'Membro',
  status TEXT DEFAULT 'Ativo',
  
  -- Informações Pessoais
  "birthDate" DATE,
  cpf TEXT,
  rg TEXT,
  "maritalStatus" TEXT,
  nationality TEXT,
  naturalness TEXT,
  "naturalnessState" TEXT,
  profession TEXT,
  
  -- Endereço
  address TEXT,
  city TEXT,
  state TEXT,
  "postalCode" TEXT,
  
  -- Eclesiástico
  congregation TEXT,
  ministry TEXT,
  "joinedAt" DATE DEFAULT NOW(),
  "baptismDate" DATE,
  "holySpiritBaptismDate" DATE,
  "previousChurch" TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Transações (Tesouraria)
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

-- Tabela de Patrimônio (Inventário)
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

-- Tabela de Avisos
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT,
  date DATE DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Locais
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  address TEXT,
  city TEXT,
  "serviceTimes" TEXT,
  "mapUrl" TEXT,
  "imageUrl" TEXT, -- Foto da Fachada
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Pedidos de Oração
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "requesterName" TEXT,
  request TEXT NOT NULL,
  date DATE DEFAULT NOW(),
  status TEXT DEFAULT 'Novo',
  "isPrivate" BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Configurações da Igreja (Redes Sociais, etc)
CREATE TABLE IF NOT EXISTS church_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GARANTIA DE COLUNAS (Para atualizar tabelas existentes sem perder dados)
DO $$
BEGIN
    -- Members: code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='code') THEN
        ALTER TABLE members ADD COLUMN code TEXT;
    END IF;
    -- Locations: imageUrl
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='imageUrl') THEN
        ALTER TABLE locations ADD COLUMN "imageUrl" TEXT;
    END IF;
    -- Transactions: paymentMethod
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='paymentMethod') THEN
        ALTER TABLE transactions ADD COLUMN "paymentMethod" TEXT;
    END IF;
END
$$;

-- 3. SEGURANÇA (ROW LEVEL SECURITY - RLS)

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACESSO (POLICIES)
-- Removemos as antigas primeiro para evitar erro de duplicidade ao rodar o script novamente

-- MEMBERS
DROP POLICY IF EXISTS "Leitura Membros" ON members;
DROP POLICY IF EXISTS "Escrita Membros" ON members;
CREATE POLICY "Leitura Membros" ON members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Membros" ON members FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ILIKE '%admin%');

-- TRANSACTIONS
DROP POLICY IF EXISTS "Admin Financeiro" ON transactions;
CREATE POLICY "Admin Financeiro" ON transactions FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ILIKE '%admin%');

-- INVENTORY
DROP POLICY IF EXISTS "Leitura Inventario" ON inventory;
DROP POLICY IF EXISTS "Escrita Inventario" ON inventory;
CREATE POLICY "Leitura Inventario" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Inventario" ON inventory FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ILIKE '%admin%');

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Leitura Avisos" ON announcements;
DROP POLICY IF EXISTS "Escrita Avisos" ON announcements;
CREATE POLICY "Leitura Avisos" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Avisos" ON announcements FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ILIKE '%admin%');

-- LOCATIONS
DROP POLICY IF EXISTS "Leitura Locais" ON locations;
DROP POLICY IF EXISTS "Escrita Locais" ON locations;
CREATE POLICY "Leitura Locais" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Locais" ON locations FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ILIKE '%admin%');

-- PRAYER REQUESTS
DROP POLICY IF EXISTS "Criar Pedido" ON prayer_requests;
DROP POLICY IF EXISTS "Ler Pedidos Publicos" ON prayer_requests;
DROP POLICY IF EXISTS "Admin Orações" ON prayer_requests;
CREATE POLICY "Criar Pedido" ON prayer_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Ler Pedidos Publicos" ON prayer_requests FOR SELECT TO authenticated USING ("isPrivate" = false OR auth.jwt() ->> 'email' ILIKE '%admin%');
CREATE POLICY "Admin Orações" ON prayer_requests FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ILIKE '%admin%');

-- CHURCH SETTINGS
DROP POLICY IF EXISTS "Leitura Configs" ON church_settings;
DROP POLICY IF EXISTS "Escrita Configs" ON church_settings;
CREATE POLICY "Leitura Configs" ON church_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escrita Configs" ON church_settings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' ILIKE '%admin%');
