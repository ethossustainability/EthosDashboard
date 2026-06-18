/**
 * directory-profiles.ts
 * DirectoryProfile entity. Public-facing profile for each volunteer.
 * Entity: directory_profiles (#22).
 *
 * NOTE: is_visible column does NOT exist — it was removed in 027_constraints.sql.
 * Profiles are always visible; there is no hiding option.
 */

/**
 * Row in public.directory_profiles.
 * UNIQUE on user_id — one profile per user.
 * Created via service role on the user's first application approval.
 *
 * The only field a volunteer edits is bio.
 * Board may edit profiles via Supabase dashboard only — not a UI feature.
 *
 * Project history is derived from applications where status = 'Approved'.
 * Badges are derived from user_badges joined to badges.
 * Both are joined at query time — not stored on this record.
 */
export interface DirectoryProfile {
  profile_id: string;
  /** FK → users ON DELETE CASCADE. UNIQUE. */
  user_id: string;
  /** Self-written by the volunteer. Null until the volunteer adds one. */
  bio: string | null;
  updated_at: string;
}
