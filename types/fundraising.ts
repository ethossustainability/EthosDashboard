/**
 * fundraising.ts
 * FundraisingContact and Donation entities.
 * Entities: fundraising_contacts (#16), donations (#17).
 *
 * Grouped together as a tightly coupled domain.
 * All approved members can read. Board writes (add/edit/delete).
 */

// ── ContactType ─────────────────────────────────────────────────────────────

/** CHECK constraint enforced in 016_fundraising_contacts.sql. */
export type ContactType = 'Donor' | 'Partner' | 'Sponsor' | 'Other';

// ── FundraisingContact ──────────────────────────────────────────────────────

/**
 * Row in public.fundraising_contacts.
 * Donors, partners, and contacts. Visible to all approved members.
 * Board manages (add/edit/delete). Fundraising HQ team lead will eventually
 * take over — permission update only, no schema change.
 */
export interface FundraisingContact {
  contact_id: string;
  /** Full name or organization name. */
  name: string;
  type: ContactType;
  email: string | null;
  phone: string | null;
  /** Relationship context. */
  notes: string | null;
  /** FK → users. Who added this contact. */
  added_by: string;
  created_at: string;
  updated_at: string;
}

// ── Donation ────────────────────────────────────────────────────────────────

/**
 * Row in public.donations.
 * Org-level donation records. Not tied to specific projects.
 * contact_id is null for anonymous donations.
 */
export interface Donation {
  donation_id: string;
  /**
   * FK → fundraising_contacts.
   * Null for anonymous donations.
   */
  contact_id: string | null;
  /** Amount in USD. */
  amount: number;
  /** ISO 8601 date string (DATE column — date received). */
  donated_at: string;
  notes: string | null;
  /** FK → users. Board member who logged this donation. */
  recorded_by: string;
  created_at: string;
}
