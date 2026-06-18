/**
 * policy-acknowledgments.ts
 * PolicyAcknowledgment entity. Tracks which users have acknowledged each policy document.
 * Entity: policy_acknowledgments (#24).
 */

/**
 * Row in public.policy_acknowledgments.
 *
 * Rules:
 *  - The referenced file must have is_policy = true
 *  - If a policy document is updated (new version added by Board), all acknowledgments
 *    for that file are reset — members must re-acknowledge
 *  - No hard gate — members are not blocked from using the app for missing acknowledgments
 *    but a persistent "Review required" indicator is shown in the Training tab
 *  - POST /api/policy-acknowledgments is idempotent — returns existing record if already acknowledged
 */
export interface PolicyAcknowledgment {
  acknowledgment_id: string;
  /** FK → users ON DELETE CASCADE. */
  user_id: string;
  /**
   * FK → files ON DELETE CASCADE.
   * Must reference a file with is_policy = true.
   */
  file_id: string;
  acknowledged_at: string;
}
