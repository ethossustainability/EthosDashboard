# Ethos App — Notifications & Edge Cases

## Notification System

### Channels
- **In-app** — always on for every user, every event. Cannot be disabled. Shows in notification inbox (bell icon in sidebar).
- **Email** — on by default. Toggleable per event type. Cannot be disabled if Slack is also off.
- **Slack DM** — on by default. Toggleable per event type. Cannot be disabled if email is also off. Falls back to email only if slack_user_id is null.

### Every notification triggers all three channels simultaneously (subject to preferences).

### Notification Events

| Event | Who receives it | Notes |
|---|---|---|
| Application received | Volunteer (confirmation) + Project Lead | Volunteer gets confirmation. Lead gets alert to review. |
| Application approved | Volunteer | Triggers Screen 1.5 |
| Application rejected | Volunteer | Triggers Screen 1.4 |
| Onboarding step completed | Volunteer | Each step completion |
| All pre-review steps done | Project Lead + Board | Signals application is ready to review |
| Task assigned | Volunteer assigned | |
| Task status updated | Task creator (Project Lead) | When volunteer changes status |
| Badge awarded | Volunteer | |
| Role changed | Member whose role changed | |
| Announcement posted | All members | From Slack #announcements sync |
| Parental consent reminder | Guardian email | Max once per 24 hours, triggered manually by volunteer |

### In-App Notification Inbox
- Bell icon in sidebar with unread count badge
- Opens a notification panel listing all notifications
- Unread highlighted
- Tapping marks as read and navigates to relevant page
- is_read flips to true, read_at timestamp set

---

## Edge Cases

### Onboarding

**Reapplication after rejection:**
- Completed steps (Slack, orientation, waiver) are preserved
- User picks up from first incomplete step
- Parental consent: if already signed, stays signed
- PM review step resets for the new application

**Parental consent stalls:**
- Volunteer can send reminder once per 24 hours
- No automatic expiry on the application while waiting
- PM is not notified until all steps including parental consent are complete

**Slack OAuth fails during onboarding:**
- User can skip and reconnect later
- slack_connected = false, slack_user_id remains null
- Reminder sent via email to complete Slack connection
- Cannot fully complete onboarding without Slack — but no dead end shown

**OpenSign down:**
- Waiver and consent steps show "Document signing temporarily unavailable"
- User is not blocked permanently
- App retries automatically when OpenSign recovers
- No step marked failed — just paused

**Volunteer applies to a project that fills up while application is pending:**
- Application remains in review
- Project Lead makes the call — capacity is a soft limit, Lead decides whether to admit or reject

### Applications

**Withdrawal:**
- Only allowed while status = Pending
- Once Approved, volunteer must contact Project Lead directly
- Withdrawn applications archived, not deleted
- Frees up one pending slot

**Re-application to same project:**
- Not allowed within the same project cycle
- Rejected application is archived — PM can see history

**3-limit enforcement:**
- 3 pending applications max — Apply button disabled on 4th attempt
- 3 active projects max — enforced on approval, not application
- HQ project = counts as the only active project

### Authentication

**Cold start (Supabase free tier):**
- Database may pause during inactivity
- First request after inactivity may take a few seconds
- Upgrade to Supabase Pro ($25/month) eliminates this

**Ethos email handoff:**
- Board creates Google Workspace account manually
- Board links new Ethos email to existing user_id in app
- user_auth gains a new row with is_active = true
- All history (projects, tasks, badges) transfers automatically — tied to user_id not email

**Token expiry:**
- JWT tokens expire ~1 hour
- Supabase auto-refreshes for active sessions
- Stolen tokens expire on their own

### Files

**Project deleted:**
- Files associated with that project remain in Google Drive
- File references (file table rows) are deleted
- Recents rows pointing to those files auto-delete (ON DELETE CASCADE)

**Drive unreachable:**
- File metadata (names, descriptions) still shows in app
- Download links show "temporarily unavailable"
- No full tab failure — graceful degradation

### Notifications

**Email fails:**
- Retry up to 3 times with exponential backoff
- After 3 failures, Board alerted via system_logs
- Action still completes in app — email failure never blocks a workflow

**Slack DM fails:**
- Logged to system_logs
- Email sent as fallback if user has email enabled
- In-app notification always delivered regardless

**Both Slack and email disabled for an event type:**
- Not allowed — constraint enforced at app logic level
- In-app remains as baseline regardless

### Recents

**Visited page deleted:**
- ON DELETE CASCADE removes the recents row automatically

**Over 20 rows:**
- Oldest row deleted on each upsert beyond 20 per user

### Integration Failures (Summary)

| Integration | User sees | Board sees |
|---|---|---|
| Supabase down | Branded maintenance screen | System alert |
| Google SSO down | Email fallback shown | System log |
| OpenSign down | Step paused, "temporarily unavailable" | System log |
| Slack OAuth down | Skip option shown, reminder sent | System log |
| Slack webhook down | Last synced announcements, "last updated X ago" | System log |
| Resend down | Action completes in app, retry attempted | System log after 3 failures |
| Drive unreachable | File links show unavailable | System log |

---

## Recents Implementation Detail

- Fires on dwell: 3–5 seconds on page, not on navigation click
- UPSERT: if user visited page before, updates visited_at. If new, inserts row.
- Database limit: 20 rows per user. Oldest deleted on each upsert beyond 20.
- UI displays: 10 most recent by visited_at descending
- Covers: project pages and file pages only
- ON DELETE CASCADE on reference_id field
