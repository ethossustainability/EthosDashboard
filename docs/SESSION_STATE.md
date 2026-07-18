# Ethos App — Session State

## Phase 3 (lib clients)
✅ Complete. 6 files in `/lib` including `lib/auth.ts` (shared `extractClaims` utility).

## Phase 4 (API routes)
🔶 In progress. Completed endpoints:
✅ `POST /api/auth/link-ethos-email`
✅ `GET /api/users/me` + `PATCH /api/users/me`
✅ `GET /api/users/:user_id`
✅ `PATCH /api/users/:user_id/role`
✅ `GET /api/users/directory`
✅ `GET /api/chapters`
✅ `GET /api/projects`
✅ `GET /api/projects/:project_id`
✅ `POST /api/projects`
✅ `PATCH /api/projects/:project_id`
✅ `POST /api/projects/:project_id/publish`
✅ `POST /api/projects/:project_id/close`
✅ `POST /api/projects/:project_id/shifts`
✅ `PATCH /api/projects/:project_id/shifts/:shift_id`
✅ `DELETE /api/projects/:project_id/shifts/:shift_id`
✅ `POST /api/projects/:project_id/roles`
✅ `PATCH /api/projects/:project_id/roles/:project_role_id`
✅ `DELETE /api/projects/:project_id/roles/:project_role_id`

**Known bugs fixed:** 
- Response key mismatches
- `max_applications` type in `types/projects.ts` updated to `number`
- `ProjectRole` import corrected
- `extractClaims` extracted to `lib/auth.ts` and shared across routes

**Known gaps to address later:**
- Notification delivery not wired (records inserted but no actual email/Slack send triggered)
- `textSearch` on computed expressions may fall back to `ilike` at runtime
- OpenSign webhook signature scheme unverified against real docs
- `RESEND_FROM_ADDRESS` env var value not yet confirmed
- `SLACK_CLIENT_ID` env var required for Slack OAuth
- `SLACK_CLIENT_SECRET` env var required for Slack OAuth
- `OPENSIGN_WAIVER_TEMPLATE_ID` and `CONSENT_TEMPLATE_ID` not yet created
- `slack_invite_link` must be manually set in `org_settings` after setup

**Remaining endpoints (roughly 45):** 
Applications, Onboarding + webhooks, Tasks, Files, Badges, Notifications, Announcements + webhooks, Project Updates, Recents, Fundraising, Org Settings, Volunteer Flags, System Logs, Policy Acknowledgments, Directory Profiles, Budget, Search.
