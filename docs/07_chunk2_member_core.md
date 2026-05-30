# Ethos App — Chunk 2: Member Core

## Overview

5 sections covering the main navigation destinations for an approved member.
All accessible from the full sidebar unlocked after Screen 1.5 (Approval).

Sections in this chunk:
- 2.1 My Work
- 2.2 My Projects
- 2.3 My Files
- 2.4 Training
- 2.5 Directory

---

## Screen 2.1 — My Work

**Purpose:** All tasks assigned to the member across all their active projects in one view.
**Sidebar:** My Work active.

### Header
- Title: "My Work"
- Subtitle: total count of incomplete tasks (e.g. "7 tasks remaining")

### View Toggle
- Top right: List / Kanban toggle
- Default: List view

### Group / Order Controls (List view only)
- **Group by:** By Project (default) / By Status / By Due Date
- **Order by:** Due Date (default) / Recently Updated / Alphabetical
- Controls displayed as two small dropdowns beneath the header

### List View
- Tasks grouped per selected grouping
- Each task row shows:
  - Checkbox (tapping marks Complete)
  - Task title
  - Project name (color-coded tag)
  - Status badge: Not Started / In Progress / Awaiting Input / Complete
  - Due date (shown in red if overdue)
- Tapping a task row opens task detail sheet (see Chunk 3)
- Completed tasks shown at bottom of each group, dimmed

### Kanban View
- Four columns: Not Started / In Progress / Awaiting Input / Complete
- Each card shows: task title, project tag, due date
- Cards are draggable between columns (updates status in real time via Supabase)
- Dragging to Complete marks the task done
- Dragging out of Complete reopens it

### Logic
- Only shows tasks assigned to the current user
- Tasks from all active projects appear here
- Awaiting Input tasks are visually flagged — member cannot move them until a Project Lead or Board updates them
- If a task has no due date it appears at the bottom of its group

---

## Screen 2.2 — My Projects

**Purpose:** All projects the member is currently approved for.
**Sidebar:** My Projects active.

### Header
- Title: "My Projects"
- Count: active project count (e.g. "2 active projects")

### Project Cards
Each card shows:
- Project name
- Type tag (color coded: Event / Campaign / Program, HQ tag if HQ project)
- Upcoming shift date and time
- Task completion progress bar (e.g. "4 of 7 tasks complete")
- Team members count (e.g. "12 members")
- Chapter name (or "HQ" if HQ project)

### Logic
- Only shows approved projects (status = Approved on application)
- Cards sorted by upcoming shift date ascending (soonest first)
- If no upcoming shift, card shows "No upcoming shifts scheduled"
- Tapping a card opens the project detail page (Chunk 3)
- If member has no active projects: empty state with "You're not on any projects yet. Browse the project board." with a link

### HQ Project indicator
- HQ projects show a distinct "HQ" tag instead of chapter name
- Visually differentiated from chapter projects

---

## Screen 2.3 — My Files

**Purpose:** Org-wide file library. All approved members see all files.
**Sidebar:** My Files active.

### Header
- Title: "Files"
- Search bar below header — searches across file names and descriptions

### Filter Bar
- Filter chips: All (default) / Project Files / Universal
- When "Project Files" selected: secondary filter appears to filter by project name

### File Cards
Each card shows:
- File name
- File type badge (PDF, Google Doc, Sheet, Image, etc.)
- Category tag: project name or "Ethos-wide" for Universal files
- Added by: [member name]
- Date added

### Logic
- All approved members see all files — no per-member filtering
- Tapping a card opens the file directly in Google Drive
- Files sorted by most recently added by default
- Search runs against file_name and description fields in database (PostgreSQL full-text search)
- Universal files appear in all members' views regardless of chapter or project
- Project files appear in both the Files tab and on their respective project page (Chunk 3)

---

## Screen 2.4 — Training

**Purpose:** Orientation videos (always rewatchable) and Ethos policy documents with acknowledgment tracking.
**Sidebar:** Training active.

### Header
- Title: "Training"

### Section 1 — Orientation Videos
- Same chapter structure as Screen 1.3a
- Chapters: Welcome to Ethos / Project safety / How we work / FAQs
- Completion indicators per chapter (green checkmark if watched during onboarding)
- Rewatchable at any time — completion status does not reset
- In-app embedded player, no redirect

### Section 2 — Policy Documents
- List of all Ethos policy documents added by Board (Drive files, category = Universal)
- Each document row shows:
  - Document name
  - Date added / last updated
  - Acknowledgment status: "Reviewed ✓" (green) or "Review required" (peach)
- Tapping a document opens it in Google Drive
- After opening, a prompt appears on return: "Mark as reviewed?" with a confirm button
- Confirming creates a row in policy_acknowledgments table
- Once all policy documents are acknowledged: section shows "All documents reviewed ✓"
- If a policy document is updated (new version added by Board): acknowledgment resets for all members — they must re-acknowledge

### Logic
- Board adds policy documents as Universal files in the files table
- Training tab filters for Universal files flagged as policy documents
- policy_acknowledgments tracks per-user per-document status
- No hard gate — members are not blocked from using the app if they haven't acknowledged
- But unacknowledged documents show a persistent "Review required" indicator

### Data model addition
New table: `policy_acknowledgments`
- acknowledgment_id · UUID · PK
- user_id · UUID · FK → users
- file_id · UUID · FK → files
- acknowledged_at · TIMESTAMP

---

## Screen 2.5 — Directory

**Purpose:** Browse and search all members in the user's chapter. Board sees all members org-wide.
**Sidebar:** Accessible from sidebar or by tapping a member's name anywhere in the app.

### Header
- Title: "Directory"
- Search bar — searches by first name, last name

### Filter Bar
- Filter by role: All (default) / Member / Project Lead / Board
- Board members see additional filter: Filter by chapter

### Member List
Each member row shows:
- Full name
- Role badge (Member / Project Lead / Board)
- Chapter name
- Badge count (e.g. "3 badges")

### Scoping Rules
- Members see only their own chapter's members
- Board sees all members across all chapters and HQ
- Search is scoped to visible members only

### Member Profile Page
Tapping a member opens their full directory profile:
- Full name
- Role + chapter
- Bio (self-written, nullable — shows nothing if empty)
- Project history (derived from applications where status = Approved)
  - Each entry: project name, chapter/HQ, date range
- Badges — two sections:
  - Participation badges (project-tied)
  - Achievement badges (org-wide, VOTY displayed as subtitle under name if held)
- Profiles are always visible — no hiding option

### Logic
- Directory uses PostgreSQL full-text search on first_name + last_name
- Results scoped by chapter_id for non-Board members
- Tapping a project in someone's project history navigates to that project page (if member has access)
- VOTY badge displayed as subtitle directly under the member's name: e.g. "Volunteer of the Year '26"
