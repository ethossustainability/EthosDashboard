-- Migration 016: fundraising_contacts
-- Donors, partners, and contacts. Visible to all approved members.
-- Board manages for now. Fundraising HQ team lead takes over eventually.

CREATE TABLE IF NOT EXISTS public.fundraising_contacts (
  contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('Donor', 'Partner', 'Sponsor', 'Other')),
  email VARCHAR(150),
  phone VARCHAR(30),
  notes TEXT,
  added_by UUID NOT NULL REFERENCES public.users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.fundraising_contacts_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fundraising_contacts_set_updated_at ON public.fundraising_contacts;
CREATE TRIGGER trg_fundraising_contacts_set_updated_at
  BEFORE UPDATE ON public.fundraising_contacts
  FOR EACH ROW EXECUTE FUNCTION public.fundraising_contacts_set_updated_at();

-- Indexes
CREATE INDEX idx_fundraising_contacts_type ON public.fundraising_contacts(type);
CREATE INDEX idx_fundraising_contacts_name_fts ON public.fundraising_contacts
  USING GIN (to_tsvector('english', coalesce(name, '')));

-- RLS
ALTER TABLE public.fundraising_contacts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "fundraising_contacts_select_authenticated" ON public.fundraising_contacts
  FOR SELECT TO authenticated USING (true);

-- Board only can insert
CREATE POLICY "fundraising_contacts_insert_board" ON public.fundraising_contacts
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- Board only can update
CREATE POLICY "fundraising_contacts_update_board" ON public.fundraising_contacts
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- Board only can delete
CREATE POLICY "fundraising_contacts_delete_board" ON public.fundraising_contacts
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');