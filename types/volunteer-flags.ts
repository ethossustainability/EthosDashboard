/**
 * volunteer-flags.ts
 * VolunteerFlag entity. Flags raised by Project Leads when a volunteer misses a shift.
 * Entity: volunteer_flags (#25).
 *
 * Flags are never deleted (audit trail).
 * Visible only to the flagging Project Lead and Board.
 */

/**
 * Row in public.volunteer_flags.
 *
 * Rules:
 *  - Only Project Leads can create flags, for volunteers on their own projects
 *  - The flagged user must have an Approved application on that project
 *    (enforced in RLS INSERT policy in 025_volunteer_flags.sql)
 *  - Volunteer is notified on flag creation (in-app + email + Slack)
 *  - Board marks flags as resolved — resolved fields added in Chunk 5 (10_chunk5_board_view.md)
 *  - Pattern of flags across a volunteer's history is visible on their directory
 *    profile to Board only
 */
export interface VolunteerFlag {
  flag_id: string;
  /** FK → users. The volunteer being flagged. */
  user_id: string;
  /** FK → projects. The project context. */
  project_id: string;
  /**
   * FK → shifts ON DELETE SET NULL.
   * The specific shift the volunteer missed. Null if not tied to a specific shift.
   */
  shift_id: string | null;
  /** FK → users. The Project Lead who raised the flag. */
  flagged_by: string;
  /** Optional context about why the flag was raised. */
  reason: string | null;
  /** False until Board marks resolved. DEFAULT false. */
  resolved: boolean;
  /**
   * FK → users.
   * The Board member who resolved the flag. Null until resolved.
   */
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}
