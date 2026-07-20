# Ethos App - Session State

## Phase 3 (lib clients)
✅ Complete

## Phase 4 (API routes)
✅ Complete - all ~64 endpoints done

## Phase 5 (UI chunks)
✅ Complete

## UI chunks
? Chunk 1: Complete
? Chunk 2: Complete
? Chunk 3: Complete
? Chunk 4: Complete
? Chunk 5: Complete
✅ Chunk 6: Complete

## Completed endpoints
✅ `POST /api/auth/link-ethos-email`
✅ `GET + PATCH /api/users/me`
✅ `GET /api/users/:user_id`
✅ `PATCH /api/users/:user_id/role`
✅ `GET /api/users/directory`
✅ `GET /api/chapters`
✅ `GET + POST /api/projects`
✅ `GET /api/projects/:project_id`
✅ `PATCH /api/projects/:project_id`
✅ `POST /api/projects/:project_id/publish`
✅ `POST /api/projects/:project_id/close`
✅ `POST + PATCH + DELETE /api/projects/:project_id/shifts`
✅ `POST + PATCH + DELETE /api/projects/:project_id/roles`
✅ `GET + POST /api/applications`
✅ `PATCH /api/applications/:id/approve`
✅ `PATCH /api/applications/:id/reject`
✅ `PATCH /api/applications/:id/withdraw`
✅ `PATCH /api/applications/:id/reassign-role`
✅ `GET /api/onboarding/me`
✅ `POST /api/onboarding/connect-slack`
✅ `PATCH /api/onboarding/orientation-progress`
✅ `POST /api/onboarding/send-waiver`
✅ `POST /api/onboarding/send-parental-consent`
✅ `POST /api/onboarding/resend-parental-consent`
✅ `POST /api/webhooks/opensign`
✅ `POST /api/webhooks/slack/announcements`
✅ `POST /api/webhooks/slack/project-updates`
✅ `GET + POST /api/tasks`
✅ `PATCH + DELETE /api/tasks/:task_id`
✅ `GET + POST /api/files`
✅ `DELETE /api/files/:file_id`
✅ `GET + POST /api/badges`
✅ `POST /api/badges/:badge_id/award`
✅ `GET /api/notifications/me`
✅ `PATCH /api/notifications/:notification_id/read`
✅ `PATCH /api/notifications/me/read-all`
✅ `GET + PATCH /api/notification-preferences/me`
✅ `GET /api/announcements`
✅ `GET /api/projects/:project_id/updates`
✅ `GET /api/recents/me`
✅ `POST /api/recents`
✅ `GET + POST /api/donations`
✅ `PATCH + DELETE /api/donations/:donation_id`
✅ `GET + POST /api/fundraising-contacts`
✅ `PATCH + DELETE /api/fundraising-contacts/:contact_id`
✅ `GET /api/org-settings`
✅ `PATCH /api/org-settings/:key`
✅ `POST + GET /api/flags`
✅ `PATCH /api/flags/:flag_id/resolve`
✅ `GET /api/system-logs`
✅ `PATCH /api/system-logs/:log_id/resolve`
✅ `GET + POST /api/policy-acknowledgments/me`
✅ `PATCH /api/directory-profiles/me`
✅ `PATCH /api/projects/:project_id/budget`
✅ `GET /api/search`

## MUST DO BEFORE DEPLOY

1. On a network without SSL interception, run:
   `npm install @supabase/ssr`
   Then delete `types/supabase-ssr.d.ts` (the shim).

2. Set all environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `SLACK_CLIENT_ID`
   - `SLACK_CLIENT_SECRET`
   - `OPENSIGN_WEBHOOK_SECRET`
   - `OPENSIGN_WAIVER_TEMPLATE_ID`
   - `OPENSIGN_CONSENT_TEMPLATE_ID`
   - `RESEND_API_KEY`
   - `RESEND_FROM_ADDRESS` (confirm with Ethos - likely `info@ethossustainability.org`)
   - `GOOGLE_DRIVE_CLIENT_ID`
   - `GOOGLE_DRIVE_CLIENT_SECRET`

3. Register JWT hook in Supabase Dashboard:
   Authentication -> Hooks -> Custom Access Token -> set to `public.custom_access_token_hook`

4. Run all 28 SQL migrations in Supabase SQL editor in order (`000` through `027`).

5. In Supabase, manually set `org_settings` values:
   - `slack_invite_link`: your Ethos workspace invite URL
   - `slack_announcements_channel_id`: the `#announcements` Slack channel ID

6. Create OpenSign document templates for:
   - Ethos liability waiver
   - Parental consent form
   Then set `OPENSIGN_WAIVER_TEMPLATE_ID` and `OPENSIGN_CONSENT_TEMPLATE_ID` in Vercel env vars.

7. Install `@dnd-kit` after npm is restored for kanban drag-and-drop:
   `npm install @dnd-kit/core @dnd-kit/sortable`

## KNOWN REMAINING CODE GAPS

- Notification delivery not wired (records inserted but no actual email/Slack sends triggered)
- OpenSign webhook header name unverified against real OpenSign docs
- Kanban drag-and-drop deferred pending `@dnd-kit` install
- `requireUser` helper not extracted (low priority)
