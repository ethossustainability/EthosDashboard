/**
 * shifts.ts
 * Shift entity. Individual time slots within a project.
 * Entity: shifts (#7).
 */

/**
 * Row in public.shifts.
 * Shifts are informational only — capacity is not programmatically enforced.
 * Approved volunteers are expected to attend all shifts.
 */
export interface Shift {
  shift_id: string;
  /** FK → projects ON DELETE CASCADE. */
  project_id: string;
  /** ISO 8601 datetime string. */
  start_datetime: string;
  /** ISO 8601 datetime string. */
  end_datetime: string;
  /** Can differ from project location per shift. */
  location: string | null;
  /** Max volunteers for this shift. Informational only. */
  capacity: number;
  /** Any shift-specific instructions. */
  notes: string | null;
}
