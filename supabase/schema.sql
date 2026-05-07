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

-- 4. RLS AKTİF ET
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

CREATE OR REPLACE FUNCTION has_board_access(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM boards
    WHERE id = b_id AND (
      (team_id IS NULL AND user_id = auth.uid())
      OR 
      (team_id IS NOT NULL AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. POLİTİKALAR (RLS)
CREATE POLICY "Users can view profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own teams" ON teams FOR SELECT USING (is_team_member(id));
CREATE POLICY "Users can view team members" ON team_members FOR SELECT USING (is_team_member(team_id));

CREATE POLICY "Boards Access Policy" ON boards FOR SELECT USING (
  (team_id IS NULL AND auth.uid() = user_id) OR (team_id IS NOT NULL AND is_team_member(team_id))
);
CREATE POLICY "Users can create boards" ON boards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view columns" ON columns FOR SELECT USING (has_board_access(board_id));
CREATE POLICY "Users can manage columns" ON columns FOR ALL USING (has_board_access(board_id));

CREATE POLICY "Users can view cards" ON cards FOR SELECT USING (
  EXISTS (SELECT 1 FROM columns WHERE id = cards.column_id AND has_board_access(board_id))
);
CREATE POLICY "Users can manage cards" ON cards FOR ALL USING (
  EXISTS (SELECT 1 FROM columns WHERE id = cards.column_id AND has_board_access(board_id))
);

CREATE POLICY "Users can view labels" ON labels FOR SELECT USING (has_board_access(board_id));
CREATE POLICY "Users can manage labels" ON labels FOR ALL USING (has_board_access(board_id));

CREATE POLICY "Users can view activities" ON activities FOR SELECT USING (has_board_access(board_id));
CREATE POLICY "Users can create activities" ON activities FOR INSERT WITH CHECK (has_board_access(board_id));
