/**
 * badges.ts
 * Badge type definitions and user badge award records.
 * Entities: badges (#12), user_badges (#13).
 *
 * Grouped together because UserBadge only exists in the context of Badge.
 */

// ── BadgeCategory ───────────────────────────────────────────────────────────

/**
 * CHECK constraint enforced in 012_badges.sql.
 * Achievement badges must have project_id = null (CHECK in 027_constraints.sql).
 * Participation badges are awarded by Project Leads for their own project volunteers.
 * Achievement badges (including VOTY) are awarded by Board only.
 */
export type BadgeCategory = 'Participation' | 'Achievement';

// ── Badge ───────────────────────────────────────────────────────────────────

/**
 * Row in public.badges.
 * Badge types are created by Board only (CS HQ team eventually).
 *
 * Constraint (027_constraints.sql):
 *  - badge_category = 'Achievement' → project_id must be null
 *  - badge_category = 'Participation' → project_id may be set or null
 *
 * VOTY (Volunteer of the Year) is an Achievement badge displayed as a subtitle
 * under the member's name on their directory profile.
 */
export interface Badge {
  badge_id: string;
  badge_category: BadgeCategory;
  /**
   * FK → projects ON DELETE SET NULL.
   * For Participation badges only. Must be null for Achievement badges.
   */
  project_id: string | null;
  /** e.g. "Ethos Conf '25", "VOTY '26" */
  name: string;
  description: string | null;
  /** Badge image asset link (Drive-hosted). */
  image_url: string | null;
  /** FK → users. Board member who created this badge type. */
  created_by: string;
  created_at: string;
}

// ── UserBadge ───────────────────────────────────────────────────────────────

/**
 * Row in public.user_badges.
 * Records which badges have been awarded to which users.
 *
 * Rules:
 *  - UNIQUE on (user_id, badge_id) — same badge cannot be awarded twice
 *  - Participation badges: Project Lead awards to own project volunteers only
 *  - Achievement badges (incl. VOTY): Board only
 */
export interface UserBadge {
  user_badge_id: string;
  /** FK → users ON DELETE CASCADE. The volunteer receiving the badge. */
  user_id: string;
  /** FK → badges ON DELETE CASCADE. */
  badge_id: string;
  /** FK → users. Who awarded it (Project Lead or Board). */
  awarded_by: string;
  awarded_at: string;
  /** Optional note from the awarder. */
  note: string | null;
}
