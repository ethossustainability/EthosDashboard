-- Migration 017: donations
-- Org-level donation records. Not tied to specific projects.
-- Depends on: fundraising_contacts, users

CREATE TABLE IF NOT EXISTS public.donations (
  donation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.fundraising_contacts(contact_id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  donated_at DATE NOT NULL,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_donations_contact_id ON public.donations(contact_id);
CREATE INDEX idx_donations_donated_at ON public.donations(donated_at);
CREATE INDEX idx_donations_recorded_by ON public.donations(recorded_by);

-- RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "donations_select_authenticated" ON public.donations
  FOR SELECT TO authenticated USING (true);

-- Board only can insert
CREATE POLICY "donations_insert_board" ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- Board only can update
CREATE POLICY "donations_update_board" ON public.donations
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- Board only can delete
CREATE POLICY "donations_delete_board" ON public.donations
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');