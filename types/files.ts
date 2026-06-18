/**
 * files.ts
 * File entity. References to files in Ethos Google Drive — metadata and links only.
 * Entity: files (#18).
 *
 * No file content is stored in the database.
 * File permissions are handled at the Google Drive level.
 */

// ── FileCategory ────────────────────────────────────────────────────────────

/**
 * CHECK constraint enforced in 027_constraints.sql:
 *  - 'Universal' → project_id must be null
 *  - 'Project'   → project_id must NOT be null
 */
export type FileCategory = 'Project' | 'Universal';

// ── File ────────────────────────────────────────────────────────────────────

/**
 * Row in public.files.
 * All approved members see all files regardless of project (no per-member filtering).
 * Project Leads add project files for their own projects.
 * Board adds Universal (org-wide) files.
 *
 * is_policy = true files appear in the Training tab as policy documents
 * that members must acknowledge.
 */
export interface File {
  file_id: string;
  /**
   * FK → projects.
   * Null for Universal files. Required for Project files.
   * CHECK constraint enforced in 027_constraints.sql.
   */
  project_id: string | null;
  /** Google Drive file ID extracted from drive_url. */
  drive_file_id: string;
  /** Full shareable Google Drive URL. */
  drive_url: string;
  /** Display name shown in the app. */
  file_name: string;
  /** e.g. "PDF", "Google Doc", "Sheet", "Image" */
  file_type: string;
  category: FileCategory;
  description: string | null;
  /**
   * True for policy documents shown in the Training tab.
   * DEFAULT false. Board marks policy documents.
   * When a policy document is updated, all policy_acknowledgments reset.
   */
  is_policy: boolean;
  /** FK → users. PM or Board who added this file reference. */
  added_by: string;
  created_at: string;
}
