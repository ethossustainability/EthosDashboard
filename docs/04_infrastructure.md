# Ethos App — Infrastructure

## Full Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend + backend logic | Next.js | React-based, built-in API routes, strong Supabase integration, handles routing |
| Database + auth + realtime | Supabase (PostgreSQL) | Native Google SSO, row-level security, realtime subscriptions, nonprofit-friendly pricing |
| Hosting | Vercel | Pairs natively with Next.js, auto-deploys from GitHub, free tier solid |
| Email | Resend | Transactional email, Next.js native integration, React Email templates, generous free tier |
| Document signing | OpenSign | Free, open source, no account needed to sign, API available, guest signer OTP flow |
| File storage | Google Drive | Ethos Drive at info@ethossustainability.org, app stores metadata and links only |
| Communication | Slack | All approved members required. Slack Pro nonprofit plan. |
| Announcements | Slack → app | One-way webhook sync from #announcements channel |
| Signing UI | OpenSign embedded | Option B — signing happens in-app, no redirect |

## Database

- **Engine:** PostgreSQL via Supabase
- **IDs:** UUID for all user-facing records. Integer IDs for lookup tables only.
- **Security:** Row-level security (RLS) enforced at the database level
- **Search:** PostgreSQL full-text search using tsvector/tsquery. Covers projects, files, members, tasks, announcements. Target: results within 500ms. No external search service needed at current scale.
- **Realtime:** Supabase realtime subscriptions for task updates and announcement sync

## Auth

- Google SSO via Supabase Auth
- Anon key safe to expose in frontend — RLS is the security layer
- Service role key lives server-side only, never in frontend code
- JWT tokens expire ~1 hour, auto-refreshed for active sessions
- Two Google accounts can be linked to one user_id (personal Gmail + Ethos Workspace)
- Admin links Ethos email to existing user record via Supabase dashboard

## Slack

- **Plan:** Slack Pro nonprofit — free for first 250 members, $1/member/month after
- **At 500 members:** $250/month / $3,000/year
- **Workspace:** Ethos Slack workspace — all approved members added on approval
- **Bot:** Slack bot for personal DM notifications to members
- **Announcements:** One-way webhook from #announcements → app announcements table
- **Notifications:** Every app notification also sent as Slack DM (unless user opts out in favor of email)

## Email

- **Service:** Resend
- **Templates:** Built with React Email — Ethos branded
- **Pre-approval:** Emails go to personal_email
- **Post-approval:** Emails go to ethos_email once assigned, else personal_email
- **Sent-to stored:** sent_to_email recorded at send time in notifications table
- **Retry:** Failed emails retry up to 3 times

## Document Signing

- **Service:** OpenSign
- **Documents:** Ethos liability waiver (volunteer signs) + parental consent form (guardian signs)
- **Both are org-wide, signed once** — not repeated for each new project
- **Flow:** OpenSign embedded in-app (no redirect). Guardian receives email with OTP to sign — no OpenSign account needed.
- **Parental consent nudge:** Reminder email sendable once per 24 hours from the pending screen

## Google Drive

- **Account:** info@ethossustainability.org
- **App role:** Stores metadata and Drive URLs only — no file content in database
- **File permissions:** Handled at Google Drive level, not in app
- **Categories:** Project files (linked to a project) and Universal files (org-wide)

## Supabase Free Tier Assessment

- **Storage:** ~15–20MB estimated for 500 users. Free tier limit: 500MB. Comfortable.
- **Bandwidth:** 5GB/month egress. Fine for 500 users.
- **Concurrent connections:** 60 on free tier. Unlikely to hit with non-simultaneous usage.
- **Verdict:** Free tier supports Ethos comfortably until 2,000–3,000 active users.
- **Cold start:** Free tier database can pause during inactivity — slight delay on first request. Upgrade to Pro ($25/month) eliminates this.

## Monitoring

- System errors logged to system_logs table in database
- Board sees all unresolved logs in admin dashboard
- Supabase dashboard for database health, usage, and auth logs
- Each service (Resend, OpenSign, Slack) has its own dashboard — set alerts at 70% of limits
- No external aggregation tool needed at current scale

## Error Handling Per Integration

| Integration | Failure behavior |
|---|---|
| Supabase (DB down) | Branded maintenance screen — no raw errors shown to users |
| Google SSO fails | Email fallback shown. If both fail, clear retry message. |
| OpenSign down | Onboarding step shows "temporarily unavailable" — user not blocked permanently |
| Slack OAuth fails | User can skip and reconnect later. Reminder sent via email. |
| Slack webhook fails | Announcements show last synced state with "last updated X ago" indicator. Fails silently to user. |
| Resend fails | Retry up to 3 times. After 3 failures Board alerted. Action still completes in app — email failure does not block workflow. |
| Google Drive unreachable | File metadata shows but download links show "temporarily unavailable." No full tab failure. |

## Cost Summary (500 members)

| Service | Cost |
|---|---|
| Supabase | Free (upgrade to Pro $25/month if needed) |
| Vercel | Free tier |
| Resend | Free tier (3,000 emails/month) |
| OpenSign | Free |
| Google Drive | Included in Google Workspace |
| Slack Pro nonprofit | $250/month at 500 members |
| **Total** | **~$250/month** |
