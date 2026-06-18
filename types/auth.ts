/**
 * auth.ts
 * OrgRole lookup table, UserAuth login records, and JWT custom claims.
 * Entities: org_roles (#3), user_auth (#2), JwtClaims (runtime shape).
 */

// ── org_roles ──────────────────────────────────────────────────────────────
// Lookup table. Integer PK per data model.

/** Numeric org role IDs. 1 = Member, 2 = Project Lead, 3 = Board. */
export type OrgRoleId = 1 | 2 | 3;

/** Human-readable role names. "Admin" is never used — always "Board". */
export type OrgRoleName = 'Member' | 'Project Lead' | 'Board';

/** Row in the org_roles lookup table. */
export interface OrgRole {
  role_id: OrgRoleId;
  role_name: OrgRoleName;
  description: string;
}

// ── user_auth ───────────────────────────────────────────────────────────────
// One row per Google account linked to a user. UUID PK.

/**
 * Row in user_auth.
 * One user can have multiple rows (personal Gmail + Ethos Workspace account).
 * google_account_email is globally unique — one Google account cannot link to two users.
 */
export interface UserAuth {
  auth_id: string;
  user_id: string;
  /** The Google account email used to sign in. UNIQUE. */
  google_account_email: string;
  is_active: boolean;
  linked_at: string;
}

// ── JWT custom claims ───────────────────────────────────────────────────────
// Shape of the JWT payload after 000_jwt_hook.sql custom claims hook runs.

/**
 * Custom claims injected into the Supabase JWT by the custom_access_token_hook.
 * Available via auth.jwt() in RLS policies and via the decoded token client-side.
 */
export interface JwtClaims {
  /** Supabase Auth user UUID. Same as users.user_id. */
  sub: string;
  org_role_id: OrgRoleId;
  chapter_id: string;
  email: string;
  exp: number;
  iat: number;
}
