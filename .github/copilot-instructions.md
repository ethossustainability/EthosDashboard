# Ethos App — Copilot Instructions

## What this project is
A volunteer management platform for Ethos Sustainability, a nonprofit where all members are volunteers ages 14–17 (minors only). This is a real production app expected to serve ~500 users.

## Critical rules — read before every task
- Follow the planning docs in /docs precisely. Do not make product decisions not covered there.
- Never deviate from the data model in /docs/03_data_model.md — field names, types, and relationships are final.
- Never deviate from the API spec in /docs/13_api_spec_part1.md and /docs/13_api_spec_part2.md — endpoint paths, request shapes, response shapes, and error codes are final.
- When in doubt about any product decision, stop and ask. Do not invent behavior.
- All users are minors. Handle all data with appropriate care. Never collect more data than specified.

## Stack — do not substitute any of these
- Frontend + backend logic: Next.js (App Router)
- Database + auth + realtime: Supabase (PostgreSQL)
- Hosting: Vercel
- Email: Resend
- Document signing: OpenSign (embedded in-app)
- File storage: Google Drive (metadata and links only — no file content in database)
- Communication: Slack (all approved members)
- Styling: Tailwind CSS
- Language: TypeScript throughout

## Project structure
```
/docs                        — all planning markdown files (read these first)
/app                         — Next.js App Router pages and layouts
/app/api                     — Next.js API routes (server-side logic)
/components                  — reusable React components
/lib                         — utility functions, Supabase client, third-party clients
/lib/supabase.ts             — Supabase client (anon key, browser-safe)
/lib/supabase-admin.ts       — Supabase admin client (service role key, server only)
/lib/slack.ts                — Slack API client
/lib/resend.ts               — Resend email client
/lib/opensign.ts             — OpenSign API client
/supabase/migrations         — SQL migration files (one per table or change)
/types                       — TypeScript type definitions matching the data model
```

## Database rules
- All primary keys are UUID unless the table is a lookup table (org_roles, project_types use INTEGER)
- Every table must have RLS enabled
- Every table must have explicit RLS policies — never leave a table with default allow-all
- Use the service role key (supabase-admin client) only in /app/api routes — never in components or lib files that run client-side
- Use the anon key (supabase client) for all client-side queries — RLS handles access control
- Field names must exactly match /docs/03_data_model.md — no renaming, no adding fields not in the doc

## Auth rules
- Google SSO via Supabase Auth — primary login method
- Email magic link via Supabase Auth — fallback only
- JWT tokens handled entirely by Supabase — do not implement custom JWT logic
- user_id (UUID) is the permanent identifier — never use email as an identifier
- Service role key lives in environment variables only — never in any file that could be committed

## API route rules
- Every protected route must verify the Supabase JWT before doing anything else
- Return format is always: `{ data: {...}, error: null }` or `{ data: null, error: { code: "ERROR_CODE", message: "..." } }`
- Error codes are defined in /docs/13_api_spec_part1.md — use exactly those codes
- Webhook routes (Slack, OpenSign) verify signing secrets before processing — never skip this
- Business logic (limit enforcement, multi-step operations) lives in API routes — never in components

## Roles
- Three roles: Member (org_role_id = 1), Project Lead (org_role_id = 2), Board (org_role_id = 3)
- "Admin" does not exist — it is called "Board" everywhere
- Chapter heads and HQ project leads are Project Lead (role 2) in the app
- Board has universal access — no restrictions anywhere
- Permission logic per feature is defined in /docs/02_roles_and_permissions.md

## Component rules
- Use Tailwind CSS only — no other CSS frameworks or CSS modules
- Use the Ethos color palette (defined below) — do not introduce other colors
- Components must be typed with TypeScript — no `any` types
- Server components by default — add `"use client"` only when interactivity requires it

## Ethos color palette
```
--cream:       #FFFBF4
--sand:        #D4CCC4
--warm-gray:   #A89E94
--brown-mid:   #7D6F63
--brown-dark:  #514033
--peach-light: #FFE2D6
--peach:       #FCBD9D
--espresso:    #413429
```
Primary background: cream. Primary dark: espresso. Accent: peach. Text: espresso on light, cream on dark.

## Environment variables required
All in .env.local — never committed to git:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SLACK_BOT_TOKEN
SLACK_SIGNING_SECRET
OPENSIGN_WEBHOOK_SECRET
RESEND_API_KEY
GOOGLE_DRIVE_CLIENT_ID
GOOGLE_DRIVE_CLIENT_SECRET
```

## Build order — follow this exactly
1. /supabase/migrations — all SQL migrations (tables + RLS policies + indexes)
2. /types — TypeScript types for every entity in the data model
3. /lib — Supabase client, Supabase admin client, Slack client, Resend client, OpenSign client
4. /app/api — API routes per the API spec (Part 1 first, then Part 2)
5. /app + /components — UI chunks in order: Chunk 1 → 2 → 3 → 4 → 5 → 6

## Planning docs reading order
When starting a new task, read these docs in this order for full context:
1. /docs/00_index.md
2. /docs/01_product_overview.md
3. /docs/02_roles_and_permissions.md
4. /docs/03_data_model.md
5. /docs/04_infrastructure.md
6. /docs/12_security.md
7. Then the relevant chunk doc for the UI task at hand

## Key business rules (enforce in code)
- Max 3 pending applications per user — enforced in POST /api/applications
- Max 3 active (approved) projects per user — enforced in PATCH /api/applications/:id/approve
- HQ project = only active project — enforced in POST /api/applications
- Withdrawal only allowed when status = Pending — enforced in PATCH /api/applications/:id/withdraw
- Closed projects cannot be reopened — enforced in POST /api/projects/:id/publish
- Minimum age 14, under-13 blocked — enforced server-side in POST /api/applications (validate date_of_birth)
- Notification preferences: email and Slack cannot both be false for any event type — enforced in PATCH /api/notification-preferences/me
- Recents: upsert on dwell (called by frontend after 3–5 seconds), max 20 rows per user
- Board cannot demote another Board member via UI — enforced in PATCH /api/users/:id/role
- OpenSign and Slack webhook routes must verify signing secrets — enforced before any processing

## What not to do
- Do not use any CSS other than Tailwind
- Do not use any database other than Supabase/PostgreSQL
- Do not add any npm packages not needed for the task at hand
- Do not create any API endpoints not in the API spec
- Do not add any database fields not in the data model
- Do not make any product decisions — if something is unclear, ask
- Do not use `any` TypeScript type
- Do not put the service role key anywhere client-side
- Do not skip RLS policy creation for any table
- Do not implement custom authentication — use Supabase Auth only
