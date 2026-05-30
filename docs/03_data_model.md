# Ethos App — Data Model v2.1

All primary keys use UUID unless noted. Integer IDs are used for lookup/reference tables only.

## Confirmed Updates Since v2.0 PDF
- `org_roles`: "Admin" renamed to "Board"
- `notifications`: added `is_read` BOOLEAN, `read_at` TIMESTAMP nullable
- `notification_preferences`: in-app notifications always on — no column needed. Email and Slack are the only toggleable channels per event. Constraint: email and Slack cannot both be disabled for an event type since in-app covers baseline.
- `recents`: ON DELETE CASCADE on reference_id — when a project or file is deleted its recents rows are automatically removed. Dwell-time trigger (3–5 seconds on page, not on click). Database keeps 20 rows per user max, UI displays 10. Oldest rows beyond 20 deleted on each upsert.
- `badges`: added `badge_category` ENUM (Participation, Achievement). Participation badges have optional `project_id` FK. Achievement badges have `project_id` = null.
- `files`: all approved members can see all files regardless of project. No per-member filtering.
- `users`: added `chapter_id` FK → chapters (new entity, see below)
- New entity: `chapters`
- New entity: `notifications_inbox` (in-app notification feed, separate from the log)
- `notification_preferences`: Slack notifications fall back to email only if `slack_user_id` is null on the user record.

---

## Entities

### 1. users
Every person with an account. All volunteers are minors ages 14–17.

| Field | Type | Description |
|---|---|---|
| user_id | UUID · PK | Primary identifier. Never changes. |
| first_name | VARCHAR(50) | Legal first name. |
| last_name | VARCHAR(50) | Legal last name. |
| date_of_birth | DATE | Used to verify minimum age (14). Flag under-13s for COPPA. |
| personal_email | VARCHAR(150) | Gmail used at signup. Used pre-Ethos account. |
| ethos_email | VARCHAR(150) · nullable | Assigned manually by Board after approval. |
| active_login_email | VARCHAR(150) | Whichever email they currently authenticate with. |
| slack_user_id | VARCHAR(100) · nullable | Slack user ID stored after OAuth connection. |
| guardian_name | VARCHAR(150) | Full name of parent or legal guardian. |
| guardian_email | VARCHAR(150) | Guardian email — receives parental consent form. |
| guardian_phone | VARCHAR(30) · nullable | Guardian phone. Optional. |
| org_role_id | INTEGER · FK → org_roles | Permission level in the app. |
| chapter_id | UUID · FK → chapters | The chapter this member belongs to. |
| onboarding_complete | BOOLEAN | True once all one-time onboarding steps are done. |
| created_at | TIMESTAMP | When the account was created. |
| updated_at | TIMESTAMP | Last modified. |

**Note:** user_id is the permanent anchor. personal_email and ethos_email can coexist — active_login_email tracks which is currently used for authentication.

---

### 2. user_auth
Every Google account linked to a user. Handles personal Gmail + Ethos Workspace account on one profile.

| Field | Type | Description |
|---|---|---|
| auth_id | UUID · PK | Unique auth record. |
| user_id | UUID · FK → users | The user this login belongs to. |
| google_account_email | VARCHAR(150) | Google account email used to sign in. |
| is_active | BOOLEAN | Whether this login method is currently active. |
| linked_at | TIMESTAMP | When this Google account was linked. |

**Note:** One user can have multiple rows. Board links Ethos email by adding a new row and setting is_active = true.

---

### 3. org_roles
Lookup table. Three permission levels. All can be held by minors.

| Field | Type | Description |
|---|---|---|
| role_id | INTEGER · PK | 1, 2, or 3. |
| role_name | VARCHAR(50) | Member, Project Lead, or Board. |
| description | TEXT | What this role can do. |

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
| location | VARCHAR(200) · nullable | Physical address. Null for virtual. |
| created_by | UUID · FK → users | The Project Lead who created it. |
| requested_budget | DECIMAL(10,2) · nullable | Amount PM requested from Ethos funds. |
| allocated_budget | DECIMAL(10,2) · nullable | Amount approved by Board. |
| max_applications | INTEGER | Max volunteers allowed. |
| is_published | BOOLEAN | True when PM checklist complete and project is public. |
| is_open_call | BOOLEAN | True if appears on Open Call board. |
| open_call_app_level | ENUM · nullable | Full App, Mid App, No App. For Open Call projects only. |
| created_at | TIMESTAMP | When created. |
| updated_at | TIMESTAMP | Last modified. |

**Note:** Closed projects cannot be reopened. A new project must be created.

---

### 6. project_types
Lookup table for project type labels.

| Field | Type | Description |
|---|---|---|
| type_id | INTEGER · PK | Simple numeric ID. |
| type_name | VARCHAR(50) | Event, Campaign, or Program. |

**HQ team categories** (used for HQ projects): Media, Newsletter, Business, STEM, Funding, Finance, CS. These map to project_types or a separate HQ category field — to be decided during API spec.

---

### 7. shifts
Individual time slots within a project. One project can have many shifts.

| Field | Type | Description |
|---|---|---|
| shift_id | UUID · PK | Unique shift identifier. |
| project_id | UUID · FK → projects | The project this shift belongs to. |
| start_datetime | TIMESTAMP | Start date and time. |
| end_datetime | TIMESTAMP | End date and time. |
| location | VARCHAR(200) · nullable | Can differ from project location. |
| capacity | INTEGER | Max volunteers for this shift. |
| notes | TEXT · nullable | Shift-specific instructions. |

**Note:** Roles are at project level, not per shift. Approved volunteers attend all shifts.

---

### 8. project_roles
Roles defined by a Project Lead when creating a project.

| Field | Type | Description |
|---|---|---|
| project_role_id | UUID · PK | Unique role definition. |
| project_id | UUID · FK → projects | The project this role belongs to. |
| role_name | VARCHAR(100) | e.g. Site Lead, Photographer, Educator. |
| description | TEXT · nullable | What this role does. |
| capacity | INTEGER | How many volunteers can hold this role. |

**Note:** Project Lead defines roles at creation. Can edit after approval. Members cannot change their own role. Project Lead can reassign roles.

---

### 9. applications
A volunteer's application to join a project.

| Field | Type | Description |
|---|---|---|
| application_id | UUID · PK | Unique application. |
| user_id | UUID · FK → users | The volunteer who applied. |
| project_id | UUID · FK → projects | The project applied to. |
| status | ENUM | Pending, Approved, Rejected, Withdrawn. |
| project_role_id | UUID · FK → project_roles · nullable | Role assigned on approval. Null until approved. |
| why_join | TEXT | Why the volunteer wants to join. |
| experience | TEXT · nullable | Optional relevant experience. |
| availability_notes | TEXT · nullable | Notes from availability step. |
| reviewed_by | UUID · FK → users · nullable | PM or Board who reviewed. |
| reviewed_at | TIMESTAMP · nullable | When the decision was made. |
| rejection_reason | TEXT · nullable | Optional reason on rejection. |
| submitted_at | TIMESTAMP | When submitted. |
| updated_at | TIMESTAMP | Last modified. |

**Rules:**
- Max 3 pending applications simultaneously
- Max 3 active (approved) projects simultaneously
- If on an HQ project, that is the only active project
- Rejected and Withdrawn applications are archived, not deleted
- Cannot re-apply to the same project in the same cycle
- Withdrawal only allowed while status = Pending
- Frees up one pending slot on withdrawal or rejection

---

### 10. onboarding
One-time Ethos onboarding record per user. Not repeated for subsequent projects.

| Field | Type | Description |
|---|---|---|
| onboarding_id | UUID · PK | Unique record. |
| user_id | UUID · FK → users · unique | One record per user. |
| slack_connected | BOOLEAN | True once Slack OAuth completed. |
| slack_connected_at | TIMESTAMP · nullable | When Slack was connected. |
| orientation_started_at | TIMESTAMP · nullable | When orientation videos first opened. |
| orientation_completed_at | TIMESTAMP · nullable | When all chapters finished. |
| orientation_progress | TEXT · nullable | JSON storing per-chapter completion. |
| waiver_status | ENUM | Not Started, Sent, Signed. |
| waiver_doc_id | VARCHAR(200) · nullable | OpenSign document reference ID. |
| waiver_signed_at | TIMESTAMP · nullable | When volunteer signed. |
| parental_consent_status | ENUM | Not Started, Sent, Signed. |
| parental_consent_doc_id | VARCHAR(200) · nullable | OpenSign document reference ID. |
| parental_consent_signed_at | TIMESTAMP · nullable | When guardian signed. |
| completed_at | TIMESTAMP · nullable | When all steps finished. |

**Step order:** Slack → Orientation → Waiver → Parental Consent → PM Review

**Note:** Steps unlock sequentially. On reapplication after rejection, completed steps are preserved — user picks up from first incomplete step.

---

### 11. tasks
Tasks assigned to volunteers within a project.

| Field | Type | Description |
|---|---|---|
| task_id | UUID · PK | Unique task. |
| project_id | UUID · FK → projects | The project this task belongs to. |
| assigned_to | UUID · FK → users · nullable | Assigned volunteer. Null if unassigned. |
| created_by | UUID · FK → users | Who created the task. |
| title | VARCHAR(200) | Short task name. |
| description | TEXT · nullable | Full task details. |
| status | ENUM | Not Started, In Progress, Awaiting Input, Complete. |
| due_date | DATE · nullable | Optional due date. |
| created_at | TIMESTAMP | When created. |
| updated_at | TIMESTAMP | Last modified. |

**Rules:**
- Members can see all tasks on their project (not just their own)
- Members can update status of their own assigned tasks
- Project Leads can create, assign, reassign, edit, and delete any task on their project — including completed ones
- Awaiting Input = decision needed from Project Lead or Board before volunteer can proceed

---

### 12. badges
Badge types. Created by Board only (CS HQ team eventually).

| Field | Type | Description |
|---|---|---|
| badge_id | UUID · PK | Unique badge type. |
| badge_category | ENUM | Participation, Achievement. |
| project_id | UUID · FK → projects · nullable | For Participation badges. Null for Achievement. |
| name | VARCHAR(100) | e.g. Ethos Conf '25, VOTY '26. |
| description | TEXT · nullable | What this badge represents. |
| image_url | VARCHAR(300) · nullable | Badge image asset link. |
| created_by | UUID · FK → users | Board member who created it. |
| created_at | TIMESTAMP | When defined. |

---

### 13. user_badges
Record of a badge awarded to a specific user.

| Field | Type | Description |
|---|---|---|
| user_badge_id | UUID · PK | Unique award record. |
| user_id | UUID · FK → users | The volunteer receiving the badge. |
| badge_id | UUID · FK → badges | The badge being awarded. |
| awarded_by | UUID · FK → users | Who awarded it. |
| awarded_at | TIMESTAMP | Date awarded. |
| note | TEXT · nullable | Optional note from awarder. |

**Rules:**
- Participation badges awarded by Project Lead to their volunteers
- Achievement badges (incl. VOTY) awarded by Board only
- VOTY displayed as subtitle on directory profile
- Both categories displayed on directory profile, potentially in separate sections

---

### 14. announcements
Org-wide announcements synced one-way from Slack #announcements channel.

| Field | Type | Description |
|---|---|---|
| announcement_id | UUID · PK | Unique announcement. |
| slack_message_id | VARCHAR(100) | Slack message ID. Used for deduplication. |
| slack_channel_id | VARCHAR(100) | The Slack channel it came from. |
| posted_by_slack_user | VARCHAR(100) | Slack username of poster. |
| content | TEXT | The announcement text. |
| posted_at | TIMESTAMP | When posted in Slack. |
| synced_at | TIMESTAMP | When pulled into app. |

**Note:** One-way sync only. App never writes back to Slack. Only #announcements channel is synced.

---

### 15. donations
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

**Note:** Board manages donations now. Fundraising HQ team lead takes over eventually — no schema change needed.

---

### 16. fundraising_contacts
Donors, partners, and contacts. Visible to all members.

| Field | Type | Description |
|---|---|---|
| contact_id | UUID · PK | Unique contact. |
| name | VARCHAR(150) | Full name or org name. |
| type | ENUM | Donor, Partner, Sponsor, Other. |
| email | VARCHAR(150) · nullable | Contact email. |
| phone | VARCHAR(30) · nullable | Contact phone. |
| notes | TEXT · nullable | Relationship context. |
| added_by | UUID · FK → users | Who added this contact. |
| created_at | TIMESTAMP | When added. |
| updated_at | TIMESTAMP | Last modified. |

---

### 17. files
References to files in Ethos Google Drive. Metadata only — no file content stored.

| Field | Type | Description |
|---|---|---|
| file_id | UUID · PK | Unique file record. |
| project_id | UUID · FK → projects · nullable | Project file belongs to. Null for Universal files. |
| drive_file_id | VARCHAR(200) | Google Drive file ID. |
| drive_url | VARCHAR(500) | Full shareable Drive URL. |
| file_name | VARCHAR(200) | Display name. |
| file_type | VARCHAR(50) | PDF, Google Doc, Sheet, Image, etc. |
| category | ENUM | Project, Universal. |
| description | TEXT · nullable | Context about the file. |
| added_by | UUID · FK → users | PM or Board who added it. |
| created_at | TIMESTAMP | When added to app. |

**Rules:**
- All approved members can see all files — no per-member filtering
- Project Leads can add Project-category files to their own projects
- Board can add Universal files
- Universal files have project_id = null

---

### 18. notifications
Log of every notification sent across all channels.

| Field | Type | Description |
|---|---|---|
| notification_id | UUID · PK | Unique record. |
| user_id | UUID · FK → users | Recipient. |
| sent_to_email | VARCHAR(150) · nullable | Email used at send time. Null for Slack-only. |
| sent_to_slack_user_id | VARCHAR(100) · nullable | Slack user ID at send time. Null for email-only. |
| channel | ENUM | Email, Slack, Both, InApp. |
| event_type | ENUM | Application Received, Approved, Rejected, Task Assigned, Task Updated, Onboarding Step, Badge Awarded, Role Changed, Announcement, General. |
| subject | VARCHAR(200) · nullable | Email subject. Null for Slack/InApp only. |
| body | TEXT | Notification content. |
| is_read | BOOLEAN | False until user opens in-app. |
| read_at | TIMESTAMP · nullable | When marked read. |
| sent_at | TIMESTAMP | When sent. |
| status | ENUM | Sent, Failed, Bounced. |

**Note:** Failed notifications retry up to 3 times. sent_to_email and sent_to_slack_user_id stored at send time for permanent record.

---

### 19. notification_preferences
Per-user, per-event toggles for email and Slack. In-app is always on.

| Field | Type | Description |
|---|---|---|
| preference_id | UUID · PK | Unique record. |
| user_id | UUID · FK → users · unique | One record per user. |
| application_received_email | BOOLEAN | Default true. |
| application_received_slack | BOOLEAN | Default true. |
| application_approved_email | BOOLEAN | Default true. |
| application_approved_slack | BOOLEAN | Default true. |
| application_rejected_email | BOOLEAN | Default true. |
| application_rejected_slack | BOOLEAN | Default true. |
| task_assigned_email | BOOLEAN | Default true. |
| task_assigned_slack | BOOLEAN | Default true. |
| task_updated_email | BOOLEAN | Default true. |
| task_updated_slack | BOOLEAN | Default true. |
| badge_awarded_email | BOOLEAN | Default true. |
| badge_awarded_slack | BOOLEAN | Default true. |
| role_changed_email | BOOLEAN | Default true. |
| role_changed_slack | BOOLEAN | Default true. |
| announcement_email | BOOLEAN | Default true. |
| announcement_slack | BOOLEAN | Default true. |
| updated_at | TIMESTAMP | Last changed. |

**Rules:**
- In-app notifications always on — no toggle, no column needed
- For each event type, email and Slack cannot both be false
- If slack_user_id is null on user record, falls back to email regardless of preference
- Record created with all values = true on first approval

---

### 20. recents
Recently visited pages per user.

| Field | Type | Description |
|---|---|---|
| recent_id | UUID · PK | Unique record. |
| user_id | UUID · FK → users | The user who visited. |
| page_type | ENUM | Project, File. |
| reference_id | UUID | The project_id or file_id visited. ON DELETE CASCADE. |
| visited_at | TIMESTAMP | When last visited. |

**Rules:**
- Fires on dwell (3–5 seconds on page), not on navigation click
- One row per user per page — revisiting updates visited_at, no duplicate
- Database keeps 20 rows per user max — oldest deleted on each upsert
- UI displays 10 most recent by visited_at descending
- ON DELETE CASCADE: when a project or file is deleted, its recents rows auto-delete

---

### 21. directory_profiles
Public-facing profile for each volunteer.

| Field | Type | Description |
|---|---|---|
| profile_id | UUID · PK | Unique profile. |
| user_id | UUID · FK → users · unique | One per user. |
| bio | TEXT · nullable | Self-written by volunteer. |
| is_visible | BOOLEAN | Always true — profiles cannot be hidden. |
| updated_at | TIMESTAMP | Last edited. |

**Note:** Project history derived from applications where status = Approved. Badges derived from user_badges. Bio is the only field the volunteer directly edits. Board can edit any profile via Supabase dashboard — not a UI feature.

---

### 22. system_logs
Integration failure and error log.

| Field | Type | Description |
|---|---|---|
| log_id | UUID · PK | Unique log entry. |
| integration | ENUM | Supabase, OpenSign, Slack, Resend, GoogleDrive. |
| error_type | VARCHAR(100) | Short error classification. |
| error_message | TEXT | Full error detail. |
| affected_user_id | UUID · FK → users · nullable | User affected if applicable. |
| resolved | BOOLEAN | False until Board marks resolved. |
| occurred_at | TIMESTAMP | When the error occurred. |
| resolved_at | TIMESTAMP · nullable | When resolved. |

---

## Future Considerations (Not in Scope)
- Grant checklists — workflow not yet defined
- Automated background check integration — manual process sufficient at current scale
- File upload permissions for members — deferred, handled at Drive level
- Per-shift roles — not needed at current scope
- Push notifications — web only for now
- Parental ongoing notifications — future consideration
