/**
 * recents.ts
 * Recent entity. Recently visited pages per user.
 * Entity: recents (#21).
 */

// ── PageType ────────────────────────────────────────────────────────────────

/**
 * CHECK constraint enforced in 021_recents.sql.
 * Only project pages and file pages are tracked.
 */
export type PageType = 'Project' | 'File';

// ── Recent ──────────────────────────────────────────────────────────────────

/**
 * Row in public.recents.
 *
 * Rules:
 *  - One row per user per page — revisiting a page updates visited_at (upsert)
 *  - 20 rows max per user in DB; oldest deleted when limit exceeded
 *  - UI displays the 10 most recent by visited_at descending
 *  - Triggered by dwell time (3–5 seconds on the page), not on navigation click
 *
 * reference_id has NO FK constraint — cannot FK to two different tables
 * (projects and files). Cascade deletion is handled via a DB trigger or
 * API-level cleanup when a project or file is deleted.
 */
export interface Recent {
  recent_id: string;
  /** FK → users ON DELETE CASCADE. */
  user_id: string;
  page_type: PageType;
  /**
   * The project_id or file_id visited.
   * No FK constraint — see note above.
   */
  reference_id: string;
  visited_at: string;
}
