/**
 * chapters.ts
 * Chapter entity. Each geographic chapter of Ethos, plus HQ as a special row.
 * Entity: chapters (#4).
 */

/**
 * Row in public.chapters.
 * Chapters are never deleted. Board creates and manages chapters.
 * Only one row may have is_hq = true (enforced by partial unique index in 027_constraints.sql).
 */
export interface Chapter {
  chapter_id: string;
  /** e.g. "Ethos Denton", "Ethos HQ" */
  name: string;
  /** True for the HQ entity. Only one row may be true. */
  is_hq: boolean;
  /** City/region. Null for HQ. */
  location: string | null;
  created_at: string;
}
