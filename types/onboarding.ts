/**
 * onboarding.ts
 * Onboarding entity. One-time Ethos onboarding record per user.
 * Entity: onboarding (#10).
 */

// ── Enums / literal unions ──────────────────────────────────────────────────

/**
 * CHECK constraint enforced in 010_onboarding.sql.
 * Applies to both waiver_status and parental_consent_status.
 */
export type WaiverStatus = 'Not Started' | 'Sent' | 'Signed';

/**
 * Explicit shape of the orientation_progress JSON field.
 * Exactly 4 boolean fields — one per video chapter.
 * All must be true before orientation_completed_at is set.
 */
export interface OrientationProgress {
  welcome: boolean;
  safety: boolean;
  how_we_work: boolean;
  faqs: boolean;
}

// ── Onboarding ──────────────────────────────────────────────────────────────

/**
 * Row in public.onboarding.
 * One record per user (UNIQUE on user_id). Not repeated for subsequent projects.
 * Created via service role on the user's first application submission.
 *
 * Step order: Slack → Orientation → Waiver → Parental Consent → PM Review.
 * PM Review is not a field — it is applications.status = 'Approved'.
 * Completed steps are preserved on reapplication after rejection.
 */
export interface Onboarding {
  onboarding_id: string;
  /** FK → users ON DELETE CASCADE. UNIQUE. */
  user_id: string;
  /** True once Slack OAuth completed. */
  slack_connected: boolean;
  slack_connected_at: string | null;
  orientation_started_at: string | null;
  orientation_completed_at: string | null;
  /** Per-chapter completion state. Null until orientation started. */
  orientation_progress: OrientationProgress | null;
  waiver_status: WaiverStatus;
  /** OpenSign document reference ID for the liability waiver. */
  waiver_doc_id: string | null;
  waiver_signed_at: string | null;
  parental_consent_status: WaiverStatus;
  /** OpenSign document reference ID for the parental consent form. */
  parental_consent_doc_id: string | null;
  parental_consent_signed_at: string | null;
  /** Set when all steps (including parental consent) are finished. */
  completed_at: string | null;
}
