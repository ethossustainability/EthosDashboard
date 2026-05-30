# Ethos App — Chunk 6: Org-Wide Pages

## Overview

Four org-wide pages accessible from the sidebar to all approved members:
- 6.1 Fundraising
- 6.2 Announcements
- 6.3 Open Call Board
- 6.4 Home (expanded detail)

---

## Screen 6.1 — Fundraising

**Purpose:** Org-wide financial transparency. All members see donations, contacts, and a fundraising goal.
**Sidebar:** Fundraising active.
**Permissions:** All members read. Board writes (add/edit/delete). Fundraising HQ team lead eventually.

### Header
- Title: "Fundraising"
- Subtitle: "Ethos Sustainability · [Current Year]"

### Section 1 — Fundraising Goal
- Progress bar showing total funds raised vs org goal for the current year
- Label: "$X raised of $Y goal"
- Percentage shown beside bar
- Goal amount set by Board (stored as a config value — not in current data model, needs a simple `org_settings` table — see data model additions below)

### Section 2 — Donation History
- Title: "Donations"
- Total raised shown as a summary number
- List of donation records sorted by donated_at descending
- Each row shows:
  - Donor name (from fundraising_contacts if linked, else "Anonymous")
  - Amount
  - Date
- Board sees additional controls: Edit / Delete on each row + "Add Donation" button

### Section 3 — Contacts & Partners
- Title: "Contacts & Partners"
- Search bar — search by name
- Filter chips: All / Donor / Partner / Sponsor / Other
- Each contact card shows:
  - Name
  - Type tag
  - Email (if set)
  - Phone (if set)
  - Notes (truncated — tap to expand)
- Board sees: Edit / Delete on each card + "Add Contact" button

### Logic
- All approved members see everything — Ethos operates transparently
- Donation history linked to contacts via contact_id — tapping a donor name in donations navigates to their contact card
- Anonymous donations show "Anonymous" and are not linkable
- Board manages all data for now — Fundraising HQ team lead takes over eventually (permission update only)

### Data model addition — org_settings table
Simple key-value config table for org-wide settings.

| Field | Type | Description |
|---|---|---|
| setting_id | UUID · PK | Unique setting. |
| key | VARCHAR(100) · unique | Setting name e.g. "fundraising_goal_2025" |
| value | TEXT | Setting value e.g. "10000" |
| updated_by | UUID · FK → users | Board member who last updated. |
| updated_at | TIMESTAMP | When last updated. |

---

## Screen 6.2 — Announcements

**Purpose:** Org-wide announcement feed synced from Slack #announcements channel.
**Sidebar:** Accessible from Home (announcement section) or as a dedicated page.
**Access:** All approved members.

### Layout
- Title: "Announcements"
- Feed of announcements in reverse chronological order (newest first)
- Each announcement card shows:
  - Posted by (Slack display name)
  - Content (full text)
  - Posted at (date + time)
  - "Last synced X minutes ago" indicator at top of feed

### Logic
- One-way sync from Slack #announcements
- slack_message_id prevents duplicates
- Only Board and Project Leads can post in #announcements (Slack channel permissions)
- No in-app reply or reaction — read only
- Unread announcements trigger in-app + email + Slack notification per user preferences
- Home screen shows the 3 most recent announcements — "See all" links to this page

---

## Screen 6.3 — Open Call Board

**Purpose:** Browse and apply to additional projects beyond the member's current active projects.
**Sidebar:** Separate page — "Open Calls" item in sidebar below My Projects.
**Access:** All approved members (subject to chapter/location scoping and active project limits).

### Header
- Title: "Open Calls"
- Subtitle: "Projects looking for volunteers"
- Member's current active project count shown: "You have X of 3 active projects"

### Search & Filters
- Search bar — search by project name
- Filter chips: All / Chapter Projects / Nearby Chapters / HQ
- Secondary filter: All Types / Event / Campaign / Program
- HQ filter shows remote-eligible projects from HQ teams

### Project Cards
Each card shows:
- Project name
- Type tag (color coded)
- Chapter name or "HQ" tag
- Distance (for in-person) or "Remote" label
- Open Call application level badge: Full App / Mid App / No App
- Spots remaining
- Upcoming shift date (if applicable)
- Apply button

### Application Level Behavior
- **Full App** — full 4-step application form (same as Screen 1.2)
- **Mid App** — Basics + Submit only (no About you or Availability steps)
- **No App** — single tap "Join" button, no form — application auto-submitted and pending PM review

### Logic
- Members see:
  - Their own chapter's Open Call projects
  - Open Call projects from nearby chapters (location-based)
  - HQ Open Call projects (remote or nearby)
- Members already on 3 active projects: Apply button replaced with "Project limit reached" — disabled
- Members already on an HQ project: Apply button replaced with "HQ project limit reached" — disabled
- Member cannot apply to a project they are already on
- Member cannot apply to a project they were rejected from in the same cycle
- Applying follows the same flow as Screen 1.2 (or shortened based on app level)
- After applying: member stays on Open Call board — can browse other projects
- Pending applications visible in a "My Applications" section below the project list

### My Applications Section
- Listed below the project cards
- Each row: project name, applied at date, status badge (Pending / Approved / Rejected / Withdrawn)
- Withdrawn button available on Pending applications
- Tapping an Approved application → navigates to the project detail page

---

## Screen 6.4 — Home (Expanded Detail)

**Purpose:** Expanded view of the home screen metrics for members who want more detail.
**Access:** Tapping any metric on the home screen opens this expanded view.

### Org Metrics — Expanded
- Total active projects (with list of project names, tappable)
- Total members (with count per chapter)
- Events this month (list of event projects this month, tappable)
- Total funds raised (links to Fundraising tab)

### Export
- "Export" button at top right
- Exports all four metrics as a CSV
- Available to all members — confirmed

### Logic
- Data is read-only for all members
- Export generates a CSV of the currently visible metrics
- Board sees per-chapter breakdown on this page (same as Panel 5.1 but read-focused)

---

## Data Model Additions (Confirmed in This Chunk)

### New table: org_settings

| Field | Type | Description |
|---|---|---|
| setting_id | UUID · PK | Unique setting record. |
| key | VARCHAR(100) · unique | Setting identifier e.g. "fundraising_goal_2025" |
| value | TEXT | Setting value. |
| updated_by | UUID · FK → users | Board member who last set this. |
| updated_at | TIMESTAMP | When last updated. |

**Initial keys:**
- `fundraising_goal_[year]` — annual fundraising target in USD
- Additional config values can be added here without schema changes

---

## Sidebar Navigation — Final Complete List

For reference, the full sidebar for an approved member:

| Item | Visible to | Notes |
|---|---|---|
| Ethos logo (Home) | All | Taps to home screen |
| My Work | All | Tasks across all projects |
| My Projects | All | Project Lead sees enhanced dashboard |
| Open Calls | All | Browse and apply to new projects |
| My Files | All | Org-wide file library |
| Training | All | Orientation + policy documents |
| Fundraising | All | Donations, contacts, goal |
| Recents | All | Last 10 visited pages |
| Board Panel | Board only | Org overview, roles, budget, flags, logs |
| Notification bell | All | Unread count badge |
| Profile avatar (bottom left) | All | Account settings (deferred), sign out |
