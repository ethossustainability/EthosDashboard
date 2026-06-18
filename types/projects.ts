/**
 * projects.ts
 * ProjectType lookup table and Project entity.
 * Entities: project_types (#6), projects (#5).
 *
 * ProjectType is grouped here because it is a pure lookup used only by Project.
 */

// ── project_types ───────────────────────────────────────────────────────────
// Simple lookup table. Integer PK per data model.

/**
 * Seeded type_id values:
 *   1 = Event, 2 = Campaign, 3 = Program
 *   10 = Media, 11 = Newsletter, 12 = Business, 13 = STEM,
 *   14 = Funding, 15 = Finance, 16 = CS  (all HQ)
 */
export type ProjectTypeId =
  | 1   // Event
  | 2   // Campaign
  | 3   // Program
  | 10  // Media (HQ)
  | 11  // Newsletter (HQ)
  | 12  // Business (HQ)
  | 13  // STEM (HQ)
  | 14  // Funding (HQ)
  | 15  // Finance (HQ)
  | 16; // CS (HQ)

/** Row in public.project_types. */
export interface ProjectType {
  type_id: ProjectTypeId;
  type_name: string;
}

// ── projects ────────────────────────────────────────────────────────────────

/**
 * Application level for Open Call projects.
 * Required when is_open_call = true. Must be null when is_open_call = false.
 * CHECK constraint enforced in 027_constraints.sql.
 */
export type OpenCallAppLevel = 'Full App' | 'Mid App' | 'No App';

/**
 * Row in public.projects.
 *
 * Constraints (from 027_constraints.sql):
 *  - location required when is_virtual = false
 *  - open_call_app_level required when is_open_call = true; null when false
 *  - closed_at not null = permanently closed; publish endpoint returns CONFLICT
 */
export interface Project {
  project_id: string;
  /** FK → chapters. HQ projects link to the HQ chapter row. */
  chapter_id: string;
  /** FK → project_types. Label only. */
  project_type_id: ProjectTypeId;
  name: string;
  description: string;
  /** True if fully remote. */
  is_virtual: boolean;
  /** Physical address. Required when is_virtual = false. */
  location: string | null;
  /** FK → users. The Project Lead who created it. */
  created_by: string;
  /** Amount PM requested from Ethos funds. */
  requested_budget: number | null;
  /** Amount approved and allocated by Board. */
  allocated_budget: number | null;
  /** Max approved volunteers allowed on this project. */
  max_applications: number;
  /** True when PM checklist complete and project is public. */
  is_published: boolean;
  /** True if appears on Open Call board. */
  is_open_call: boolean;
  /** Full App | Mid App | No App. Required when is_open_call = true. */
  open_call_app_level: OpenCallAppLevel | null;
  /** Slack channel ID for this project's updates feed. Auto-created on publish. */
  slack_channel_id: string | null;
  /**
   * Set when project is closed. If not null, project is permanently closed
   * and cannot be republished.
   */
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}
