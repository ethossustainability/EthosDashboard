/**
 * applications.ts
 * Application entity. A volunteer's application to join a project.
 * Entity: applications (#9).
 */

// ── ApplicationStatus ───────────────────────────────────────────────────────

/**
 * CHECK constraint enforced in 009_applications.sql.
 * Rejected and Withdrawn are archived, never deleted.
 */
export type ApplicationStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Withdrawn';

// ── Application ─────────────────────────────────────────────────────────────

/**
 * Row in public.applications.
 *
 * Business rules enforced in API (not at RLS level):
 *  - Max 3 pending applications simultaneously per user
 *  - Max 3 active (approved) projects simultaneously per user
 *  - HQ project = only active project (cannot hold chapter + HQ simultaneously)
 *  - Withdrawal only allowed while status = Pending
 *  - Cannot re-apply to same project in the same cycle
 *  - UNIQUE on (user_id, project_id)
 */
export interface Application {
  application_id: string;
  /** FK → users ON DELETE CASCADE. */
  user_id: string;
  /** FK → projects ON DELETE CASCADE. */
  project_id: string;
  status: ApplicationStatus;
  /**
   * FK → project_roles ON DELETE SET NULL.
   * Null until application is approved and a role is assigned.
   */
  project_role_id: string | null;
  /** Why the volunteer wants to join. Required. */
  why_join: string;
  /** Optional relevant experience. */
  experience: string | null;
  /** Notes from availability step. */
  availability_notes: string | null;
  /** FK → users. PM or Board who reviewed. Null until reviewed. */
  reviewed_by: string | null;
  /** When the approval/rejection decision was made. */
  reviewed_at: string | null;
  /** Optional reason provided on rejection. */
  rejection_reason: string | null;
  submitted_at: string;
  updated_at: string;
}
