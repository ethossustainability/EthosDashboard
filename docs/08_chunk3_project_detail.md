# Ethos App — Chunk 3: Project Detail

## Overview

The project detail page is accessible by tapping any project card from My Projects (Chunk 2),
the home page project card, or from a member's directory profile project history.
It has four tabs: Overview (default), Tasks, Files, Updates.

Project Leads see additional controls on this page (covered in Chunk 4).
Members see a read-oriented view of the same page.

---

## Project Detail Page — Tab Structure

### Navigation
- Four tabs across the top: **Overview** · **Tasks** · **Files** · **Updates**
- Default tab on open: Overview
- Tab persists per session — returning to a project reopens on the last tab viewed
- Project name displayed as page title above tabs
- Chapter/HQ tag displayed beneath project name
- Back button returns to previous page (My Projects, Home, or Directory depending on origin)

---

## Tab 3.1 — Overview

**Purpose:** Project info, shifts, team roster, and budget visibility.

### Project Info Block
- Project name
- Type tag (Event / Campaign / Program, color coded)
- Chapter or HQ label
- Description (full text)
- Virtual / In-person indicator
- Location (if in-person)
- Allocated budget (visible to all members — Ethos is transparent)

### Shifts Block
- Title: "Shifts"
- Each shift listed as a card:
  - Date and time (start → end)
  - Location (if different from project location)
  - Capacity (e.g. "12 / 15 volunteers")
  - Any shift-specific notes
- Shifts sorted chronologically
- Past shifts shown dimmed at bottom

### Team Roster Block
- Title: "Team"
- Total member count
- Each member shown as a row:
  - Name (tappable → opens their directory profile)
  - Project role (e.g. Site Lead, Photographer)
  - Role badge color coded per role type
- Project Lead shown at top of roster with a distinct "Project Lead" label
- Members sorted: Project Lead first, then alphabetically by first name

### Logic
- All approved members on this project can see the full team roster and roles
- Allocated budget shown as read-only — members cannot request or edit
- If no shifts are scheduled yet: "No shifts scheduled yet" placeholder
- If project is virtual: location fields hidden

---

## Tab 3.2 — Tasks

**Purpose:** All tasks for this specific project. Same task data as My Work but scoped to one project.

### View Toggle
- List / Kanban toggle (top right)
- Default: List view

### Group / Order Controls (List view)
- Group by: By Status (default on project page) / By Due Date / Ungrouped
- Order by: Due Date / Recently Updated / Alphabetical

### List View
- Tasks grouped per selected grouping
- Each task row:
  - Checkbox (member can check own assigned tasks)
  - Task title
  - Assigned to: member name + avatar initials
  - Status badge: Not Started / In Progress / Awaiting Input / Complete
  - Due date (red if overdue)
- Tapping opens task detail sheet (see below)
- Completed tasks dimmed at bottom of group

### Kanban View
- Four columns: Not Started / In Progress / Awaiting Input / Complete
- Each card: task title, assignee initials, due date
- Members can drag their own assigned tasks between columns
- Cannot drag tasks assigned to others
- Awaiting Input column visually distinct — peach background

### Task Detail Sheet
Tapping any task opens a bottom sheet with:
- Task title
- Full description
- Assigned to (name)
- Status (member can update own tasks via dropdown)
- Due date
- Created by
- Created at / Updated at timestamps
- Awaiting Input note: "This task needs input from your Project Lead before you can continue" (shown when status = Awaiting Input)

### Logic
- Members see all tasks on the project — not just their own
- Members can only update status of tasks assigned to them
- Awaiting Input tasks cannot be moved by the member — only Project Lead or Board can unblock
- Task count shown in tab label: "Tasks (7)"

---

## Tab 3.3 — Files

**Purpose:** All files attached to this specific project. Subset of the full Files tab (Chunk 2).

### Layout
- Search bar (searches file name and description within this project only)
- File list below

### File Cards
Each card shows:
- File name
- File type badge
- Added by: [member name]
- Date added
- Tapping opens file directly in Google Drive

### Logic
- Shows only files where project_id = this project (category = Project)
- Universal files do not appear here — those are in the full Files tab only
- Sorted by most recently added by default
- Project Leads can add files from this tab (Add File button visible to Leads only)

---

## Tab 3.4 — Updates

**Purpose:** Project-specific communication feed synced one-way from the project's Slack channel.

### Layout
- Feed of messages from the project's Slack channel
- Chronological, newest at bottom (chat-style)
- Each message shows:
  - Poster's Slack display name
  - Message content
  - Posted at timestamp
- "Open in Slack" button pinned at bottom — taps into the Slack channel directly

### Logic
- Messages synced one-way from Slack via webhook → project_updates table
- App never writes to Slack
- slack_channel_id stored on the project record links this feed to the right channel
- Slack channel auto-created when project is published (via Slack API)
- Members added to the Slack channel on application approval
- Members removed from the Slack channel if their application is withdrawn or they leave the project
- If no updates yet: "No updates yet. Head to Slack to start the conversation." with Open in Slack button
- slack_message_id used for deduplication — no duplicate messages if webhook fires multiple times

---

## Data Model Additions (Confirmed in This Chunk)

### projects table — new field
- `slack_channel_id` · VARCHAR(100) · nullable — Slack channel ID for this project's updates feed

### New table: project_updates

| Field | Type | Description |
|---|---|---|
| update_id | UUID · PK | Unique update record. |
| project_id | UUID · FK → projects | The project this update belongs to. |
| slack_message_id | VARCHAR(100) | Slack message ID. Used for deduplication. |
| posted_by_slack_user | VARCHAR(100) | Slack display name of poster. |
| content | TEXT | Message content. |
| posted_at | TIMESTAMP | When posted in Slack. |
| synced_at | TIMESTAMP | When pulled into app. |

### New table: policy_acknowledgments (confirmed in Chunk 2, defined here for completeness)

| Field | Type | Description |
|---|---|---|
| acknowledgment_id | UUID · PK | Unique acknowledgment record. |
| user_id | UUID · FK → users | The member who acknowledged. |
| file_id | UUID · FK → files | The policy document acknowledged. |
| acknowledged_at | TIMESTAMP | When acknowledged. |

**Note:** If a policy document is updated (new file added by Board), acknowledgments reset — all members must re-acknowledge the new version.
