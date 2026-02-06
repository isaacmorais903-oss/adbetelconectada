
-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE)
-- Copie este código e cole no SQL Editor do seu projeto Supabase.
-- ============================================================================

-- 1. CRIAÇÃO DAS TABELAS (Baseado nos tipos do TypeScript)

-- Tabela de Membros
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  amount NUMERIC(10,2) NOT NULL, -- Valores monetários
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  "paymentMethod" TEXT,
  date DATE NOT NULL,
  "memberId" UUID REFERENCES members(id) ON DELETE SET NULL, -- Relacionamento com membros
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
  "imageUrl" TEXT,
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

-- ============================================================================
-- 2. SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- Isso impede que hackers leiam ou apaguem dados usando sua chave pública.
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POLÍTICAS DE ACESSO (POLICIES)
-- Lógica: 
-- 1. Usuários autenticados (Membros logados) podem LER a maioria dos dados.
-- 2. Apenas ADMINS (emails contendo 'admin') podem ESCREVER/EDITAR/APAGAR.
-- ============================================================================

-- >>> TABELA MEMBERS <<<
-- Todos autenticados podem ler lista de membros (para aniversariantes, etc)
CREATE POLICY "Membros podem ver lista" ON members 
FOR SELECT TO authenticated USING (true);

-- Apenas Admin pode criar/editar/excluir membros
CREATE POLICY "Admin gerencia membros" ON members 
FOR ALL TO authenticated 
USING (auth.jwt() ->> 'email' ILIKE '%admin%') 
WITH CHECK (auth.jwt() ->> 'email' ILIKE '%admin%');


-- >>> TABELA TRANSACTIONS (Tesouraria - Dado Sensível) <<<
-- Apenas Admin vê e mexe no financeiro
CREATE POLICY "Apenas Admin acessa financeiro" ON transactions 
FOR ALL TO authenticated 
USING (auth.jwt() ->> 'email' ILIKE '%admin%');


-- >>> TABELA INVENTORY <<<
-- Todos podem ver o patrimônio (opcional, se quiser restringir mude para admin)
CREATE POLICY "Todos veem inventario" ON inventory 
FOR SELECT TO authenticated USING (true);

-- Apenas Admin altera inventário
CREATE POLICY "Admin gerencia inventario" ON inventory 
FOR ALL TO authenticated 
USING (auth.jwt() ->> 'email' ILIKE '%admin%');


-- >>> TABELA ANNOUNCEMENTS (Avisos) <<<
-- Todos leem
CREATE POLICY "Todos leem avisos" ON announcements 
FOR SELECT TO authenticated USING (true); -- Pode mudar para 'anon' se quiser site público

-- Admin posta
CREATE POLICY "Admin posta avisos" ON announcements 
FOR ALL TO authenticated 
USING (auth.jwt() ->> 'email' ILIKE '%admin%');


-- >>> TABELA LOCATIONS (Endereços) <<<
-- Todos leem
CREATE POLICY "Todos leem locais" ON locations 
FOR SELECT TO authenticated USING (true);

-- Admin gerencia
CREATE POLICY "Admin gerencia locais" ON locations 
FOR ALL TO authenticated 
USING (auth.jwt() ->> 'email' ILIKE '%admin%');


-- >>> TABELA PRAYER REQUESTS <<<
-- Todos podem criar pedidos
CREATE POLICY "Todos criam pedidos" ON prayer_requests 
FOR INSERT TO authenticated WITH CHECK (true);

-- Todos veem pedidos PÚBLICOS
CREATE POLICY "Ver pedidos publicos" ON prayer_requests 
FOR SELECT TO authenticated 
USING ("isPrivate" = false OR auth.jwt() ->> 'email' ILIKE '%admin%');

-- Admin gerencia tudo
CREATE POLICY "Admin gerencia oracoes" ON prayer_requests 
FOR UPDATE TO authenticated 
USING (auth.jwt() ->> 'email' ILIKE '%admin%');

CREATE POLICY "Admin apaga oracoes" ON prayer_requests 
FOR DELETE TO authenticated 
USING (auth.jwt() ->> 'email' ILIKE '%admin%');

