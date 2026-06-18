/**
 * org-settings.ts
 * OrgSetting entity. Key-value config for org-wide settings managed by Board.
 * Entity: org_settings (#26).
 */

/**
 * Row in public.org_settings.
 * UNIQUE on key — one value per setting identifier.
 * All authenticated users can read (fundraising goal is public).
 * Only Board can insert or update.
 * Records are never deleted.
 *
 * Initial keys:
 *  - 'fundraising_goal_[year]' — annual fundraising target in USD as a string
 *
 * Additional config values can be added without schema changes.
 */
export interface OrgSetting {
  setting_id: string;
  /** Setting identifier. UNIQUE. e.g. "fundraising_goal_2025" */
  key: string;
  /** Setting value stored as text. e.g. "10000" for a USD amount. */
  value: string;
  /** FK → users. Board member who last updated this setting. */
  updated_by: string;
  updated_at: string;
}
