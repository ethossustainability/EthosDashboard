-- Migration 001: org_roles
-- Lookup table for org-level roles.
-- Values are fixed:
-- 1 = Member, 2 = Project Lead, 3 = Board

CREATE TABLE IF NOT EXISTS org_roles (
  role_id INTEGER PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

-- Seed fixed role rows
INSERT INTO org_roles (role_id, role_name, description) VALUES
  (1, 'Member', 'Standard volunteer'),
  (2, 'Project Lead', 'Can create and manage own projects'),
  (3, 'Board', 'Universal access, no restrictions')
ON CONFLICT (role_id) DO NOTHING;

-- RLS
ALTER TABLE org_roles ENABLE ROW LEVEL SECURITY;

-- Everyone who is authenticated can read roles (UI + permission checks).
-- Writes are not allowed from the client (no INSERT/UPDATE/DELETE policies).
CREATE POLICY "org_roles_read_authenticated" ON org_roles
  FOR SELECT
  USING (auth.role() = 'authenticated');