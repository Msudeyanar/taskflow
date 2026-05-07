-- =============================================
-- TaskFlow Kanban - Supabase Database Schema
-- =============================================

-- 1. ÖNCE ESKİ TABLOLARI SİLELİM (TEMİZ BİR BAŞLANGIÇ)
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS card_labels CASCADE;
DROP TABLE IF EXISTS labels CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS columns CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. EKLENTİYİ AKTİF ET
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. TABLOLARI YENİDEN OLUŞTUR
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  position TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_labels (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS AKTİF ET (KRİTİK GÜVENLİK ADIMI)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 5. YARDIMCI FONKSİYONLAR
CREATE OR REPLACE FUNCTION is_team_member(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = t_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. POLİTİKALAR (RLS) - KATILAŞTIRILMIŞ GÜVENLİK
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own teams" ON teams;
CREATE POLICY "Users can view own teams" ON teams FOR SELECT USING (is_team_member(id));

DROP POLICY IF EXISTS "Users can view team members" ON team_members;
CREATE POLICY "Users can view team members" ON team_members FOR SELECT USING (is_team_member(team_id));

DROP POLICY IF EXISTS "Boards Access Policy" ON boards;
CREATE POLICY "Boards Access Policy" ON boards FOR SELECT USING (
  (user_id = auth.uid()) OR 
  (team_id IS NOT NULL AND is_team_member(team_id))
);

DROP POLICY IF EXISTS "Users can create boards" ON boards;
CREATE POLICY "Users can create boards" ON boards FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view columns" ON columns;
CREATE POLICY "Users can view columns" ON columns FOR SELECT USING (
  EXISTS (SELECT 1 FROM boards WHERE id = columns.board_id AND (user_id = auth.uid() OR (team_id IS NOT NULL AND is_team_member(team_id))))
);

DROP POLICY IF EXISTS "Users can view cards" ON cards;
CREATE POLICY "Users can view cards" ON cards FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN boards ON boards.id = columns.board_id 
    WHERE columns.id = cards.column_id AND (
      boards.user_id = auth.uid() OR 
      (boards.team_id IS NOT NULL AND is_team_member(boards.team_id))
    )
  )
);

-- Genel yönetim izinleri
CREATE POLICY "Users can manage own columns" ON columns FOR ALL USING (
  EXISTS (SELECT 1 FROM boards WHERE id = columns.board_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage own cards" ON cards FOR ALL USING (
  EXISTS (SELECT 1 FROM columns JOIN boards ON boards.id = columns.board_id WHERE columns.id = cards.column_id AND boards.user_id = auth.uid())
);
