/**
 * tasks.ts
 * Task entity. Tasks assigned to volunteers within a project.
 * Entity: tasks (#11).
 */

// ── TaskStatus ──────────────────────────────────────────────────────────────

/**
 * CHECK constraint enforced in 011_tasks.sql.
 * Members cannot set 'Awaiting Input' — enforced in API PATCH /api/tasks/:task_id.
 * Only Project Lead or Board can move a task out of 'Awaiting Input'.
 */
export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Awaiting Input'
  | 'Complete';

// ── Task ────────────────────────────────────────────────────────────────────

/**
 * Row in public.tasks.
 *
 * RLS rules (enforced at DB + API level):
 *  - Approved members see all tasks on their project
 *  - Members may only update the status of tasks assigned to them
 *  - Members cannot set status to 'Awaiting Input'
 *  - Project Leads can create, assign, edit, delete any task on own project
 *  - Board can manage any task org-wide
 */
export interface Task {
  task_id: string;
  /** FK → projects ON DELETE CASCADE. */
  project_id: string;
  /**
   * FK → users ON DELETE SET NULL.
   * Null if unassigned.
   */
  assigned_to: string | null;
  /** FK → users. Who created the task (Project Lead or Board). */
  created_by: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** ISO 8601 date string (DATE column). */
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
