-- =============================================
-- TaskFlow Kanban - Supabase Database Schema
-- =============================================

-- 1. Profiles tablosu (auth.users ile bağlantılı)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Teams tablosu
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Team Members tablosu
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (team_id, user_id)
);

-- 2. Boards tablosu
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Columns tablosu
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cards tablosu
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  position TEXT NOT NULL,
  priority TEXT DEFAULT 'none',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Labels tablosu
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6'
);

-- 6. Card-Label ilişki tablosu (Many-to-Many)
CREATE TABLE IF NOT EXISTS card_labels (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- 7. Activities tablosu (Aktivite Günlüğü)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS) Politikaları
-- =============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RBAC Helper Fonksiyonu
-- =============================================
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

-- Profiles: Giriş yapmış herkes profilleri görebilir (üye eklemek için)
CREATE POLICY "Authenticated users can view profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams: Kendi takımlarını görebilir
CREATE POLICY "Users can view own teams" ON teams FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id AND user_id = auth.uid())
);

-- Team Members: Takım üyelerini görebilir
CREATE POLICY "Users can view team members" ON team_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid())
);

-- Boards: Gelişmiş RBAC (Kişisel veya Takım)
CREATE POLICY "Boards Access Policy" ON boards FOR SELECT USING (
  (team_id IS NULL AND auth.uid() = user_id) OR (team_id IS NOT NULL AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can create boards" ON boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boards" ON boards FOR UPDATE USING (
  (team_id IS NULL AND auth.uid() = user_id) OR (team_id IS NOT NULL AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can delete own boards" ON boards FOR DELETE USING (auth.uid() = user_id);

-- Columns: RBAC Helper kullan
CREATE POLICY "Users can view columns" ON columns FOR SELECT USING (has_board_access(board_id));
CREATE POLICY "Users can create columns" ON columns FOR INSERT WITH CHECK (has_board_access(board_id));
CREATE POLICY "Users can update columns" ON columns FOR UPDATE USING (has_board_access(board_id));
CREATE POLICY "Users can delete columns" ON columns FOR DELETE USING (has_board_access(board_id));

-- Cards: RBAC Helper kullan
CREATE POLICY "Users can view cards" ON cards FOR SELECT USING (
  EXISTS (SELECT 1 FROM columns WHERE columns.id = cards.column_id AND has_board_access(columns.board_id))
);
CREATE POLICY "Users can create cards" ON cards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM columns WHERE columns.id = cards.column_id AND has_board_access(columns.board_id))
);
CREATE POLICY "Users can update cards" ON cards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM columns WHERE columns.id = cards.column_id AND has_board_access(columns.board_id))
);
CREATE POLICY "Users can delete cards" ON cards FOR DELETE USING (
  EXISTS (SELECT 1 FROM columns WHERE columns.id = cards.column_id AND has_board_access(columns.board_id))
);

-- Labels: RBAC Helper kullan
CREATE POLICY "Users can view labels" ON labels FOR SELECT USING (has_board_access(board_id));
CREATE POLICY "Users can create labels" ON labels FOR INSERT WITH CHECK (has_board_access(board_id));
CREATE POLICY "Users can delete labels" ON labels FOR DELETE USING (has_board_access(board_id));

-- Card Labels: RBAC Helper kullan
CREATE POLICY "Users can view card_labels" ON card_labels FOR SELECT USING (
  EXISTS (SELECT 1 FROM cards JOIN columns ON columns.id = cards.column_id WHERE cards.id = card_labels.card_id AND has_board_access(columns.board_id))
);
CREATE POLICY "Users can manage card_labels" ON card_labels FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM cards JOIN columns ON columns.id = cards.column_id WHERE cards.id = card_labels.card_id AND has_board_access(columns.board_id))
);
CREATE POLICY "Users can delete card_labels" ON card_labels FOR DELETE USING (
  EXISTS (SELECT 1 FROM cards JOIN columns ON columns.id = cards.column_id WHERE cards.id = card_labels.card_id AND has_board_access(columns.board_id))
);

-- Activities: RBAC Helper kullan
CREATE POLICY "Users can view activities" ON activities FOR SELECT USING (has_board_access(board_id));
CREATE POLICY "Users can create activities" ON activities FOR INSERT WITH CHECK (has_board_access(board_id));

-- =============================================
-- Profil otomatik oluşturma (trigger)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Optimizasyonlar ve Triggerlar (Performans)
-- =============================================

-- updated_at fonksiyonu ekle
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Cards tablosuna trigger bağla
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Performans için Index ekle (Sorgu hızlandırma)
CREATE INDEX IF NOT EXISTS idx_cards_column_id ON cards(column_id);
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_activities_board_id ON activities(board_id);
