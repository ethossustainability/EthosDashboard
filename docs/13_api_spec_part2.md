# Ethos App — API Spec (Part 2)

## Application Endpoints

### GET /api/applications
Get applications. Scope depends on role.
**Auth:** Required.
**Query params:**
- `project_id` — uuid, filter by project
- `status` — enum (Pending, Approved, Rejected, Withdrawn)
- `user_id` — uuid, Board only
- `page` — integer, default 1
- `per_page` — integer, default 20
**Scope:**
- Member: own applications only
- Project Lead: applications to own projects only
- Board: all applications
**Response:**
```json
{
  "data": {
    "applications": [
      {
        "application_id": "uuid",
        "user_id": "uuid",
        "applicant_name": "Jordan Torres",
        "project_id": "uuid",
        "project_name": "Creek Cleanup",
        "status": "Pending",
        "project_role_id": null,
        "project_role_name": null,
        "why_join": "I care about local waterways.",
        "experience": null,
        "availability_notes": null,
        "reviewed_by": null,
        "reviewed_at": null,
        "rejection_reason": null,
        "submitted_at": "2025-04-01T10:00:00Z",
        "updated_at": "2025-04-01T10:00:00Z"
      }
    ],
    "total": 3,
    "page": 1,
    "per_page": 20
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED, FORBIDDEN

---

### POST /api/applications
Submit a new application.
**Auth:** Required.
**Request body:**
```json
{
  "project_id": "uuid",
  "why_join": "I care about local waterways.",
  "experience": null,
  "availability_notes": null
}
```
**Response:** Created application object
**Logic:**
- Validates: user does not have 3 pending applications already
- Validates: user does not have 3 active (approved) projects already
- Validates: user is not already on this project
- Validates: user was not rejected from this project in the same cycle
- Validates: project is published and accepting applications
- If user is on an HQ project: blocks application to any other project
- Sets status = Pending
- Sends confirmation notification to applicant (in-app + email + Slack)
- Sends notification to Project Lead (in-app + Slack)
**Errors:** UNAUTHORIZED, VALIDATION_ERROR, LIMIT_REACHED (pending or active max), CONFLICT (already applied, already rejected)

---

### PATCH /api/applications/:application_id/approve
Approve an application.
**Auth:** Required. Project Lead (own project) or Board (any).
**Request body:**
```json
{ "project_role_id": "uuid" }
```
**Response:** Updated application object with status = Approved
**Logic:**
- project_role_id required — cannot approve without assigning a role
- Sets reviewed_by = current user, reviewed_at = now
- Notifies applicant (in-app + email + Slack)
- Adds applicant to project's Slack channel via Slack API
- Creates notification_preferences record for user if first approval
- Creates directory_profile record for user if first approval
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR (missing role), INTEGRATION_ERROR (Slack add failed — approval still proceeds, logged to system_logs)

---

### PATCH /api/applications/:application_id/reject
Reject an application.
**Auth:** Required. Project Lead (own project) or Board (any).
**Request body:**
```json
{ "rejection_reason": "We filled all available spots." }
```
rejection_reason is optional — can be empty string or null.
**Response:** Updated application object with status = Rejected
**Logic:**
- Sets reviewed_by = current user, reviewed_at = now
- Notifies applicant (in-app + email + Slack)
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

### PATCH /api/applications/:application_id/withdraw
Withdraw own pending application.
**Auth:** Required. Applicant only.
**Request body:** none
**Response:** Updated application object with status = Withdrawn
**Logic:**
- Only allowed if current status = Pending
- Cannot withdraw Approved applications — must contact Project Lead directly
- Frees up one pending slot
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT (status is not Pending)

---

### PATCH /api/applications/:application_id/reassign-role
Reassign the project role of an approved volunteer.
**Auth:** Required. Project Lead (own project) or Board (any).
**Request body:**
```json
{ "project_role_id": "uuid" }
```
**Response:** Updated application object
**Logic:**
- Only allowed if current status = Approved
- Notifies volunteer of role change (in-app + email + Slack)
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR

---

## Onboarding Endpoints

### GET /api/onboarding/me
Get current user's onboarding record.
**Auth:** Required.
**Response:**
```json
{
  "data": {
    "onboarding_id": "uuid",
    "user_id": "uuid",
    "slack_connected": true,
    "slack_connected_at": "2025-04-01T10:05:00Z",
    "orientation_started_at": "2025-04-01T10:10:00Z",
    "orientation_completed_at": "2025-04-01T10:45:00Z",
    "orientation_progress": { "welcome": true, "safety": true, "how_we_work": true, "faqs": true },
    "waiver_status": "Signed",
    "waiver_signed_at": "2025-04-01T11:00:00Z",
    "parental_consent_status": "Signed",
    "parental_consent_signed_at": "2025-04-01T12:00:00Z",
    "completed_at": "2025-04-01T12:01:00Z"
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED

---

### POST /api/onboarding/connect-slack
Complete Slack OAuth and store slack_user_id.
**Auth:** Required.
**Request body:**
```json
{ "slack_code": "the_oauth_code_from_slack" }
```
**Response:**
```json
{
  "data": {
    "slack_user_id": "U12345678",
    "slack_connected": true
  },
  "error": null
}
```
**Logic:**
- Exchanges Slack OAuth code for access token using Slack API
- Retrieves slack_user_id from Slack identity
- Stores slack_user_id on users record
- Sets slack_connected = true and slack_connected_at = now on onboarding record
- If user not yet in Ethos workspace: Slack bot invites them before storing ID
**Errors:** UNAUTHORIZED, INTEGRATION_ERROR (Slack OAuth failed)

---

### PATCH /api/onboarding/orientation-progress
Update orientation video chapter progress.
**Auth:** Required.
**Request body:**
```json
{
  "chapter": "safety",
  "completed": true
}
```
Valid chapter values: welcome, safety, how_we_work, faqs
**Response:** Updated onboarding object
**Logic:**
- Updates orientation_progress JSON field
- If all four chapters = true: sets orientation_completed_at = now
- Sets orientation_started_at on first call if not already set
**Errors:** UNAUTHORIZED, VALIDATION_ERROR (invalid chapter name)

---

### POST /api/onboarding/send-waiver
Send liability waiver to volunteer via OpenSign.
**Auth:** Required (system triggers this — called internally when orientation completes).
**Request body:** none
**Response:**
```json
{ "data": { "waiver_status": "Sent", "waiver_doc_id": "opensign_doc_id" }, "error": null }
```
**Logic:**
- Creates OpenSign document from waiver template
- Sends to user's active_login_email
- Stores document ID in onboarding.waiver_doc_id
- Sets waiver_status = Sent
**Errors:** UNAUTHORIZED, INTEGRATION_ERROR

---

### POST /api/onboarding/send-parental-consent
Send parental consent form to guardian via OpenSign.
**Auth:** Required (system triggers when waiver is signed).
**Request body:** none
**Response:**
```json
{ "data": { "parental_consent_status": "Sent", "parental_consent_doc_id": "opensign_doc_id" }, "error": null }
```
**Logic:**
- Creates OpenSign document from parental consent template
- Sends to users.guardian_email
- Stores document ID in onboarding.parental_consent_doc_id
- Sets parental_consent_status = Sent
**Errors:** UNAUTHORIZED, INTEGRATION_ERROR

---

### POST /api/onboarding/resend-parental-consent
Resend parental consent reminder to guardian. Volunteer-triggered.
**Auth:** Required.
**Request body:** none
**Response:**
```json
{ "data": { "reminder_sent": true, "next_allowed_at": "2025-04-02T12:00:00Z" }, "error": null }
```
**Logic:**
- Enforces once-per-24-hours limit
- Sends reminder email via Resend to guardian_email
- Does not create a new OpenSign document — resends the existing link
**Errors:** UNAUTHORIZED, CONFLICT (rate limit — includes next_allowed_at in error)

---

### POST /api/webhooks/opensign
Receive OpenSign webhook when a document is signed.
**Auth:** OpenSign signing secret verification (not JWT).
**Request body:** OpenSign webhook payload
**Logic:**
- Verifies OpenSign signature header
- Identifies document by doc_id (matches waiver_doc_id or parental_consent_doc_id)
- Updates waiver_status = Signed or parental_consent_status = Signed
- Sets signed_at timestamp
- If waiver signed: triggers send-parental-consent
- If parental consent signed AND all other pre-review steps done: notifies Project Lead that application is ready to review
- If both signed: checks if orientation also complete — if all done, sets onboarding.completed_at
**Errors:** Returns 400 if signature verification fails

---

## Task Endpoints

### GET /api/tasks
Get tasks. Scope depends on role and query.
**Auth:** Required.
**Query params:**
- `project_id` — uuid, filter by project (required for members — cannot fetch all tasks org-wide)
- `assigned_to` — uuid (self only for members, any for Lead on own project, any for Board)
- `status` — enum
- `page` — integer, default 1
- `per_page` — integer, default 50
**Response:**
```json
{
  "data": {
    "tasks": [
      {
        "task_id": "uuid",
        "project_id": "uuid",
        "project_name": "Creek Cleanup",
        "assigned_to": "uuid",
        "assignee_name": "Jordan Torres",
        "created_by": "uuid",
        "title": "Review site safety guidelines",
        "description": null,
        "status": "Not Started",
        "due_date": "2025-04-29",
        "created_at": "2025-04-01T00:00:00Z",
        "updated_at": "2025-04-01T00:00:00Z"
      }
    ],
    "total": 7
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED, FORBIDDEN

---

### POST /api/tasks
Create a new task.
**Auth:** Required. Project Lead (own project) or Board.
**Request body:**
```json
{
  "project_id": "uuid",
  "assigned_to": "uuid",
  "title": "Review site safety guidelines",
  "description": null,
  "status": "Not Started",
  "due_date": "2025-04-29"
}
```
**Response:** Created task object
**Logic:**
- assigned_to must be an approved member on the project
- Sends task assigned notification to assignee
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR

---

### PATCH /api/tasks/:task_id
Update a task.
**Auth:** Required.
**Request body:** Any subset of task fields
**Scope:**
- Member: can only update status of own assigned tasks. No other fields.
- Project Lead: all fields on own project tasks
- Board: all fields on any task
**Logic:**
- Member moving task to Awaiting Input: blocked — only Lead/Board can set Awaiting Input
- Lead moving task out of Awaiting Input: allowed — this is the unblocking action
- Status change triggers notification to task creator if changed by assignee
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR

---

### DELETE /api/tasks/:task_id
Delete a task.
**Auth:** Required. Project Lead (own project) or Board.
**Response:** `{ "data": { "deleted": true }, "error": null }`
**Logic:** Can delete completed tasks. Confirmation enforced client-side.
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

## File Endpoints

### GET /api/files
Get all files visible to current user.
**Auth:** Required.
**Query params:**
- `search` — string
- `category` — enum (Project, Universal)
- `project_id` — uuid
- `page` — integer, default 1
- `per_page` — integer, default 20
**Response:**
```json
{
  "data": {
    "files": [
      {
        "file_id": "uuid",
        "project_id": "uuid",
        "project_name": "Creek Cleanup",
        "drive_file_id": "google_drive_id",
        "drive_url": "https://drive.google.com/...",
        "file_name": "Safety Guidelines.pdf",
        "file_type": "PDF",
        "category": "Project",
        "description": "Pre-event safety reading.",
        "added_by": "uuid",
        "added_by_name": "Alex Kim",
        "created_at": "2025-03-15T00:00:00Z"
      }
    ],
    "total": 12
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED

---

### POST /api/files
Add a file reference.
**Auth:** Required. Project Lead (project files for own projects) or Board (any including Universal).
**Request body:**
```json
{
  "project_id": "uuid",
  "drive_url": "https://drive.google.com/file/d/...",
  "file_name": "Safety Guidelines.pdf",
  "file_type": "PDF",
  "category": "Project",
  "description": "Pre-event safety reading."
}
```
**Response:** Created file object
**Logic:**
- drive_file_id extracted from drive_url automatically
- category = Universal only allowed for Board
- project_id required if category = Project
- project_id must be null if category = Universal
**Errors:** UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR

---

### DELETE /api/files/:file_id
Remove a file reference.
**Auth:** Required. Project Lead (own project files) or Board (any).
**Response:** `{ "data": { "deleted": true }, "error": null }`
**Logic:** Removes from app only — does not delete from Google Drive.
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

## Badge Endpoints

### GET /api/badges
Get all badge types.
**Auth:** Required.
**Response:**
```json
{
  "data": {
    "badges": [
      {
        "badge_id": "uuid",
        "badge_category": "Participation",
        "project_id": "uuid",
        "project_name": "Creek Cleanup",
        "name": "Creek Cleanup '25",
        "description": "Completed the 2025 Creek Cleanup event.",
        "image_url": "https://drive.google.com/...",
        "created_by": "uuid",
        "created_at": "2025-04-01T00:00:00Z"
      }
    ]
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED

---

### POST /api/badges
Create a new badge type. Board only.
**Auth:** Required. Board only.
**Request body:**
```json
{
  "badge_category": "Participation",
  "project_id": "uuid",
  "name": "Creek Cleanup '25",
  "description": "Completed the 2025 Creek Cleanup event.",
  "image_url": null
}
```
**Response:** Created badge object
**Errors:** UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR

---

### POST /api/badges/:badge_id/award
Award a badge to a volunteer.
**Auth:** Required.
**Request body:**
```json
{
  "user_id": "uuid",
  "note": null
}
```
**Scope:**
- Project Lead: can award Participation badges only, to own project volunteers only
- Board: can award any badge to any member
**Response:** Created user_badge object
**Logic:**
- Sends badge awarded notification to recipient (in-app + email + Slack)
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT (badge already awarded to this user)

---

## Notification Endpoints

### GET /api/notifications/me
Get current user's notification inbox.
**Auth:** Required.
**Query params:**
- `is_read` — boolean, filter by read status
- `page` — integer, default 1
- `per_page` — integer, default 20
**Response:**
```json
{
  "data": {
    "notifications": [
      {
        "notification_id": "uuid",
        "event_type": "Application Approved",
        "body": "Your application to Creek Cleanup has been approved.",
        "is_read": false,
        "read_at": null,
        "sent_at": "2025-04-05T14:00:00Z"
      }
    ],
    "unread_count": 3,
    "total": 12
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED

---

### PATCH /api/notifications/:notification_id/read
Mark a notification as read.
**Auth:** Required. Own notifications only.
**Request body:** none
**Response:** Updated notification object with is_read = true, read_at = now
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

### PATCH /api/notifications/read-all
Mark all unread notifications as read.
**Auth:** Required.
**Request body:** none
**Response:** `{ "data": { "marked_read": 3 }, "error": null }`
**Errors:** UNAUTHORIZED

---

### GET /api/notification-preferences/me
Get current user's notification preferences.
**Auth:** Required.
**Response:** Full notification_preferences object (all boolean fields)
**Errors:** UNAUTHORIZED

---

### PATCH /api/notification-preferences/me
Update notification preferences.
**Auth:** Required.
**Request body:** Any subset of boolean preference fields
**Logic:**
- Validates: for each event type, email and Slack cannot both be set to false simultaneously
- If slack_user_id is null on user record: Slack preferences saved but have no effect until Slack connected
**Errors:** UNAUTHORIZED, VALIDATION_ERROR (both channels disabled for an event type)

---

## Announcement Endpoints

### GET /api/announcements
Get all announcements.
**Auth:** Required.
**Query params:**
- `page` — integer, default 1
- `per_page` — integer, default 20
**Response:**
```json
{
  "data": {
    "announcements": [
      {
        "announcement_id": "uuid",
        "posted_by_slack_user": "gerry_ethos",
        "content": "Spring cleanup season is here!",
        "posted_at": "2025-04-01T09:00:00Z",
        "synced_at": "2025-04-01T09:00:05Z"
      }
    ],
    "total": 24,
    "last_synced_at": "2025-04-01T09:00:05Z"
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED

---

### POST /api/webhooks/slack/announcements
Receive Slack webhook for #announcements channel messages.
**Auth:** Slack signing secret verification (not JWT).
**Logic:**
- Verifies Slack signing secret
- Deduplicates using slack_message_id
- Inserts new row in announcements table
- Sends announcement notification to all members per their preferences
**Errors:** Returns 400 if signature verification fails

---

### POST /api/webhooks/slack/project-updates
Receive Slack webhook for project channel messages.
**Auth:** Slack signing secret verification (not JWT).
**Logic:**
- Verifies Slack signing secret
- Matches slack_channel_id to project record
- Deduplicates using slack_message_id
- Inserts new row in project_updates table
**Errors:** Returns 400 if signature fails, 404 if channel not matched to a project

---

## Project Updates Endpoints

### GET /api/projects/:project_id/updates
Get the project Slack feed.
**Auth:** Required. Must be approved member on this project, Project Lead, or Board.
**Query params:**
- `page` — integer, default 1
- `per_page` — integer, default 50
**Response:**
```json
{
  "data": {
    "updates": [
      {
        "update_id": "uuid",
        "posted_by_slack_user": "alex_lead",
        "content": "Remember to bring gloves tomorrow!",
        "posted_at": "2025-04-29T18:00:00Z"
      }
    ],
    "total": 14
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

## Recents Endpoints

### GET /api/recents/me
Get current user's recent pages.
**Auth:** Required.
**Response:**
```json
{
  "data": {
    "recents": [
      {
        "page_type": "Project",
        "reference_id": "uuid",
        "name": "Denton Creek Cleanup",
        "visited_at": "2025-04-30T10:00:00Z"
      }
    ]
  },
  "error": null
}
```
**Logic:** Returns 10 most recent by visited_at descending. Names resolved from projects or files table.
**Errors:** UNAUTHORIZED

---

### POST /api/recents
Upsert a recent page visit (called after dwell time on page).
**Auth:** Required.
**Request body:**
```json
{
  "page_type": "Project",
  "reference_id": "uuid"
}
```
**Response:** `{ "data": { "recorded": true }, "error": null }`
**Logic:**
- Upserts: updates visited_at if row exists, inserts if not
- Enforces 20-row max per user — deletes oldest if exceeded
**Errors:** UNAUTHORIZED, VALIDATION_ERROR

---

## Fundraising Endpoints

### GET /api/donations
Get donation history.
**Auth:** Required.
**Query params:**
- `page` — integer, default 1
- `per_page` — integer, default 20
**Response:** Paginated list of donation objects with donor name resolved from fundraising_contacts
**Errors:** UNAUTHORIZED

---

### POST /api/donations
Add a donation record. Board only.
**Auth:** Required. Board only.
**Request body:**
```json
{
  "contact_id": "uuid",
  "amount": 500.00,
  "donated_at": "2025-04-01",
  "notes": null
}
```
**Response:** Created donation object
**Errors:** UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR

---

### PATCH /api/donations/:donation_id
Update a donation. Board only.
**Auth:** Required. Board only.
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR

---

### DELETE /api/donations/:donation_id
Delete a donation. Board only.
**Auth:** Required. Board only.
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

### GET /api/fundraising-contacts
Get contacts/partners list.
**Auth:** Required.
**Query params:** `search`, `type` (enum), `page`, `per_page`
**Response:** Paginated contact objects
**Errors:** UNAUTHORIZED

---

### POST /api/fundraising-contacts
Add a contact. Board only.
**Auth:** Required. Board only.
**Request body:**
```json
{
  "name": "Jane Doe",
  "type": "Donor",
  "email": "jane@example.com",
  "phone": null,
  "notes": null
}
```
**Errors:** UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR

---

### PATCH /api/fundraising-contacts/:contact_id
Update a contact. Board only.
**Auth:** Required. Board only.
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

### DELETE /api/fundraising-contacts/:contact_id
Delete a contact. Board only.
**Auth:** Required. Board only.
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

## Org Settings Endpoints

### GET /api/org-settings
Get all org settings.
**Auth:** Required.
**Response:**
```json
{
  "data": {
    "settings": [
      { "key": "fundraising_goal_2025", "value": "10000" }
    ]
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED

---

### PATCH /api/org-settings/:key
Update an org setting. Board only.
**Auth:** Required. Board only.
**Request body:**
```json
{ "value": "15000" }
```
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

## Volunteer Flags Endpoints

### POST /api/flags
Flag a volunteer. Project Lead only (own project volunteers).
**Auth:** Required. Project Lead or Board.
**Request body:**
```json
{
  "user_id": "uuid",
  "project_id": "uuid",
  "shift_id": "uuid",
  "reason": "Did not attend scheduled shift."
}
```
**Response:** Created flag object
**Logic:**
- Notifies flagged volunteer (in-app + email + Slack)
**Errors:** UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR

---

### GET /api/flags
Get all flags. Board only.
**Auth:** Required. Board only.
**Query params:** `resolved` (boolean), `user_id`, `project_id`, `page`, `per_page`
**Errors:** UNAUTHORIZED, FORBIDDEN

---

### PATCH /api/flags/:flag_id/resolve
Mark a flag as resolved. Board only.
**Auth:** Required. Board only.
**Response:** Updated flag object with resolved = true
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

## System Logs Endpoints

### GET /api/system-logs
Get system error logs. Board only.
**Auth:** Required. Board only.
**Query params:** `resolved` (boolean), `integration` (enum), `page`, `per_page`
**Errors:** UNAUTHORIZED, FORBIDDEN

---

### PATCH /api/system-logs/:log_id/resolve
Mark a log as resolved. Board only.
**Auth:** Required. Board only.
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND

---

## Policy Acknowledgment Endpoints

### GET /api/policy-acknowledgments/me
Get current user's acknowledgment status for all policy documents.
**Auth:** Required.
**Response:**
```json
{
  "data": {
    "acknowledgments": [
      {
        "file_id": "uuid",
        "file_name": "Volunteer Code of Conduct.pdf",
        "acknowledged": true,
        "acknowledged_at": "2025-04-01T11:00:00Z"
      },
      {
        "file_id": "uuid",
        "file_name": "Safety Policy 2025.pdf",
        "acknowledged": false,
        "acknowledged_at": null
      }
    ]
  },
  "error": null
}
```
**Errors:** UNAUTHORIZED

---

### POST /api/policy-acknowledgments
Acknowledge a policy document.
**Auth:** Required.
**Request body:**
```json
{ "file_id": "uuid" }
```
**Response:** Created acknowledgment object
**Logic:**
- Inserts row in policy_acknowledgments
- If already acknowledged: returns existing record (idempotent)
**Errors:** UNAUTHORIZED, VALIDATION_ERROR, NOT_FOUND (file not a policy document)

---

## Directory Profile Endpoints

### PATCH /api/directory-profiles/me
Update current user's bio.
**Auth:** Required.
**Request body:**
```json
{ "bio": "I care about local waterways and sustainability." }
```
**Response:** Updated directory_profile object
**Errors:** UNAUTHORIZED, VALIDATION_ERROR

---

## Budget Endpoints

### PATCH /api/projects/:project_id/budget
Set allocated budget for a project. Board only.
**Auth:** Required. Board only.
**Request body:**
```json
{ "allocated_budget": 400.00 }
```
**Response:** Updated project object
**Logic:**
- Notifies Project Lead of allocated amount (in-app + email + Slack)
**Errors:** UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR

---

## Search Endpoint

### GET /api/search
Global full-text search across projects, files, members, tasks, announcements.
**Auth:** Required.
**Query params:**
- `q` — string (required, min 2 characters)
- `type` — enum (Project, File, Member, Task, Announcement) — optional filter
- `page` — integer, default 1
- `per_page` — integer, default 20
**Response:**
```json
{
  "data": {
    "results": [
      {
        "type": "Project",
        "id": "uuid",
        "title": "Denton Creek Cleanup",
        "subtitle": "Event · Ethos Denton",
        "url": "/projects/uuid"
      },
      {
        "type": "Member",
        "id": "uuid",
        "title": "Jordan Torres",
        "subtitle": "Member · Ethos Denton",
        "url": "/directory/uuid"
      }
    ],
    "total": 5
  },
  "error": null
}
```
**Logic:**
- Uses PostgreSQL full-text search (tsvector/tsquery)
- Results scoped by user's chapter and permissions (members don't see other chapters' results)
- Target response time: under 500ms
- tsvector indexes required on: projects.name, projects.description, files.file_name, files.description, users.first_name, users.last_name, tasks.title, announcements.content
**Errors:** UNAUTHORIZED, VALIDATION_ERROR (query too short)
