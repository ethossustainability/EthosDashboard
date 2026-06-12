# Ethos App — Planning Documents Index

## Status

| File | Title | Status |
|---|---|---|
| 01_product_overview.md | Product Overview | ✅ Complete |
| 02_roles_and_permissions.md | Roles & Permissions | ✅ Complete |
| 03_data_model.md | Data Model v2.2 | ✅ Complete |
| 04_infrastructure.md | Infrastructure & Stack | ✅ Complete |
| 05_chunk1_onboarding.md | Chunk 1 — Onboarding Flow | ✅ Complete |
| 06_notifications_and_edge_cases.md | Notifications & Edge Cases | ✅ Complete |
| 07_chunk2_member_core.md | Chunk 2 — Member Core | ✅ Complete |
| 08_chunk3_project_detail.md | Chunk 3 — Project Detail | ✅ Complete |
| 09_chunk4_project_lead_view.md | Chunk 4 — Project Lead View | ✅ Complete |
| 10_chunk5_board_view.md | Chunk 5 — Board View | ✅ Complete |
| 11_chunk6_org_wide_pages.md | Chunk 6 — Org-Wide Pages | ✅ Complete |
| 12_security.md | Security Model | ✅ Complete |
| 13_api_spec_part1.md | API Spec Part 1 (Auth → Projects) | ✅ Complete |
| 13_api_spec_part2.md | API Spec Part 2 (Applications → Search) | ✅ Complete |

## Reading Order for an AI Agent

Feed these files in this exact order for full context before building:

1. 00_index.md (this file)
2. 01_product_overview.md
3. 02_roles_and_permissions.md
4. 03_data_model.md
5. 04_infrastructure.md
6. 12_security.md
7. 05_chunk1_onboarding.md
8. 07_chunk2_member_core.md
9. 08_chunk3_project_detail.md
10. 09_chunk4_project_lead_view.md
11. 10_chunk5_board_view.md
12. 11_chunk6_org_wide_pages.md
13. 06_notifications_and_edge_cases.md
14. 13_api_spec_part1.md
15. 13_api_spec_part2.md

---

## Complete Data Model — All 26 Entities

Entities defined in 03_data_model.md (v2.2). Migration 027_constraints.sql adds CHECK and UNIQUE constraints after all tables exist — no new entities added by that migration.

| # | Entity | Defined in |
|---|---|---|
| 1 | users | 03_data_model.md |
| 2 | user_auth | 03_data_model.md |
| 3 | org_roles | 03_data_model.md |
| 4 | chapters | 03_data_model.md |
| 5 | projects | 03_data_model.md |
| 6 | project_types | 03_data_model.md |
| 7 | shifts | 03_data_model.md |
| 8 | project_roles | 03_data_model.md |
| 9 | applications | 03_data_model.md |
| 10 | onboarding | 03_data_model.md |
| 11 | tasks | 03_data_model.md |
| 12 | badges | 03_data_model.md |
| 13 | user_badges | 03_data_model.md |
| 14 | announcements | 03_data_model.md |
| 15 | project_updates | 03_data_model.md |
| 16 | fundraising_contacts | 03_data_model.md |
| 17 | donations | 03_data_model.md |
| 18 | files | 03_data_model.md |
| 19 | notifications | 03_data_model.md |
| 20 | notification_preferences | 03_data_model.md |
| 21 | recents | 03_data_model.md |
| 22 | directory_profiles | 03_data_model.md |
| 23 | system_logs | 03_data_model.md |
| 24 | policy_acknowledgments | 03_data_model.md |
| 25 | volunteer_flags | 03_data_model.md |
| 26 | org_settings | 03_data_model.md |

## Migration Status

| File | Table | Status |
|---|---|---|
| 000_jwt_hook.sql | JWT custom claims hook | ✅ Done |
| 001_org_roles.sql | org_roles | ✅ Done |
| 002_chapters.sql | chapters | ✅ Done |
| 003_users.sql | users + users_directory view | ✅ Done |
| 004_user_auth.sql | user_auth | ✅ Done |
| 005_project_types.sql | project_types | ✅ Done |
| 006_projects.sql | projects | ✅ Done |
| 007_shifts.sql | shifts | ✅ Done |
| 008_project_roles.sql | project_roles | ✅ Done |
| 009_applications.sql | applications | ✅ Done |
| 010_onboarding.sql | onboarding | ✅ Done |
| 011_tasks.sql | tasks | ✅ Done |
| 012_badges.sql | badges | ✅ Done |
| 013_user_badges.sql | user_badges | ✅ Done |
| 014_announcements.sql | announcements | ✅ Done |
| 015_project_updates.sql | project_updates | ✅ Done |
| 016_fundraising_contacts.sql | fundraising_contacts | ⏳ Pending |
| 017_donations.sql | donations | ⏳ Pending |
| 018_files.sql | files | ⏳ Pending |
| 019_notifications.sql | notifications | ⏳ Pending |
| 020_notification_preferences.sql | notification_preferences | ⏳ Pending |
| 021_recents.sql | recents | ⏳ Pending |
| 022_directory_profiles.sql | directory_profiles | ⏳ Pending |
| 023_system_logs.sql | system_logs | ⏳ Pending |
| 024_policy_acknowledgments.sql | policy_acknowledgments | ⏳ Pending |
| 025_volunteer_flags.sql | volunteer_flags | ⏳ Pending |
| 026_org_settings.sql | org_settings | ⏳ Pending |
| 027_constraints.sql | UNIQUE + CHECK constraints (no new table) | ⏳ Pending |

## Known Issues Caught During Migration Review

1. **000_jwt_hook.sql** — manual step required after running: Supabase Dashboard → Authentication → Hooks → Custom Access Token → set to `public.custom_access_token_hook`
2. **003_users.sql** — guardian fields (guardian_email, guardian_phone, date_of_birth) excluded from users_directory view. Directory API must query the view not the base table for non-Board users.
3. **006_projects.sql** — anon policy scoped to is_published only. Lead policy scoped to created_by only (not chapter-wide).
4. **009_applications.sql** — migration order: fundraising_contacts before donations (dependency fix applied).
5. **010_onboarding.sql** — first generated version had corrupted CHECK constraint. Regenerated clean.
6. **011_tasks.sql** — member UPDATE policy allows all fields at RLS level. Status-only restriction and Awaiting Input block enforced in API PATCH /api/tasks/:task_id.
7. **027_constraints.sql** — must run after all 26 other migrations. Removes directory_profiles.is_visible column.

## Fields Added After v2.1 (now in v2.2)

| Table | Change | Migration |
|---|---|---|
| users | personal_email UNIQUE | 027_constraints.sql |
| users | ethos_email UNIQUE | 027_constraints.sql |
| users | slack_user_id UNIQUE | 027_constraints.sql |
| user_auth | google_account_email UNIQUE | 027_constraints.sql |
| directory_profiles | is_visible column REMOVED | 027_constraints.sql |
| projects | CHECK open_call_app_level consistency | 027_constraints.sql |
| projects | CHECK location required when not virtual | 027_constraints.sql |
| badges | CHECK Achievement → project_id IS NULL | 027_constraints.sql |
| files | CHECK category/project_id consistency | 027_constraints.sql |
| files | is_policy BOOLEAN DEFAULT false | 018_files.sql |
| recents | reference_id FK removed — cascade via trigger/API | 021_recents.sql |
| projects | slack_channel_id VARCHAR(100) nullable | 006_projects.sql |
| projects | closed_at TIMESTAMP nullable | 006_projects.sql |
| volunteer_flags | resolved BOOLEAN | 025_volunteer_flags.sql |
| volunteer_flags | resolved_by UUID FK nullable | 025_volunteer_flags.sql |
| volunteer_flags | resolved_at TIMESTAMP nullable | 025_volunteer_flags.sql |

---

## Key Decisions Summary

### Organization
- Geographic chapters + HQ
- Chapter heads = Project Lead role in app (same permissions, different org title)
- Board = supreme access, no restrictions. Replaces "Admin" everywhere.
- Volunteers belong to one chapter permanently
- HQ project = volunteer's only active project while on it
- Board cannot demote another Board member via UI — Supabase dashboard only

### Users
- Ages 14–17 only. Minimum 14. Accounts persist at 18.
- All approved members required on Slack
- Google SSO primary auth. Email magic link fallback.
- Personal email pre-approval. Ethos email post-approval (manual Board action).
- Guardian info (name, email, phone) stored on users table
- Under-13 blocked at server-side validation — COPPA

### Projects
- One unified table, type as label (Event / Campaign / Program + HQ categories)
- Max 3 active + 3 pending per member
- HQ project = counts as the only active project
- max_applications = max approved volunteers (not pending)
- Open calls scoped by chapter proximity + HQ
- Closed projects cannot be reopened — create new
- Shifts informational only — capacity not programmatically enforced
- Slack channel auto-created on publish. Stored as slack_channel_id.
- Project Lead can only see/manage own projects. Board sees all.

### Onboarding (one-time, not repeated per project)
- Step order: Slack → Orientation → Waiver → Parental Consent → PM Review
- PM Review = applications.status = 'Approved' (not a separate field)
- Completed steps preserved on reapplication after rejection
- OpenSign embedded in-app (Option B — no redirect)
- Parental consent nudge: max once per 24 hours
- Parental consent sent to guardian_email on users table

### Roles
- Three roles: Member (1), Project Lead (2), Board (3)
- Chapter heads and HQ leads = Project Lead in app
- Board promotes/demotes via Role Management in Board Panel
- Board cannot demote another Board member via UI

### Notifications
- In-app always on — cannot be disabled. No separate inbox table.
- Email + Slack toggleable per event type
- Cannot disable both email and Slack for any event type
- Slack falls back to email if slack_user_id null
- Every Slack notification also appears in in-app inbox

### Badges
- Two categories: Participation (project-tied) and Achievement (org-wide)
- Board creates all badge types (CS HQ team eventually)
- Project Leads award participation badges to own project volunteers
- Board awards achievement badges including VOTY
- VOTY displayed as subtitle under member name on directory profile

### Files
- Google Drive metadata only — no file content in database
- Categories: Project and Universal. CHECK constraints enforce project_id rules.
- All approved members see all files — no per-member filtering
- is_policy = true files appear in Training tab
- Project Leads add project files. Board adds Universal files.
- added_by and created_at shown on file cards

### Tasks
- Statuses: Not Started, In Progress, Awaiting Input, Complete
- Members see all tasks on their project
- Members update status of own assigned tasks only (API-enforced)
- Members cannot set Awaiting Input (API-enforced)
- Only Lead/Board can unblock Awaiting Input

### Recents
- Dwell-based trigger (3–5 seconds)
- 20 rows max in DB per user. 10 shown in UI.
- No FK on reference_id — cascade via trigger or API cleanup

### Communication
- Slack: all approved members. Slack Pro nonprofit (~$250/month at 500 members).
- Per-project Slack channel auto-created on publish
- Project updates feed: one-way Slack channel sync into project_updates table
- Announcements: one-way #announcements sync into announcements table

### Training
- Orientation videos: rewatchable, 4 chapters, completion tracked
- Policy documents: Board adds via Drive (is_policy = true). Checkbox acknowledgment.
- policy_acknowledgments reset for all members when a document is updated

### Directory
- Members see own chapter only. Board sees all.
- Search by name (PostgreSQL full-text)
- Filter by role. Board can filter by chapter.
- Profiles always visible — no hiding. is_visible column removed.
- VOTY shown as subtitle under name

### Search
- Global full-text search via PostgreSQL tsvector/tsquery
- Covers: projects, files, members, tasks, announcements
- Scoped by chapter and permissions
- Target: under 500ms

### Tech Stack
- Frontend + backend: Next.js (App Router)
- Database + auth + realtime: Supabase (PostgreSQL)
- Hosting: Vercel
- Email: Resend
- Signing: OpenSign (embedded)
- Files: Google Drive (info@ethossustainability.org)
- Communication: Slack Pro nonprofit
- Web only — no native app

### Security
- RLS on every table
- UUID primary keys for all user-facing records
- Service role key server-side only (Vercel env vars)
- JWT expiry: 1 hour, auto-refresh for active sessions
- JWT contains org_role_id and chapter_id via custom hook (000_jwt_hook.sql)
- Role changes take up to 1 hour to reflect in JWT — acceptable for rare admin actions
- Under-13 blocked server-side
- Slack and OpenSign webhooks verified by signing secret
- Board edits member profiles via Supabase dashboard — not a UI feature
- guardian_email, guardian_phone, date_of_birth never exposed to other members

---

## Deferred / Future Considerations

- Grant checklists — workflow not yet defined
- Automated background check — manual sufficient at current scale
- File upload permissions for members — deferred, Drive-level decision
- Per-shift roles — not needed at current scope
- Push notifications — web only for now
- Parental ongoing notifications — future consideration
- Account settings UI — deferred until app largely built
- CS HQ team takes over badge management — permission update when ready
- Fundraising HQ team takes over donations/contacts — permission update when ready
- Chapter transfer for members — manual Board action if ever needed
- notification_preferences scalability — new event types require schema migration, accepted tradeoff