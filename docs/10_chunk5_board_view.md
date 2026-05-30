# Ethos App — Chunk 5: Board View

## Overview

Board members see the same app as all other members but with:
- Elevated permissions on every existing screen (see Roles & Permissions doc)
- A dedicated **Board Panel** in the sidebar — visible to Board only
- Broader scope on all existing screens (org-wide instead of chapter-scoped)

The Board Panel consolidates actions and views that have no home in existing screens:
system logs, role management, budget allocation, volunteer flags, and org-wide analytics.

---

## Existing Screens — Board Differences

### Home
- Same layout as member home
- Org-wide metrics show totals across all chapters (not just one)
- Metrics are clickable — tapping drills into per-chapter breakdown

### My Projects
- Shows ALL projects across all chapters and HQ (not just own projects)
- Same card layout as Lead dashboard (Screen 4.1)
- Additional filter: Filter by chapter
- Pending applications badge visible on all project cards
- "New Project" button available — Board can create projects for any chapter

### Project Detail Page
- Same four tabs as Chunk 3
- Edit button visible on every project regardless of who created it
- Overview tab: full budget info (requested + allocated), edit budget inline
- Team roster: flag volunteer button on every member row
- Applications tab: Approve/Reject available on all applications
- Tasks tab: full Lead controls on any project
- Files tab: can add both Project and Universal files

### Directory
- Sees all members across all chapters and HQ
- Additional filter: Filter by chapter
- Can tap any member → profile → "Change Role" button visible
- "Change Role" opens a sheet: current role shown, dropdown to select new role, confirm
- Role change triggers notification to the affected member

### Files
- Same layout
- "Add Universal File" button visible — Board only
- Can remove any file (not just own)

### Fundraising
- Same layout as all members
- Add/Edit/Delete buttons visible on donations and contacts
- Board-only for now — Fundraising HQ team lead takes over eventually

### Training
- Same layout
- "Add Policy Document" button visible — Board only
- Adding a policy document: paste Drive URL, name it, confirm
- On add: all existing member acknowledgments reset — members must re-acknowledge

### Announcements feed
- Same layout
- Board can post in #announcements Slack channel (enforced at Slack channel permissions level)

---

## Board Panel

**Access:** Dedicated sidebar item visible to Board members only, below Fundraising.
**Icon:** Shield or settings icon — distinct from other nav items.

The Board Panel has five sections accessible as sub-navigation tabs:

---

### Panel 5.1 — Org Overview

**Purpose:** Org-wide health metrics with per-chapter breakdown.

#### Metrics (top row, same as home)
- Total active projects
- Total members
- Events this month
- Total funds raised

#### Per-Chapter Table
Each chapter listed as a row:
- Chapter name
- Active projects count
- Member count
- Pending applications count
- Funds allocated (sum of allocated_budget across all chapter projects)

#### Logic
- Tapping a chapter row filters the rest of the app to that chapter context
- Export button: exports full org metrics as CSV
- Board only

---

### Panel 5.2 — Role Management

**Purpose:** Promote or demote any member's org role.

#### Layout
- Search bar (search by name)
- Filter by current role: All / Member / Project Lead / Board
- Filter by chapter
- Member list — same row format as Directory

#### Member Row Actions
- Each row has a "Change Role" button
- Tapping opens a sheet:
  - Member name + current role
  - Dropdown: Member / Project Lead / Board
  - Confirm button
  - Confirmation warning: "This will change [Name]'s permissions immediately."

#### Logic
- Role change takes effect immediately
- Affected member notified via in-app + email + Slack
- Role change logged in system_logs
- Board cannot demote another Board member (prevents accidental lockout) — only possible via Supabase dashboard

---

### Panel 5.3 — Budget Requests

**Purpose:** Review project budget requests and set allocated amounts.

#### Layout
- Filter: All / Pending / Reviewed
- Project cards sorted by submitted date — oldest first

#### Budget Request Card
Each card shows:
- Project name + chapter
- Project Lead name
- Requested amount
- Current allocated amount (null if not yet reviewed)
- Submitted at date

#### Actions
- Tapping opens a review sheet:
  - Project name, description, requested amount
  - Allocated amount input field (DECIMAL)
  - Confirm button
- Confirming sets allocated_budget on the project record
- Project Lead notified via in-app + email + Slack with the allocated amount

#### Logic
- Allocated amount does not have to match requested amount
- Board can update allocated amount at any time
- If allocated_budget is null the card shows as "Pending" — shown at top of list
- Projects with no requested_budget do not appear here

---

### Panel 5.4 — Volunteer Flags

**Purpose:** Review all volunteer flags raised by Project Leads across all projects.

#### Layout
- Filter: All / Unresolved / Resolved
- Sorted by most recent first

#### Flag Cards
Each card shows:
- Volunteer name (tappable → directory profile)
- Project name
- Shift flagged (if applicable)
- Flagged by (Project Lead name)
- Reason (if provided)
- Created at timestamp
- Resolved / Unresolved status

#### Actions
- "Mark Resolved" button — sets resolved = true on the flag record
- "View Profile" button — opens the volunteer's directory profile
- No other actions — flags are informational. Board decides what to do based on pattern.

#### Logic
- Flags visible to flagging Lead and Board only
- Volunteer is notified when flagged (in-app + email + Slack)
- Pattern of flags across a volunteer's history visible on their directory profile (Board view only)
- Resolved flags remain in history — never deleted

---

### Panel 5.5 — System Logs

**Purpose:** View and resolve integration errors across all services.

#### Layout
- Filter: All / Unresolved / Resolved
- Filter by integration: All / Supabase / OpenSign / Slack / Resend / GoogleDrive
- Sorted by occurred_at descending (most recent first)

#### Log Cards
Each card shows:
- Integration name + icon
- Error type
- Error message (truncated — tap to expand)
- Affected user (if applicable — tappable → directory profile)
- Occurred at timestamp
- Resolved status

#### Actions
- "Mark Resolved" button on each unresolved log
- Tapping error message expands full error detail

#### Logic
- Critical errors (auth, database) trigger immediate Board notification via email
- Non-critical errors (file links, announcement sync) log silently and surface here
- Resolved logs remain in history — never deleted
- Unresolved count shown as a badge on the Board Panel sidebar item

---

## Badge Management (Board-Only, Accessed from Board Panel or Sidebar)

**Access:** Board Panel has a "Badges" link, or accessible from any member's directory profile.

### Badge List Page
- All badge types listed
- Two sections: Participation Badges / Achievement Badges
- Each badge shows: name, description, image (if set), created by, created at
- "New Badge" button — Board only

### Create Badge Sheet
- Badge category: Participation / Achievement (required)
- If Participation: link to a project (optional dropdown)
- Badge name (required)
- Description (optional)
- Image URL (optional — link to Drive-hosted image)
- Confirm

### Award Achievement Badge
- From any member's directory profile: "Award Badge" button (Board view only)
- Sheet shows: member name, list of Achievement badges
- Optional note
- Confirm → user_badges row created → member notified

### Logic
- Board creates all badge types
- Project Leads award Participation badges (Chunk 4)
- Board awards Achievement badges including VOTY
- VOTY displayed as subtitle under member name on directory profile
- CS HQ team lead will eventually take over badge management — no schema change, just role permission update

---

## Data Model Additions (Confirmed in This Chunk)

### volunteer_flags table — add resolved fields

| Field | Type | Description |
|---|---|---|
| resolved | BOOLEAN | False by default. Board marks resolved. |
| resolved_by | UUID · FK → users · nullable | Board member who resolved. |
| resolved_at | TIMESTAMP · nullable | When resolved. |

**Note:** volunteer_flags table was introduced in Chunk 4. These fields complete it.
