-- Migration 002: chapters
-- Geographic chapters + HQ (special chapter).

CREATE TABLE IF NOT EXISTS chapters (
  chapter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  is_hq BOOLEAN NOT NULL DEFAULT false,
  location VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read chapters
CREATE POLICY "chapters_select_authenticated" ON chapters
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Board-only inserts
CREATE POLICY "chapters_insert_board" ON chapters
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- Board-only updates
CREATE POLICY "chapters_update_board" ON chapters
  FOR UPDATE
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- No DELETE policy (chapters are never deleted)

-- Indexes
CREATE INDEX idx_chapters_is_hq ON chapters(is_hq);
