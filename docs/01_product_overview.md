# Ethos App — Product Overview

## What It Is

The Ethos app is the central volunteer management platform for Ethos Sustainability. It handles the full lifecycle of a volunteer — discovery, onboarding, project work, communication, and recognition — in one place.

## Organization Structure

### Chapters
- Ethos operates through geographic chapters (e.g. Ethos Denton, Ethos Dallas)
- Each chapter is autonomous, run by a Chapter Head
- Chapter Heads have the same app permissions as Project Leads — they are not a separate role
- A volunteer belongs to one chapter permanently

### HQ
- HQ is a separate entity that runs org-wide projects
- HQ teams: Media, Newsletter, Business, STEM, Funding, Finance, CS
- HQ teams map to project categories used when listing HQ projects
- HQ projects can pull volunteers from any chapter

### Board of Directors
- Has ultimate authority over the entire organization
- Has universal access to everything in the app — no restrictions
- Small group of real people

## User Base

- All volunteers are minors, ages 14–17
- Minimum age: 14
- Maximum age: 17 (accounts persist if a member turns 18)
- ~500 users anticipated, not all simultaneously active

## Core User Journey

1. New user signs in with Google
2. Sees project board scoped to their location
3. Applies to one project
4. Completes one-time onboarding (Slack, orientation, waiver, parental consent)
5. Project Lead reviews and approves or rejects
6. If approved: full app unlocks, scoped to their chapter and assigned project
7. As a general member: can apply to additional projects (max 3 active, 3 pending)

## HQ Project Rule
- If a volunteer joins an HQ project, that is their only active project
- They cannot simultaneously hold a chapter project and an HQ project

## Project Visibility Rules
- Members see their own chapter's projects
- Members see open calls from nearby chapters
- Members see open calls from HQ (remote or nearby)
- All open calls are tagged as such with an application level (Full App, Mid App, No App)

## Tech Stack (Confirmed)

| Layer | Tool |
|---|---|
| Frontend + backend logic | Next.js |
| Database + auth + realtime | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Email | Resend |
| Document signing | OpenSign (embedded in-app, Option B) |
| File storage | Google Drive (info@ethossustainability.org) |
| Communication | Slack (all members required) |
| Announcements sync | Slack → app, one-way |

## Brand

- **Colors:** Cream (#FFFBF4), Sand (#D4CCC4), Warm Gray (#A89E94), Brown Mid (#7D6F63), Brown Dark (#514033), Peach Light (#FFE2D6), Peach (#FCBD9D), Espresso (#413429)
- **Logo:** Ethos insignia mark + "ethos / SUSTAINABILITY" wordmark
- **Tone:** Warm, earthy, community-feeling. Celebratory but understated.
- **Contact:** +1 (817) 631-0222 · info@ethossustainability.org

## Platform
- Web only (responsive, mobile browser supported)
- No native iOS or Android app at this stage
