# Ethos App — Security Model

## Overview

The Ethos app handles minor data (ages 14–17) and parental consent records.
Security is non-negotiable. This document defines every layer of security in the system.

---

## Authentication

### Google SSO via Supabase Auth
- Primary login method for all users
- Supabase handles token issuance and refresh
- JWT tokens expire after 1 hour
- Supabase auto-refreshes tokens for active sessions
- Expired tokens redirect to login — no silent failure

### Email login (fallback)
- Available if Google SSO is unavailable
- Supabase magic link — no password stored
- Link expires after 15 minutes
- One-time use only

### Account creation
- No manual sign-up form
- First-time Google login auto-creates a user record with UUID user_id
- user_id is the permanent identifier — never changes, never reused

### Two Google accounts (personal + Ethos)
- Both linked to the same user_id via user_auth table
- active_login_email tracks which is currently in use
- Board links Ethos email via Supabase dashboard — not a self-service flow
- Switching accounts does not create a new user record

---

## Authorization

### Anon Key (public)
- Safe to expose in frontend code
- Allows unauthenticated access to the Supabase API
- On its own: can only read is_published projects (for the pre-login project board)
- Everything else blocked by RLS

### Service Role Key (private)
- Full database access — bypasses RLS entirely
- Never in frontend code
- Never in a public GitHub repository
- Lives in environment variables on the server (Next.js API routes / Vercel env vars)
- Rotated immediately if suspected exposure

### JWT Token
- Issued by Supabase Auth on login
- Contains user_id, org_role_id, and chapter_id (injected via 000_jwt_hook.sql custom claims hook)
- Included in every database request from the frontend
- Supabase reads the token, applies RLS rules based on claims
- Even if intercepted: RLS prevents access to other users' data
- Expires in 1 hour — stolen tokens are short-lived
- Role or chapter changes take up to 1 hour to reflect in JWT — acceptable for rare admin actions

---

## Row Level Security (RLS)

RLS is enforced at the database level — not just in application code.
Even if a bug exists in the frontend or API, the database itself refuses unauthorized reads and writes.
Every table has RLS enabled. No table is left with default allow-all.

### RLS Policies by Table

#### users
- SELECT: user reads own record. Board reads all. supabase_auth_admin reads all (for JWT hook).
- SELECT (directory): non-Board users query users_directory view (sensitive fields excluded — no guardian_email, guardian_phone, date_of_birth)
- UPDATE: user updates own non-sensitive fields. Board updates any record.
- INSERT: service role only (Supabase Auth signup flow)
- DELETE: no policy — Board only via Supabase dashboard

#### user_auth
- SELECT: user reads own. Board reads all. supabase_auth_admin reads all.
- INSERT/UPDATE: Board only (linking Ethos email)
- DELETE: no policy

#### org_roles
- SELECT: all authenticated users (role names are public info)
- INSERT/UPDATE/DELETE: no policy — service role only (lookup table, immutable)

#### chapters
- SELECT: all authenticated users
- INSERT/UPDATE: Board only
- DELETE: no policy — chapters never deleted

#### projects
- SELECT (anon): is_published = true only (chapter filtering in API)
- SELECT (authenticated): own chapter published + org-wide open calls. Lead sees own created projects. Board sees all.
- INSERT: Project Lead and Board only
- UPDATE: Project Lead (own projects). Board (any).
- DELETE: Board only

#### shifts
- SELECT (anon): shifts of published projects
- SELECT (authenticated): shifts of projects user can see (EXISTS subquery)
- INSERT/UPDATE/DELETE: Project Lead (own project). Board (any).

#### project_roles
- SELECT (anon): roles of published projects
- SELECT (authenticated): roles of projects user can see
- INSERT/UPDATE/DELETE: Project Lead (own project). Board (any).

#### applications
- SELECT: user reads own. Project Lead reads applications to own projects (EXISTS on projects.created_by). Board reads all.
- INSERT: any authenticated user (limits enforced in API)
- UPDATE: Project Lead (own project applications). Board (any). Members have NO UPDATE policy — withdrawal via service role in API.
- DELETE: no policy — archived only

#### onboarding
- SELECT: user reads own. Board reads all.
- INSERT: service role only (created on first application submission)
- UPDATE: user (own steps — orientation progress, slack connection). Service role (waiver/consent status via webhooks). Board (any).
- DELETE: no policy

#### tasks
- SELECT: approved members on the project (EXISTS on applications). Project Lead (created_by). Board.
- INSERT: Project Lead (own project). Board.
- UPDATE: member (own assigned tasks — all fields at RLS level, status-only restriction enforced in API). Project Lead (own project tasks). Board (any).
- DELETE: Project Lead (own project). Board.

#### badges
- SELECT: all authenticated users
- INSERT/UPDATE/DELETE: Board only

#### user_badges
- SELECT: all authenticated users (displayed on directory profiles)
- INSERT: Project Lead (participation badges for own project volunteers — nested EXISTS check). Board (any).
- UPDATE/DELETE: Board only

#### announcements
- SELECT: all authenticated users
- INSERT: service role only (Slack webhook handler)
- UPDATE/DELETE: Board only

#### project_updates
- SELECT: approved members on the project (EXISTS on applications). Project Lead (created_by). Board.
- INSERT: service role only (Slack webhook handler)
- UPDATE/DELETE: Board only

#### fundraising_contacts
- SELECT: all authenticated users
- INSERT/UPDATE/DELETE: Board only

#### donations
- SELECT: all authenticated users
- INSERT/UPDATE/DELETE: Board only

#### files
- SELECT: all authenticated users
- INSERT: Project Lead (project files for own projects). Board (any including Universal).
- UPDATE/DELETE: Project Lead (own project files). Board (any).

#### notifications
- SELECT: user reads own. Board reads all.
- INSERT: service role only (notification service)
- UPDATE (is_read, read_at): user (own notifications only)
- DELETE: no policy — never deleted

#### notification_preferences
- SELECT: user reads own. Board reads all.
- INSERT: service role only (created on first approval)
- UPDATE: user (own preferences). Board (any).
- DELETE: no policy

#### recents
- SELECT: user reads own only
- INSERT/UPDATE: user (own recents — upsert on dwell)
- DELETE: no FK cascade (reference_id cannot FK two tables). Cascade via trigger or API cleanup when project or file deleted. User can clear own recents.

#### directory_profiles
- SELECT: all authenticated users. Profiles always visible — no hiding.
- INSERT: service role only (created on first approval)
- UPDATE: user (own bio only). Board (any field via Supabase dashboard — not UI).
- DELETE: no policy

#### volunteer_flags
- SELECT: flagging Project Lead (own flags). Board (all).
- INSERT: Project Lead only
- UPDATE (resolved fields): Board only
- DELETE: no policy — never deleted

#### system_logs
- SELECT: Board only
- INSERT: service role only (error handlers)
- UPDATE (resolved fields): Board only
- DELETE: no policy — never deleted

#### policy_acknowledgments
- SELECT: user reads own. Board reads all.
- INSERT: user (own acknowledgments only)
- DELETE: service role only (on policy document update — Board action triggers cascade reset)

#### org_settings
- SELECT: all authenticated users (fundraising goal is public)
- INSERT/UPDATE: Board only
- DELETE: no policy — never deleted

---

## Minor Data Protection

### COPPA Compliance
- Minimum age: 14 — enforced server-side in API at application submission (date_of_birth validated)
- Under-13 flag: if date_of_birth indicates under 13, account creation is blocked with a clear message
- No data collected from under-13 users at any point

### Parental Consent
- Required for every user before onboarding completes
- Handled via OpenSign — legally binding digital signature
- Guardian email collected at application Step 1 (Basics)
- Consent document stored as OpenSign reference ID — not raw PDF in database
- Consent signed_at timestamp stored permanently
- Consent record never deleted even if application is rejected

### Sensitive Field Protection
- guardian_email, guardian_phone, date_of_birth never exposed to other members
- These fields excluded from users_directory view
- Only accessible via service role or Board via Supabase dashboard
- No API endpoint exposes these fields to non-Board users

### Data minimization
- Only data necessary for app function is collected
- No social security numbers
- No payment information
- No location tracking beyond city/region at signup
- Guardian phone is optional

### Data retention
- Rejected and withdrawn applications archived — never deleted (audit trail)
- Notifications never deleted (audit trail)
- System logs never deleted (audit trail)
- Volunteer flags never deleted (audit trail)
- User accounts persist when member turns 18 — no forced deletion
- Board can delete a user record via Supabase dashboard in exceptional circumstances — not a UI feature

---

## Integration Security

### Supabase
- Anon key in frontend — safe by design, RLS enforces all access rules
- Service role key in Vercel environment variables only
- Database connection over SSL only

### OpenSign
- Webhook payload verified using OpenSign's signing secret header before processing
- Document reference IDs stored — never raw document content
- Guardian email sent only to the address provided by the volunteer

### Slack
- Slack webhook payloads verified using Slack signing secret
- Signing secret stored in Vercel environment variables
- Bot token stored in Vercel environment variables — never in frontend
- Webhook timestamp checked — payloads older than 5 minutes rejected

### Resend
- API key stored in Vercel environment variables
- Emails sent from Ethos-branded domain
- No email content stored beyond the notifications table log

### Google Drive
- OAuth credentials stored in Vercel environment variables
- App requests read-only Drive scope for file metadata
- No file content passes through app server — Drive URLs link directly to Google

### Google OAuth (SSO)
- OAuth client ID and secret stored in Supabase Auth configuration
- Client ID visible in frontend (by design — OAuth standard)
- Client secret never in frontend

---

## Environment Variables (Required)

All stored in Vercel environment variables. Never committed to version control.

| Variable | Used for |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Frontend Supabase client |
| SUPABASE_SERVICE_ROLE_KEY | Server-side operations bypassing RLS |
| SLACK_BOT_TOKEN | Slack API calls (channel creation, DMs) |
| SLACK_SIGNING_SECRET | Webhook payload verification |
| OPENSIGN_WEBHOOK_SECRET | OpenSign webhook verification |
| RESEND_API_KEY | Email sending |
| GOOGLE_DRIVE_CLIENT_ID | Drive OAuth |
| GOOGLE_DRIVE_CLIENT_SECRET | Drive OAuth |

---

## What Board Can Do via Supabase Dashboard (Not UI Features)
- Edit any user's profile fields
- Delete a user record in exceptional circumstances
- Demote a Board member (prevents accidental UI lockout)
- View raw database tables and run SQL queries
- Rotate service role key if compromised
- All dashboard actions are logged by Supabase automatically

---

## Security Checklist for Development

Before launch, the following must be verified:

- [ ] RLS enabled on every table in Supabase
- [ ] Every table has explicit policies — no table left with default allow-all
- [ ] Service role key confirmed absent from all frontend code and git history
- [ ] All environment variables set in Vercel production environment
- [ ] Slack signing secret verified on every incoming webhook (timestamp check included)
- [ ] OpenSign webhook secret verified on every incoming webhook
- [ ] date_of_birth validation enforced server-side (not just client-side)
- [ ] Under-13 block tested and confirmed
- [ ] JWT expiry confirmed (1 hour)
- [ ] 000_jwt_hook.sql registered in Supabase Dashboard → Authentication → Hooks → Custom Access Token
- [ ] JWT claims confirmed to include org_role_id and chapter_id after hook registration
- [ ] Anon key tested — confirms it cannot read non-published projects without auth
- [ ] Board role confirmed cannot demote another Board member via UI
- [ ] policy_acknowledgment cascade reset tested on document update
- [ ] users_directory view confirmed excludes guardian_email, guardian_phone, date_of_birth
- [ ] 027_constraints.sql confirmed run after all other migrations
- [ ] Verify UNIQUE constraints on users.personal_email, ethos_email, slack_user_id
- [ ] Verify UNIQUE constraint on user_auth.google_account_email
- [ ] Verify CHECK constraints on projects (open_call_app_level, location/is_virtual)
- [ ] Verify CHECK constraints on badges (achievement/project_id)
- [ ] Verify CHECK constraints on files (category/project_id)
- [ ] Confirm directory_profiles.is_visible column does not exist in production schema