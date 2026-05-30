# Ethos App — Chunk 4: Project Lead View

## Overview

Project Leads see the same app as Members but with additional controls layered on top.
They do not get a separate app — they get the member view plus:
- A Project Lead dashboard accessible from their My Projects tab
- Additional controls on the project detail page (create, edit, manage)
- An application review inbox
- Task management controls
- Badge awarding

Chapter Heads use this same view scoped to their chapter.
HQ Project Leads use this same view scoped to their HQ project.

---

## Screen 4.1 — Project Lead Dashboard

**Purpose:** Overview of all the Lead's projects at once. Entry point for project management.
**Access:** Replaces the standard My Projects view for Project Leads.

### Header
- Title: "My Projects"
- "New Project" button — top right — opens Screen 4.2

### Project Cards (enhanced vs member view)
Each card shows:
- Project name + type tag
- Status badge: Draft / Published / Active / Closed
- Upcoming shift date/time
- Task completion progress (e.g. 4/7 complete)
- Team members count
- Pending applications count (e.g. "3 pending" in peach — tappable → opens application inbox)
- Budget: requested vs allocated (e.g. "$500 requested · $400 allocated")

### Card Actions
- Tapping card body → project detail page (Chunk 3 + Lead controls)
- Tapping "pending" badge → application inbox for that project (Screen 4.4)

### Logic
- Only shows the Lead's own projects
- Sorted by status first (Active → Published → Draft → Closed), then by upcoming shift date
- Closed projects shown at bottom, dimmed
- Empty state: "You haven't created any projects yet." with New Project CTA

---

## Screen 4.2 — Create Project (Step-by-Step Wizard)

**Purpose:** Multi-step form for creating a new project. Each step is a separate page. Draft saved automatically between steps.

### Step indicator
- Progress bar across top
- Step labels shown: Info · Shifts · Roles · Application · Settings · Review

---

### Step 1 — Project Info
- Project name (required)
- Project type: Event / Campaign / Program (required)
- Chapter (pre-filled to Lead's chapter, read-only — Board can change)
- HQ team category (only shown for HQ Project Leads): Media / Newsletter / Business / STEM / Funding / Finance / CS
- Description (required)
- Is virtual? (toggle)
- Location (required if not virtual)
- Requested budget (optional — DECIMAL input)

---

### Step 2 — Shifts
- "Add a shift" button
- Each shift form:
  - Start date + time
  - End date + time
  - Location (optional — defaults to project location)
  - Capacity (required)
  - Shift notes (optional)
- Multiple shifts can be added
- Shifts listed as removable cards
- At least one shift required before proceeding

---

### Step 3 — Roles
- "Add a role" button
- Each role form:
  - Role name (required, e.g. "Site Lead", "Photographer")
  - Description (optional)
  - Capacity — how many volunteers can hold this role (required)
- Multiple roles can be added
- Roles listed as removable cards
- At least one role required before proceeding

---

### Step 4 — Application Settings
- Is this an Open Call? (toggle)
  - If yes: Application level selector — Full App / Mid App / No App
  - Full App: all form steps shown to applicant
  - Mid App: Basics + Submit only (no About you or Availability)
  - No App: applicant just taps Join, no form
- Max volunteers allowed (required — INTEGER)
- Additional application questions (optional — Lead can add custom free-text questions that appear in Step 2 of the applicant's form)

---

### Step 5 — Settings
- Visibility: Draft (default) / Published
- If Published: project appears on the project board immediately
- Confirmation checkbox: "I have reviewed this project and it is ready for volunteers"
- Note: Project cannot be reopened once closed — shown as reminder on this step

---

### Step 6 — Review
- Read-only summary of all steps
- Edit link per section to jump back
- "Save as Draft" button — saves without publishing
- "Publish Project" button — sets is_published = true, creates Slack channel via Slack API, project appears on board

### Logic
- Draft saved automatically after each step
- Lead can exit mid-wizard and return — progress preserved
- Slack channel auto-created on publish using project name as channel name
- slack_channel_id stored on project record on channel creation
- Board notified when a new project is published (in-app + Slack)
- If requested_budget is filled: Board notified to review and set allocated_budget

---

## Screen 4.3 — Edit Project

**Purpose:** Edit an existing project after publishing.
**Access:** Edit button on project detail page (visible to Lead and Board only).

### What can be edited post-publish
- Description
- Location
- Shift details (add, edit, remove shifts — but not shifts that have already passed)
- Role names and descriptions (not capacity if volunteers are already assigned to that role)
- Max volunteers
- Requested budget
- Application settings (Open Call toggle, application level)

### What cannot be edited post-publish
- Project name
- Project type
- Chapter

### Logic
- Edits save immediately — no draft state for edits
- If a shift is removed that has approved volunteers: Lead is warned before confirming
- Changes to roles do not affect already-assigned volunteers

---

## Screen 4.4 — Application Inbox

**Purpose:** Review and act on pending applications for a specific project.
**Access:** From project detail page (Applications tab, Lead view) or from dashboard pending badge.

### Header
- Project name
- "X pending applications"
- Filter: All / Pending / Approved / Rejected / Withdrawn

### Application Cards
Each card shows:
- Applicant name
- Submitted at date
- Status badge
- Tapping opens the full application review sheet

### Application Review Sheet
Full bottom sheet showing:
- Applicant name
- All application answers (why join, experience, availability notes, any custom questions)
- Submitted at timestamp

### Actions
- **Approve** — opens role assignment dropdown (select which project role to assign) → confirms → application status = Approved → volunteer notified
- **Reject** — opens optional text field for rejection reason → confirms → application status = Rejected → volunteer notified

### Logic
- Approving requires a role to be assigned — Lead cannot approve without selecting a role
- Rejection reason is optional but encouraged
- Approved applicants are automatically added to the project's Slack channel
- Rejected applicants are automatically notified via Slack DM + email + in-app
- Board can also approve/reject from this same view — their actions supersede Lead if they act first
- Applications reviewed in order of submission by default
- Withdrawn applications visible but no actions available

---

## Screen 4.5 — Project Detail (Lead Controls)

**Purpose:** Same four-tab project detail page as Chunk 3 but with Lead-specific controls layered on.

### Overview tab — additional Lead controls
- Edit Project button (top right)
- Budget section shows both requested and allocated amounts
- Team roster shows Approve/Reject quick actions if applicants are pending (link to inbox)
- Flag a volunteer button on each team member row:
  - Tapping opens a sheet: "Flag [Name] for not attending [Shift]"
  - Adds a flag record — visible to Lead and Board
  - Volunteer is notified via in-app + email + Slack

### Tasks tab — additional Lead controls
- "New Task" button
- New task form:
  - Title (required)
  - Description (optional)
  - Assign to: dropdown of approved project members
  - Status: defaults to Not Started
  - Due date (optional)
- Lead can drag any task card between kanban columns (not just their own)
- Lead can tap any task and edit title, description, assignee, status, due date
- Lead can delete any task (confirmation required)
- Awaiting Input: Lead can move tasks out of Awaiting Input — this is the unblocking action

### Files tab — additional Lead controls
- "Add File" button
- Add file sheet:
  - Paste Google Drive URL
  - File name (auto-populated from Drive if possible, editable)
  - File type (auto-detected, editable)
  - Description (optional)
  - Category: pre-set to Project (cannot change to Universal — Board only)
- Lead can remove any file they added (confirmation required)

### Updates tab — same as member view
- Lead sees the same one-way Slack feed
- "Open in Slack" button navigates to the project's Slack channel

---

## Screen 4.6 — Award Badge

**Purpose:** Award a participation badge to a volunteer on the Lead's project.
**Access:** From the team roster on the project Overview tab — "Award Badge" option on each member row.

### Flow
- Tapping "Award Badge" on a member opens a sheet
- Sheet shows:
  - Member name
  - List of participation badges associated with this project (created by Board)
  - Optional note field
- Lead selects a badge and confirms
- user_badges row created
- Volunteer notified via in-app + email + Slack

### Logic
- Lead can only award participation badges (badge_category = Participation)
- Lead can only award badges to volunteers on their own project
- Lead cannot create new badge types — Board only
- If no participation badges exist for this project yet: "No badges have been created for this project. Contact the Board to set one up."

---

## Data Model Additions (Confirmed in This Chunk)

### New table: volunteer_flags

| Field | Type | Description |
|---|---|---|
| flag_id | UUID · PK | Unique flag record. |
| user_id | UUID · FK → users | The volunteer being flagged. |
| project_id | UUID · FK → projects | The project context. |
| shift_id | UUID · FK → shifts · nullable | The specific shift missed, if applicable. |
| flagged_by | UUID · FK → users | The Project Lead who flagged. |
| reason | TEXT · nullable | Optional context. |
| created_at | TIMESTAMP | When flagged. |

**Note:** Flags are visible to the flagging Lead and Board only. Volunteer is notified on flag creation.
