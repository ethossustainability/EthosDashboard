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
- Contains user_id and org_role_id
- Included in every database request from the frontend
- Supabase reads the token, applies RLS rules based on user_id and role
- Even if intercepted: RLS prevents access to other users' data
- Expires in 1 hour — stolen tokens are short-lived

---

## Row Level Security (RLS)

RLS is enforced at the database level — not just in application code.
Even if a bug exists in the frontend or API, the database itself refuses unauthorized reads and writes.

### RLS Policies by Table

#### users
- SELECT: user can read own record. Board can read all.
- UPDATE: user can update own non-sensitive fields (name, phone, guardian info). Board can update any record.
- INSERT: handled by Supabase Auth only — no direct inserts from frontend.
- DELETE: Board only via Supabase dashboard — not a UI feature.

#### user_auth
- SELECT: user can read own auth records. Board can read all.
- INSERT/UPDATE: Board only (linking Ethos email).
- DELETE: Board only.

#### projects
- SELECT: authenticated users can read published projects scoped to their chapter + open calls. Board reads all.
- INSERT: Project Lead and Board only.
- UPDATE: Project Lead (own projects only). Board (any project).
- DELETE: Board only.

#### shifts
- SELECT: authenticated users can read shifts for projects they have access to.
- INSERT/UPDATE/DELETE: Project Lead (own project shifts). Board (any).

#### project_roles
- SELECT: authenticated users on the project.
- INSERT/UPDATE/DELETE: Project Lead (own project). Board (any).

#### applications
- SELECT: applicant reads own. Project Lead reads applications to own projects. Board reads all.
- INSERT: any authenticated user (subject to 3-pending limit enforced in application logic).
- UPDATE: Project Lead (own project applications). Board (any). Applicant (withdrawal only — status = Withdrawn, only if current status = Pending).
- DELETE: never — archived only.

#### onboarding
- SELECT: user reads own. Board reads all.
- INSERT: system only (created on first application submission).
- UPDATE: user (own steps). System (automated step completion). Board (any).

#### tasks
- SELECT: authenticated users on the project.
- INSERT: Project Lead (own project). Board (any).
- UPDATE: assigned user (own tasks — status only). Project Lead (own project tasks). Board (any).
- DELETE: Project Lead (own project). Board (any).

#### badges
- SELECT: all authenticated users.
- INSERT/UPDATE/DELETE: Board only.

#### user_badges
- SELECT: all authenticated users (displayed on directory profiles).
- INSERT: Project Lead (participation badges for own project volunteers). Board (any).
- DELETE: Board only.

#### announcements
- SELECT: all authenticated users.
- INSERT: system only (Slack webhook handler using service role key).
- UPDATE/DELETE: Board only.

#### project_updates
- SELECT: authenticated users on the project.
- INSERT: system only (Slack webhook handler using service role key).
- UPDATE/DELETE: Board only.

#### donations
- SELECT: all authenticated users.
- INSERT/UPDATE/DELETE: Board only (Fundraising HQ team lead eventually).

#### fundraising_contacts
- SELECT: all authenticated users.
- INSERT/UPDATE/DELETE: Board only.

#### files
- SELECT: all authenticated users.
- INSERT: Project Lead (project files for own projects). Board (any including Universal).
- UPDATE/DELETE: Project Lead (own project files). Board (any).

#### notifications
- SELECT: user reads own. Board reads all.
- INSERT: system only (notification service using service role key).
- UPDATE (is_read, read_at): user (own notifications only).
- DELETE: never.

#### notification_preferences
- SELECT: user reads own. Board reads all.
- INSERT: system only (created on first approval).
- UPDATE: user (own preferences). Board (any).

#### recents
- SELECT: user reads own only.
- INSERT/UPDATE: user (own recents only — upsert on dwell).
- DELETE: cascades from project/file deletion. User can clear own recents.

#### directory_profiles
- SELECT: all authenticated users (scoped by chapter for non-Board).
- INSERT: system only (created on first approval).
- UPDATE: user (own bio only). Board (any field via Supabase dashboard — not UI).

#### volunteer_flags
- SELECT: flagging Project Lead (own flags). Board (all).
- INSERT: Project Lead only.
- UPDATE (resolved fields): Board only.
- DELETE: never.

#### system_logs
- SELECT: Board only.
- INSERT: system only (error handlers using service role key).
- UPDATE (resolved fields): Board only.
- DELETE: never.

#### policy_acknowledgments
- SELECT: user reads own. Board reads all.
- INSERT: user (own acknowledgments only).
- DELETE: system only (on policy document update — Board action triggers cascade reset).

#### org_settings
- SELECT: all authenticated users (fundraising goal is public).
- INSERT/UPDATE: Board only.
- DELETE: never.

#### chapters
- SELECT: all authenticated users.
- INSERT/UPDATE: Board only.
- DELETE: never.

---

## Minor Data Protection

### COPPA Compliance
- Minimum age: 14 — enforced at application submission (date_of_birth validated server-side)
- Under-13 flag: if date_of_birth indicates under 13, account creation is blocked with a clear message
- No data collected from under-13 users at any point

### Parental Consent
- Required for every user before onboarding completes
- Handled via OpenSign — legally binding digital signature
- Guardian email collected at application step 1 (Basics)
- Consent document stored as OpenSign reference ID — not raw PDF in database
- Consent signed_at timestamp stored permanently
- Consent record never deleted even if application is rejected

### Data minimization
- Only data necessary for the app's function is collected
- No social security numbers
- No payment information
- No location tracking beyond city/region at signup
- Guardian phone is optional

### Data retention
- Rejected and withdrawn applications archived — never deleted (audit trail)
- Notifications never deleted (audit trail)
- System logs never deleted (audit trail)
- User accounts persist when member turns 18 — no forced deletion
- Board can delete a user record via Supabase dashboard in exceptional circumstances — not a UI feature

---

## Integration Security

### Supabase
- Anon key in frontend — safe by design, RLS enforces all access rules
- Service role key in Vercel environment variables only
- Database connection over SSL only
- Supabase project in a region compliant with US data regulations

### OpenSign
- Webhook payload verified using OpenSign's signature header before processing
- Document reference IDs stored — never raw document content
- Guardian email sent only to the address provided by the volunteer — never stored elsewhere

### Slack
- Slack webhook payloads verified using Slack's signing secret
- Signing secret stored in Vercel environment variables
- Bot token stored in Vercel environment variables — never in frontend

### Resend
- API key stored in Vercel environment variables
- Emails sent from Ethos-branded domain (info@ethossustainability.org or a Resend-verified subdomain)
- No email content stored beyond the notifications table log

### Google Drive
- OAuth credentials stored in Vercel environment variables
- App requests read-only Drive scope for file metadata
- No file content passes through the app server — Drive URLs link directly to Google
- Drive permissions managed at the Google Workspace level

### Google OAuth (SSO)
- OAuth client ID and secret stored in Supabase Auth configuration
- Client ID visible in frontend (by design — OAuth standard)
- Client secret never in frontend

---

## Environment Variables (Required)

All stored in Vercel environment variables. Never committed to version control.

| Variable | Used for |
|---|---|
| SUPABASE_URL | Supabase project URL |
| SUPABASE_ANON_KEY | Frontend Supabase client |
| SUPABASE_SERVICE_ROLE_KEY | Server-side operations bypassing RLS |
| SLACK_BOT_TOKEN | Slack API calls (channel creation, DMs) |
| SLACK_SIGNING_SECRET | Webhook payload verification |
| OPENSIGN_WEBHOOK_SECRET | OpenSign webhook verification |
| RESEND_API_KEY | Email sending |
| GOOGLE_DRIVE_CLIENT_ID | Drive OAuth |
| GOOGLE_DRIVE_CLIENT_SECRET | Drive OAuth |
| NEXT_PUBLIC_SUPABASE_URL | Public — safe for frontend |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public — safe for frontend |

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
- [ ] Slack signing secret verified on every incoming webhook
- [ ] OpenSign webhook secret verified on every incoming webhook
- [ ] date_of_birth validation enforced server-side (not just client-side)
- [ ] Under-13 block tested and confirmed
- [ ] JWT expiry confirmed (1 hour)
- [ ] Anon key tested — confirms it cannot read non-published projects without auth
- [ ] Board role confirmed cannot demote another Board member via UI
- [ ] policy_acknowledgment cascade reset tested on document update
