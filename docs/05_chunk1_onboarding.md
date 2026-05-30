# Ethos App — Chunk 1: Onboarding Flow

## Overview

8 screens covering every state from first login to approved member home page.
All screens use the Ethos color palette: Cream (#FFFBF4), Sand (#D4CCC4), Warm Gray (#A89E94), Brown Mid (#7D6F63), Brown Dark (#514033), Peach Light (#FFE2D6), Peach (#FCBD9D), Espresso (#413429).

---

## Screen 1.0 — Login

**Purpose:** Entry point for all users. No account creation required.
**Sidebar:** None.

### Left panel
- Ethos logo mark + wordmark (ethos / SUSTAINABILITY)
- Tagline: "Connecting volunteers to meaningful local projects"
- Background: Espresso (#413429)

### Right panel
- Primary CTA: Continue with Google (Google SSO OAuth)
- Divider: "or"
- Email input field (pre-fills on return visits)
- Secondary CTA: Sign in with email
- Footer note: "New to Ethos? Just sign in — you'll be guided from there."

### Logic
- First-time Google login auto-creates account with UUID user_id
- Returning users routed based on current state (pending, approved, etc.)
- No separate sign-up flow — onboarding handles everything post-login

---

## Screen 1.1 — Project Board (Pre-Approval)

**Purpose:** The only page accessible after login before approval.
**Sidebar:** Ethos logo (home link) + profile avatar (bottom left) only. No nav items.

### Header
- Title: "Find a project"
- Subtitle: location inferred from Google account or browser (e.g. "Projects near Denton, TX")

### Search & Filters
- Search bar, placeholder: "Search…"
- Filter chips: All (default active), Events, Campaigns, Programs
- Active chip: peach fill. Single-select.

### Project Cards
- Type tag — color coded: Environment (green), Outreach (peach), Education (blue)
- Distance from user's detected location
- Project name
- Date, time, spots remaining
- Apply button → Screen 1.2

### Logic
- Projects filtered by is_published = true and user's chapter/location scope
- Members see: own chapter's projects + open calls from nearby chapters + HQ open calls
- User cannot navigate away from this page until approved
- Applying to one project does not hide others — user can browse freely
- Max 3 pending applications — Apply button disabled on 4th attempt

---

## Screen 1.2 — Project Application

**Purpose:** 4-step form triggered when user taps Apply on a project card.
**Sidebar:** Logo + profile avatar only. No nav items.

### Progress Indicator
- Linear progress bar (peach fill on sand track)
- Step labels: Basics · About you · Availability · Submit
- Active step bolded, completed steps dimmed with checkmark

### Step 1 — Basics
- First name, last name (pre-filled from Google if available)
- Email (pre-filled from Google, read-only)
- Phone number
- Guardian / parent name
- Guardian / parent email
- Guardian / parent phone

### Step 2 — About you
- "Why do you want to join this project?" (required)
- "Relevant experience?" (optional)

### Step 3 — Availability
- Shift selector showing all shifts PM configured for the project
- In-person vs. remote toggle (if project allows both)
- Multi-shift selection not offered — approved volunteers attend all shifts

### Step 4 — Submit
- Read-only summary of all answers
- Edit link per section
- Submit button → creates application record → triggers Screen 1.3

### Logic
- Progress saved automatically — user can close and return
- Submitting locks the form (no edits post-submission)
- One active application per project per user
- Guardian fields stored on users table at submission

---

## Screen 1.3 — Pending / Onboarding Checklist

**Purpose:** Post-submission holding state. Only page accessible until approved or rejected.
**Sidebar:** Logo + profile avatar only. No nav items.

### Hero Area
- Clock icon in peach circle
- Heading: "You're in the queue"
- Subtext: "Your application is with the project team. Complete the steps below while you wait."

### Onboarding Checklist (in this exact order)
1. Application submitted — always Done on arrival ✓
2. Connect Slack account — OAuth flow, invite to workspace if not yet a member
3. Orientation videos — unlocks after Slack connected → links to Screen 1.3a
4. Liability waiver — volunteer signs via OpenSign embedded in-app
5. Parental consent — sent to guardian email via OpenSign, awaits parent signature
6. Project lead review — always last, locked until all above complete

### Step Status Indicators
- Done: green circle with checkmark
- In progress / action needed: peach circle
- Waiting / locked: sand circle

### Parental Consent Nudge
- Step 5 shows: "Haven't heard from your parent? Send a reminder"
- Tapping sends follow-up email via Resend to guardian email on file
- Reminder can be sent once per 24 hours

### Logic
- Steps unlock sequentially as listed above
- Project Lead (and Board) notified via Slack + email when all pre-review steps complete
- User notified via Slack + email + in-app on approval → Screen 1.5 or rejection → Screen 1.4
- On reapplication after rejection: completed steps preserved — user picks up from first incomplete step

---

## Screen 1.3a — Orientation Videos (Sub-screen)

**Purpose:** Required orientation within the pending state. Accessible after Slack connected.
**Sidebar:** Same as 1.3 — no nav unlocked.

### Video Chapters (all required, in order)
1. Welcome to Ethos
2. Project safety
3. How we work
4. FAQs

### Player Features
- In-app embedded video player (no redirect)
- Chapter navigation with progress indicators
- Per-chapter completion tracked in orientation_progress (JSON field on onboarding table)
- All chapters must be completed before orientation_completed_at is set

### Logic
- Completion triggers waiver step to unlock
- Videos remain accessible post-approval from Training section in sidebar
- User can rewatch at any time after approval

---

## Screen 1.4 — Rejection State

**Purpose:** Shown when Project Lead or Board declines the application.
**Sidebar:** Logo + profile avatar only.

### Content
- Heading: "Not quite a fit this time" (warm, non-punitive)
- Rejection reason shown only if reviewer provided one — omitted if not
- Copy: "There are other projects that might be a great match."

### CTAs
- Primary: "Browse other projects" → Screen 1.1
- No secondary action — no dead end

### Logic
- Application archived (status = Rejected), not deleted
- User can apply to a different project immediately
- Cannot re-apply to the same project within the same cycle
- Frees up one slot toward the 3-pending max
- Completed onboarding steps (Slack, orientation, waiver) preserved

---

## Screen 1.5 — Approval / Welcome

**Purpose:** Triggered when Project Lead or Board approves the application.
**Sidebar:** Full sidebar unlocks here for the first time.

### Content
- "Welcome to Ethos, [First name]"
- Brief summary of what's now unlocked: home, project, tasks, files, training
- Project name and date shown as confirmation
- Tone: celebratory but understated — fits earthy brand

### CTA
- Single button: "Go to your home page" → Screen 1.6

### Logic
- Full sidebar nav unlocks on this screen
- User's project pinned to My Projects
- Project Lead notified that the user has been welcomed in
- notification_preferences record created with all defaults = true (email + Slack both enabled)

---

## Screen 1.6 — Home (First Login, Post-Approval)

**Purpose:** Member's home page. First view of the full app.
**Sidebar:** Full nav — Home (active), My Work, My Projects, My Files, Training, Fundraising, Recents. Notification bell. Profile avatar bottom-left.

### Greeting
- "Welcome, [First name]"
- "Ethos [Chapter] · Member since [Month Year]"

### Org-wide Metrics — 2×2 grid
- Active projects (org total)
- Total members
- Events this month
- Funds raised
- All members see these metrics. All are exportable.

### My Project Card
- Project name, date, time, location
- Type tag (color coded)
- Tapping opens project detail page (Chunk 3)

### My Tasks
- First tasks assigned by PM for this project
- Checkbox state — done / not done
- Status: Not Started, In Progress, Awaiting Input, Complete
- Tapping opens task detail (Chunk 3)

### Full Sidebar Nav
- **Home** — this screen
- **My Work** — all tasks across all user's projects (Chunk 2)
- **My Projects** — project cards for all approved projects (Chunk 2)
- **My Files** — org-wide file library, Google Drive connected (Chunk 2)
- **Training** — orientation videos + FAQs, always accessible (Chunk 2)
- **Fundraising** — org donations, contacts, partners (Chunk 6)
- **Recents** — last 10 project and file pages visited
- **Notification bell** — unread count badge, opens notification inbox
- **Profile avatar (bottom left)** — account settings, notification preferences, sign out
