# Ethos App — Data Model v2.2

All primary keys use UUID unless noted. Integer IDs are used for lookup/reference tables only.

## Confirmed Updates Since v2.0 PDF
- `org_roles`: "Admin" renamed to "Board"
- `notifications`: added `is_read` BOOLEAN, `read_at` TIMESTAMP nullable
- `notifications`: confirmed as both audit log and in-app inbox — no separate notifications_inbox table. is_read and read_at drive the bell icon and unread count.
- `notification_preferences`: in-app notifications always on — no column needed. Email and Slack are the only toggleable channels per event. Constraint: email and Slack cannot both be disabled for an event type since in-app covers baseline.
- `notification_preferences`: Slack notifications fall back to email only if `slack_user_id` is null on the user record.
- `recents`: reference_id has no FK constraint — cannot FK to two tables. Cascade deletion handled via database trigger or API-level cleanup when a project or file is deleted. Dwell-time trigger (3–5 seconds on page, not on click). Database keeps 20 rows per user max, UI displays 10.
- `badges`: added `badge_category` ENUM (Participation, Achievement). Participation badges have optional `project_id` FK. Achievement badges must have `project_id` = null — enforced via CHECK constraint.
- `files`: all approved members can see all files regardless of project. No per-member filtering. CHECK constraint: Universal files must have project_id = null, Project files must have project_id NOT NULL. Added `is_policy` BOOLEAN field.
- `users`: added `chapter_id` FK. personal_email, ethos_email, slack_user_id all UNIQUE.
- `user_auth`: google_account_email UNIQUE.
- `directory_profiles`: is_visible column removed — profiles are always visible.
- `projects`: added `slack_channel_id` VARCHAR(100) nullable. Added `closed_at` TIMESTAMP nullable. CHECK constraints for open_call_app_level/is_open_call and location/is_virtual consistency.
- New entities added post-v2.0: `chapters`, `project_updates`, `policy_acknowledgments`, `volunteer_flags`, `org_settings`
- Migration 027_constraints.sql adds all UNIQUE and CHECK constraints after all tables exist.

---

## Entities

### 1. users
Every person with an account. All volunteers are minors ages 14–17.

| Field | Type | Description |
|---|---|---|
| user_id | UUID · PK | Primary identifier. Never changes. All records link here. |
| first_name | VARCHAR(50) | Legal first name. |
| last_name | VARCHAR(50) | Legal last name. |
| date_of_birth | DATE | Used to verify minimum age (14) and flag under-13s for COPPA. |
| personal_email | VARCHAR(150) · UNIQUE | Gmail used at signup. Used for notifications pre-Ethos account. |
| ethos_email | VARCHAR(150) · nullable · UNIQUE | Assigned manually by Board after approval. Null until created. |
| active_login_email | VARCHAR(150) | Whichever email they currently authenticate with. |
| slack_user_id | VARCHAR(100) · nullable · UNIQUE | Slack user ID stored after OAuth connection. |
| guardian_name | VARCHAR(150) | Full name of parent or legal guardian. |
| guardian_email | VARCHAR(150) | Guardian email — receives parental consent form. |
| guardian_phone | VARCHAR(30) · nullable | Guardian phone number. Optional. |
| org_role_id | INTEGER · FK → org_roles | Permission level in the app. |
| chapter_id | UUID · FK → chapters | The chapter this member belongs to. |
| onboarding_complete | BOOLEAN | True once all one-time Ethos onboarding steps are done. |
| created_at | TIMESTAMP | When the account was first created. |
| updated_at | TIMESTAMP | Last time the record was modified. |

**Note:** user_id is the permanent anchor. personal_email and ethos_email can coexist — active_login_email tracks which is currently used for authentication. guardian_email and guardian_phone are never exposed to other members — only accessible via service role or Board via Supabase dashboard.

---

### 2. user_auth
Every Google account linked to a user. Handles personal Gmail + Ethos Workspace account on one profile.

| Field | Type | Description |
|---|---|---|
| auth_id | UUID · PK | Unique ID for this auth record. |
| user_id | UUID · FK → users | The user this login belongs to. |
| google_account_email | VARCHAR(150) · UNIQUE | The Google account email used to sign in. |
| is_active | BOOLEAN | Whether this login method is currently active. |
| linked_at | TIMESTAMP | When this Google account was linked to the user. |

**Note:** One user can have multiple rows (personal + Ethos Google account). Board links Ethos email by adding a new row with is_active = true. google_account_email is globally unique — one Google account cannot be linked to two users.

---

### 3. org_roles
Lookup table. Three permission levels. All can be held by minors.

| Field | Type | Description |
|---|---|---|
| role_id | INTEGER · PK | 1, 2, or 3. |
| role_name | VARCHAR(50) | Member, Project Lead, or Board. |
| description | TEXT | Plain English description of what this role can do. |

**Values:**
- 1 = Member — standard volunteer
- 2 = Project Lead — can create and manage own projects. Chapter Heads and HQ leads use this role.
- 3 = Board — universal access, no restrictions

---

### 4. chapters
Each geographic chapter of Ethos, plus HQ as a special chapter.

| Field | Type | Description |
|---|---|---|
| chapter_id | UUID · PK | Unique chapter identifier. |
| name | VARCHAR(150) | e.g. "Ethos Denton", "Ethos HQ" |
| is_hq | BOOLEAN | True for the HQ entity. |
| location | VARCHAR(200) · nullable | City/region. Null for HQ. |
| created_at | TIMESTAMP | When the chapter was created. |

**Note:** Chapters are never deleted. Board creates and manages chapters. HQ is a single special chapter — only one row should have is_hq = true.

---

### 5. projects
All Ethos projects — events, campaigns, programs. One unified table.

| Field | Type | Description |
|---|---|---|
| project_id | UUID · PK | Unique project identifier. |
| chapter_id | UUID · FK → chapters | Which chapter owns this project. HQ projects link to HQ chapter. |
| project_type_id | INTEGER · FK → project_types | Label only. |
| name | VARCHAR(150) | Project name. |
| description | TEXT | Full description, goals, special instructions. |
| is_virtual | BOOLEAN | True if fully remote. |
| location | VARCHAR(200) · nullable | Physical address. Required when is_virtual = false. |
| created_by | UUID · FK → users | The Project Lead who created it. |
| requested_budget | DECIMAL(10,2) · nullable | Amount PM requested from Ethos funds. |
| allocated_budget | DECIMAL(10,2) · nullable | Amount approved and allocated by Board. |
| max_applications | INTEGER | Max approved volunteers allowed on this project. |
| is_published | BOOLEAN | True when PM checklist complete and project is public. |
| is_open_call | BOOLEAN | True if appears on Open Call board. |
| open_call_app_level | VARCHAR(50) · nullable | Full App, Mid App, No App. Required when is_open_call = true. Must be null when is_open_call = false. |
| slack_channel_id | VARCHAR(100) · nullable | Slack channel ID for this project's updates feed. Auto-created on publish. |
| closed_at | TIMESTAMP · nullable | Set when project is closed. If not null, project is permanently closed and cannot be republished. |
| created_at | TIMESTAMP | When created. |
| updated_at | TIMESTAMP | Last modified. |

**Constraints:**
- location required when is_virtual = false (CHECK in 027_constraints.sql)
- open_call_app_level required when is_open_call = true, must be null when false (CHECK in 027_constraints.sql)
- closed_at not null = permanently closed, publish endpoint returns CONFLICT

**Note:** max_applications = max approved volunteers. Pending applications capped per user org-wide (3 max), not per project.

---

### 6. project_types
Simple lookup table for project type labels.

| Field | Type | Description |
|---|---|---|
| type_id | INTEGER · PK | Simple numeric ID. |
| type_name | VARCHAR(50) | Event, Campaign, Program, or HQ team category. |

**Seeded values:**
- 1 = Event, 2 = Campaign, 3 = Program
- 10 = Media, 11 = Newsletter, 12 = Business, 13 = STEM, 14 = Funding, 15 = Finance, 16 = CS (all HQ)

---

### 7. shifts
Individual time slots within a project.

| Field | Type | Description |
|---|---|---|
| shift_id | UUID · PK | Unique shift identifier. |
| project_id | UUID · FK → projects ON DELETE CASCADE | The project this shift belongs to. |
| start_datetime | TIMESTAMP | Start date and time. |
| end_datetime | TIMESTAMP | End date and time. |
| location | VARCHAR(200) · nullable | Can differ from project location per shift. |
| capacity | INTEGER | Max volunteers for this shift. Informational only — not enforced programmatically. |
| notes | TEXT · nullable | Any shift-specific instructions. |

**Note:** Roles at project level not per shift. Approved volunteers attend all shifts.

---

### 8. project_roles
Roles defined by a PM when creating a project.

| Field | Type | Description |
|---|---|---|
| project_role_id | UUID · PK | Unique role definition. |
| project_id | UUID · FK → projects ON DELETE CASCADE | The project this role belongs to. |
| role_name | VARCHAR(100) | e.g. Site Lead, Photographer, Educator. |
| description | TEXT · nullable | What this role does. |
| capacity | INTEGER | How many volunteers can hold this role. |

**Note:** PM defines roles at creation, can edit after. Members cannot change own role. Cannot delete a role if volunteers are assigned to it.

---

### 9. applications
A volunteer's application to join a project.

| Field | Type | Description |
|---|---|---|
| application_id | UUID · PK | Unique application. |
| user_id | UUID · FK → users ON DELETE CASCADE | The volunteer who applied. |
| project_id | UUID · FK → projects ON DELETE CASCADE | The project applied to. |
| status | VARCHAR(50) | Pending, Approved, Rejected, Withdrawn. CHECK enforced. |
| project_role_id | UUID · FK → project_roles ON DELETE SET NULL · nullable | Role assigned on approval. Null until approved. |
| why_join | TEXT | Why the volunteer wants to join. |
| experience | TEXT · nullable | Optional relevant experience. |
| availability_notes | TEXT · nullable | Notes from availability step. |
| reviewed_by | UUID · FK → users · nullable | PM or Board who reviewed. |
| reviewed_at | TIMESTAMP · nullable | When the decision was made. |
| rejection_reason | TEXT · nullable | Optional reason on rejection. |
| submitted_at | TIMESTAMP | When submitted. |
| updated_at | TIMESTAMP | Last modified. |

**Rules:**
- Max 3 pending applications simultaneously — enforced in API
- Max 3 active (approved) projects simultaneously — enforced in API
- HQ project = only active project — enforced in API
- Rejected and Withdrawn archived, not deleted
- Cannot re-apply to same project — UNIQUE index on (user_id, project_id) + API logic
- Withdrawal only while status = Pending — enforced in API via service role

---

### 10. onboarding
One-time Ethos onboarding record per user. Not repeated for subsequent projects.

| Field | Type | Description |
|---|---|---|
| onboarding_id | UUID · PK | Unique record. |
| user_id | UUID · FK → users ON DELETE CASCADE · UNIQUE | One record per user. |
| slack_connected | BOOLEAN | True once Slack OAuth completed. |
| slack_connected_at | TIMESTAMP · nullable | When Slack was connected. |
| orientation_started_at | TIMESTAMP · nullable | When orientation videos first opened. |
| orientation_completed_at | TIMESTAMP · nullable | When all chapters finished. |
| orientation_progress | TEXT · nullable | JSON storing per-chapter completion state. |
| waiver_status | VARCHAR(50) | Not Started, Sent, Signed. CHECK enforced. |
| waiver_doc_id | VARCHAR(200) · nullable | OpenSign document reference ID. |
| waiver_signed_at | TIMESTAMP · nullable | When volunteer signed. |
| parental_consent_status | VARCHAR(50) | Not Started, Sent, Signed. CHECK enforced. |
| parental_consent_doc_id | VARCHAR(200) · nullable | OpenSign document reference ID. |
| parental_consent_signed_at | TIMESTAMP · nullable | When guardian signed. |
| completed_at | TIMESTAMP · nullable | When all steps finished. |

**Step order:** Slack → Orientation → Waiver → Parental Consent → PM Review

**Note:** PM Review is not a field — it is applications.status = 'Approved'. Steps unlock sequentially. Completed steps preserved on reapplication. Record created via service role on first application submission.

---

### 11. tasks
Tasks assigned to volunteers within a project.

| Field | Type | Description |
|---|---|---|
| task_id | UUID · PK | Unique task. |
| project_id | UUID · FK → projects ON DELETE CASCADE | The project this task belongs to. |
| assigned_to | UUID · FK → users ON DELETE SET NULL · nullable | Assigned volunteer. Null if unassigned. |
| created_by | UUID · FK → users | Who created the task. |
| title | VARCHAR(200) | Short task name. |
| description | TEXT · nullable | Full task details. |
| status | VARCHAR(50) | Not Started, In Progress, Awaiting Input, Complete. CHECK enforced. |
| due_date | DATE · nullable | Optional due date. |
| created_at | TIMESTAMP | When created. |
| updated_at | TIMESTAMP | Last modified. |

**Rules:**
- Members see all tasks on their project
- Members update status of own assigned tasks only — column-level restriction enforced in API
- Members cannot set Awaiting Input — enforced in API
- Only Project Leads or Board can unblock Awaiting Input tasks
- Project Leads can create, assign, edit, delete any task on own project including completed

---

### 12. badges
Badge types. Created by Board only (CS HQ team eventually).

| Field | Type | Description |
|---|---|---|
| badge_id | UUID · PK | Unique badge type. |
| badge_category | VARCHAR(50) | Participation or Achievement. CHECK enforced. |
| project_id | UUID · FK → projects ON DELETE SET NULL · nullable | For Participation badges. Must be null for Achievement. |
| name | VARCHAR(100) | e.g. Ethos Conf '25, VOTY '26. |
| description | TEXT · nullable | What this badge represents. |
| image_url | VARCHAR(300) · nullable | Badge image asset link. |
| created_by | UUID · FK → users | Board member who created it. |
| created_at | TIMESTAMP | When defined. |

**Constraint:** Achievement badges must have project_id = null (CHECK in 027_constraints.sql).

**Note:** VOTY displayed as subtitle under member name on directory profile. PMs award participation badges. Board awards achievement badges including VOTY.

---

### 13. user_badges
Records which badges have been awarded to which users.

| Field | Type | Description |
|---|---|---|
| user_badge_id | UUID · PK | Unique award record. |
| user_id | UUID · FK → users ON DELETE CASCADE | The volunteer receiving the badge. |
| badge_id | UUID · FK → badges ON DELETE CASCADE | The badge being awarded. |
| awarded_by | UUID · FK → users | Who awarded it. |
| awarded_at | TIMESTAMP | Date awarded. |
| note | TEXT · nullable | Optional note from awarder. |

**Rules:**
- UNIQUE on (user_id, badge_id) — same badge cannot be awarded twice to same user
- Participation badges: Project Lead awards to own project volunteers only
- Achievement badges (incl. VOTY): Board only
- Both categories shown on directory profile in separate sections

---

### 14. announcements
Org-wide announcements synced one-way from Slack #announcements.

| Field | Type | Description |
|---|---|---|
| announcement_id | UUID · PK | Unique announcement. |
| slack_message_id | VARCHAR(100) · UNIQUE | Slack message ID. Deduplication. |
| slack_channel_id | VARCHAR(100) | The Slack channel it came from. |
| posted_by_slack_user | VARCHAR(100) | Slack username of poster. |
| content | TEXT | The announcement text. |
| posted_at | TIMESTAMP | When posted in Slack. |
| synced_at | TIMESTAMP | When pulled into app. |

**Note:** One-way sync only. Only #announcements channel synced.

---

### 15. project_updates
Per-project Slack channel feed. Synced one-way from each project's Slack channel.

| Field | Type | Description |
|---|---|---|
| update_id | UUID · PK | Unique update record. |
| project_id | UUID · FK → projects ON DELETE CASCADE | The project this update belongs to. |
| slack_message_id | VARCHAR(100) · UNIQUE | Slack message ID. Deduplication. |
| posted_by_slack_user | VARCHAR(100) | Slack display name of poster. |
| content | TEXT | Message content. |
| posted_at | TIMESTAMP | When posted in Slack. |
| synced_at | TIMESTAMP | When pulled into app. |

**Note:** Slack channel auto-created on project publish. Channel ID stored in projects.slack_channel_id. Members added to channel on approval, removed on withdrawal.

---

### 16. fundraising_contacts
Donors, partners, and contacts. Visible to all approved members.

| Field | Type | Description |
|---|---|---|
| contact_id | UUID · PK | Unique contact. |
| name | VARCHAR(150) | Full name or organization name. |
| type | VARCHAR(50) | Donor, Partner, Sponsor, Other. CHECK enforced. |
| email | VARCHAR(150) · nullable | Contact email. |
| phone | VARCHAR(30) · nullable | Contact phone. |
| notes | TEXT · nullable | Relationship context. |
| added_by | UUID · FK → users | Who added this contact. |
| created_at | TIMESTAMP | When added. |
| updated_at | TIMESTAMP | Last modified. |

---

### 17. donations
Org-level donation records. Not tied to specific projects.

| Field | Type | Description |
|---|---|---|
| donation_id | UUID · PK | Unique donation. |
| contact_id | UUID · FK → fundraising_contacts · nullable | Donor if in contacts. Null for anonymous. |
| amount | DECIMAL(10,2) | Amount in USD. |
| donated_at | DATE | Date received. |
| notes | TEXT · nullable | Context. |
| recorded_by | UUID · FK → users | Board member who logged it. |
| created_at | TIMESTAMP | When entered. |

---

### 18. files
References to files in Ethos Google Drive. Metadata and links only.

| Field | Type | Description |
|---|---|---|
| file_id | UUID · PK | Unique file record. |
| project_id | UUID · FK → projects · nullable | Project this file belongs to. Null for Universal. |
| drive_file_id | VARCHAR(200) | Google Drive file ID. |
| drive_url | VARCHAR(500) | Full shareable Drive URL. |
| file_name | VARCHAR(200) | Display name. |
| file_type | VARCHAR(50) | PDF, Google Doc, Sheet, Image, etc. |
| category | VARCHAR(50) | Project or Universal. CHECK enforced. |
| description | TEXT · nullable | Context about the file. |
| is_policy | BOOLEAN · DEFAULT false | True for policy documents shown in Training tab. |
| added_by | UUID · FK → users | PM or Board who added it. |
| created_at | TIMESTAMP | When added to app. |

**Constraints (in 027_constraints.sql):**
- category = Universal → project_id must be null
- category = Project → project_id must NOT be null

---

### 19. notifications
Log of every notification sent. Also serves as the in-app notification inbox.

| Field | Type | Description |
|---|---|---|
| notification_id | UUID · PK | Unique record. |
| user_id | UUID · FK → users | Recipient. |
| sent_to_email | VARCHAR(150) · nullable | Email at send time. Null for Slack-only. |
| sent_to_slack_user_id | VARCHAR(100) · nullable | Slack user ID at send time. Null for email-only. |
| channel | VARCHAR(50) | Email, Slack, Both, InApp. CHECK enforced. |
| event_type | VARCHAR(100) | Application Received, Approved, Rejected, Task Assigned, Task Updated, Onboarding Step, Badge Awarded, Role Changed, Announcement, General. CHECK enforced. |
| subject | VARCHAR(200) · nullable | Email subject. Null for Slack/InApp only. |
| body | TEXT | Notification content. |
| is_read | BOOLEAN · DEFAULT false | False until user opens in-app. |
| read_at | TIMESTAMP · nullable | When marked read. |
| sent_at | TIMESTAMP | When sent. |
| status | VARCHAR(50) | Sent, Failed, Bounced. CHECK enforced. |

**Note:** Both audit log and in-app inbox. No separate notifications_inbox table. Failed notifications retry up to 3 times.

---

### 20. notification_preferences
Per-user, per-event toggles for email and Slack. In-app always on.

| Field | Type | Description |
|---|---|---|
| preference_id | UUID · PK | Unique record. |
| user_id | UUID · FK → users · UNIQUE | One record per user. |
| application_received_email | BOOLEAN · DEFAULT true | |
| application_received_slack | BOOLEAN · DEFAULT true | |
| application_approved_email | BOOLEAN · DEFAULT true | |
| application_approved_slack | BOOLEAN · DEFAULT true | |
| application_rejected_email | BOOLEAN · DEFAULT true | |
| application_rejected_slack | BOOLEAN · DEFAULT true | |
| task_assigned_email | BOOLEAN · DEFAULT true | |
| task_assigned_slack | BOOLEAN · DEFAULT true | |
| task_updated_email | BOOLEAN · DEFAULT true | |
| task_updated_slack | BOOLEAN · DEFAULT true | |
| badge_awarded_email | BOOLEAN · DEFAULT true | |
| badge_awarded_slack | BOOLEAN · DEFAULT true | |
| role_changed_email | BOOLEAN · DEFAULT true | |
| role_changed_slack | BOOLEAN · DEFAULT true | |
| announcement_email | BOOLEAN · DEFAULT true | |
| announcement_slack | BOOLEAN · DEFAULT true | |
| updated_at | TIMESTAMP | Last changed. |

**Rules:**
- In-app always on — no column, no toggle
- Email and Slack cannot both be false for any event type — enforced in API
- Slack falls back to email if slack_user_id is null
- Created with all values = true on first approval
- Adding new event types requires schema migration — accepted tradeoff

---

### 21. recents
Recently visited pages per user.

| Field | Type | Description |
|---|---|---|
| recent_id | UUID · PK | Unique record. |
| user_id | UUID · FK → users ON DELETE CASCADE | The user who visited. |
| page_type | VARCHAR(50) | Project or File. CHECK enforced. |
| reference_id | UUID | The project_id or file_id visited. No FK constraint — see note. |
| visited_at | TIMESTAMP | When last visited. |

**Rules:**
- Dwell-based (3–5 seconds), not on click
- One row per user per page — revisiting updates visited_at
- 20 rows max per user in DB, 10 shown in UI
- reference_id has no FK — cannot FK to two tables. Cascade via trigger or API cleanup.

---

### 22. directory_profiles
Public-facing profile for each volunteer.

| Field | Type | Description |
|---|---|---|
| profile_id | UUID · PK | Unique profile. |
| user_id | UUID · FK → users ON DELETE CASCADE · UNIQUE | One per user. |
| bio | TEXT · nullable | Self-written by volunteer. |
| updated_at | TIMESTAMP | Last edited. |

**Note:** Profiles always visible — no hiding. is_visible column does not exist. Project history from applications where status = Approved. Badges from user_badges. Bio is the only field volunteer edits. Board edits profiles via Supabase dashboard only.

---

### 23. system_logs
Integration failure and error log.

| Field | Type | Description |
|---|---|---|
| log_id | UUID · PK | Unique log entry. |
| integration | VARCHAR(50) | Supabase, OpenSign, Slack, Resend, GoogleDrive. CHECK enforced. |
| error_type | VARCHAR(100) | Short error classification. |
| error_message | TEXT | Full error detail. |
| affected_user_id | UUID · FK → users · nullable | User affected if applicable. |
| resolved | BOOLEAN · DEFAULT false | False until Board marks resolved. |
| occurred_at | TIMESTAMP | When the error occurred. |
| resolved_at | TIMESTAMP · nullable | When resolved. |

**Note:** Board only. Logs never deleted.

---

### 24. policy_acknowledgments
Tracks which users have acknowledged each policy document.

| Field | Type | Description |
|---|---|---|
| acknowledgment_id | UUID · PK | Unique record. |
| user_id | UUID · FK → users ON DELETE CASCADE | The member who acknowledged. |
| file_id | UUID · FK → files ON DELETE CASCADE | The policy document (files.is_policy = true). |
| acknowledged_at | TIMESTAMP | When acknowledged. |

**Note:** If a policy document is updated, all acknowledgments reset — members must re-acknowledge. No hard gate but persistent indicator shown in Training tab.

---

### 25. volunteer_flags
Flags raised by Project Leads when a volunteer misses a shift.

| Field | Type | Description |
|---|---|---|
| flag_id | UUID · PK | Unique flag. |
| user_id | UUID · FK → users | The volunteer being flagged. |
| project_id | UUID · FK → projects | The project context. |
| shift_id | UUID · FK → shifts · nullable | The specific shift missed. |
| flagged_by | UUID · FK → users | The Project Lead who flagged. |
| reason | TEXT · nullable | Optional context. |
| resolved | BOOLEAN · DEFAULT false | False until Board marks resolved. |
| resolved_by | UUID · FK → users · nullable | Board member who resolved. |
| resolved_at | TIMESTAMP · nullable | When resolved. |
| created_at | TIMESTAMP | When flagged. |

**Note:** Visible to flagging Lead and Board only. Volunteer notified on creation. Never deleted. Pattern of flags visible on volunteer's directory profile to Board only.

---

### 26. org_settings
Key-value config for org-wide settings. Managed by Board.

| Field | Type | Description |
|---|---|---|
| setting_id | UUID · PK | Unique setting. |
| key | VARCHAR(100) · UNIQUE | Setting identifier e.g. "fundraising_goal_2025" |
| value | TEXT | Setting value. |
| updated_by | UUID · FK → users | Board member who last updated. |
| updated_at | TIMESTAMP | When last updated. |

**Initial keys:** `fundraising_goal_[year]` — annual fundraising target in USD.

---

## Migration 027_constraints.sql (no new table)

Applies after all 26 tables exist.

**UNIQUE constraints:**
- users.personal_email
- users.ethos_email
- users.slack_user_id
- user_auth.google_account_email

**CHECK constraints:**
- projects: `CHECK ((is_virtual = true AND location IS NULL) OR (is_virtual = false AND location IS NOT NULL))`
- projects: `CHECK ((is_open_call = false AND open_call_app_level IS NULL) OR (is_open_call = true AND open_call_app_level IS NOT NULL))`
- badges: `CHECK ((badge_category = 'Achievement' AND project_id IS NULL) OR badge_category = 'Participation')`
- files: `CHECK ((category = 'Universal' AND project_id IS NULL) OR (category = 'Project' AND project_id IS NOT NULL))`

**Columns removed:**
- directory_profiles.is_visible

---

## Future Considerations (Not in Scope)
- Grant checklists — workflow not yet defined
- Automated background check integration — manual sufficient at current scale
- File upload permissions for members — deferred, Drive-level decision
- Per-shift roles — not needed at current scope
- Push notifications — web only for now
- Parental ongoing notifications — future consideration
- Chapter transfer for members — manual Board action if ever needed
- notification_preferences scalability — new event types require schema migration, accepted tradeoff
- Audit fields on shifts and project_roles — not tracked, acceptable at current scale