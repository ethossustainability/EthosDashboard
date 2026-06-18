/**
 * project-roles.ts
 * ProjectRole entity. Roles defined by a PM when creating a project.
 * Entity: project_roles (#8).
 */

/**
 * Row in public.project_roles.
 * PM defines roles at creation; can edit after publish.
 * Cannot delete a role if volunteers are already assigned to it.
 * Capacity can only be reduced if no approved volunteers hold that role.
 */
export interface ProjectRole {
  project_role_id: string;
  /** FK → projects ON DELETE CASCADE. */
  project_id: string;
  /** e.g. "Site Lead", "Photographer", "Educator" */
  role_name: string;
  /** What this role does. */
  description: string | null;
  /** How many volunteers can hold this role simultaneously. */
  capacity: number;
}
