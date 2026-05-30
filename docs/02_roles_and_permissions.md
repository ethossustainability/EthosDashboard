# Ethos App — Roles & Permissions

## The Three Roles

### Member
- Standard approved volunteer
- Belongs to one chapter
- Can hold max 3 active projects and 3 pending applications simultaneously
- If on an HQ project, that is their only active project

### Project Lead
- Can create and manage projects
- Manages only their own projects (cannot see or edit other Project Leads' projects)
- Chapter Heads are Project Leads scoped to their chapter — same permissions, different org title
- HQ Project Leads run HQ-level projects — same app role
- Promoted manually by Board (org_role_id updated on user record)

### Board
- Universal access to everything in the app — no restrictions
- Supersedes all other roles on any action
- Can promote or demote any member to any role
- Referred to as "Admin" in the data model (org_roles table value will be updated to "Board")

## Scope Rules

| Role | Project scope | Member scope | Chapter scope |
|---|---|---|---|
| Member | Own projects only | Own profile + directory | Own chapter |
| Project Lead | Own projects only | All members in their project | Own chapter (or HQ) |
| Board | All projects, all chapters | All members org-wide | All chapters + HQ |

## Per-Feature Permissions

### Projects

| Action | Member | Project Lead | Board |
|---|---|---|---|
| View own chapter's projects | ✅ | ✅ | ✅ |
| View all org projects | ❌ | ❌ | ✅ |
| Create a project | ❌ | ✅ | ✅ |
| Edit own project | ❌ | ✅ | ✅ |
| Edit any project | ❌ | ❌ | ✅ |
| Delete any project | ❌ | ❌ | ✅ |
| Publish a project (make it public) | ❌ | ✅ (own) | ✅ |
| Set project as Open Call | ❌ | ✅ (own) | ✅ |
| Close a project | ❌ | ✅ (own) | ✅ |
| Reopen a closed project | ❌ | ❌ | ❌ |
| Request budget | ❌ | ✅ (own) | ✅ |
| Set allocated budget | ❌ | ❌ | ✅ |

### Applications

| Action | Member | Project Lead | Board |
|---|---|---|---|
| Submit an application | ✅ | ✅ | ✅ |
| Withdraw own pending application | ✅ | ✅ | ✅ |
| View applications to own project | ❌ | ✅ | ✅ |
| View applications to any project | ❌ | ❌ | ✅ |
| Approve/reject own project's applications | ❌ | ✅ | ✅ |
| Approve/reject any application | ❌ | ❌ | ✅ |
| Provide rejection reason | ❌ | ✅ | ✅ |
| Assign role on approval | ❌ | ✅ (own) | ✅ |
| Reassign role post-approval | ❌ | ✅ (own) | ✅ |

### Tasks

| Action | Member | Project Lead | Board |
|---|---|---|---|
| View all tasks on own project | ✅ | ✅ | ✅ |
| View tasks on any project | ❌ | ❌ | ✅ |
| Update status of own assigned task | ✅ | ✅ | ✅ |
| Create a task | ❌ | ✅ (own project) | ✅ |
| Assign a task to a member | ❌ | ✅ (own project) | ✅ |
| Reassign a task | ❌ | ✅ (own project) | ✅ |
| Edit a task (including completed) | ❌ | ✅ (own project) | ✅ |
| Delete a task (including completed) | ❌ | ✅ (own project) | ✅ |

### Files

| Action | Member | Project Lead | Board |
|---|---|---|---|
| View all files in app | ✅ | ✅ | ✅ |
| Add a file reference to the app | ❌ | ✅ | ✅ |
| Add a universal (org-wide) file | ❌ | ❌ | ✅ |
| Remove a file reference | ❌ | ✅ (own project) | ✅ |

### Badges

| Action | Member | Project Lead | Board |
|---|---|---|---|
| View own badges | ✅ | ✅ | ✅ |
| View others' badges (via directory) | ✅ | ✅ | ✅ |
| Create a new badge type | ❌ | ❌ | ✅ |
| Award a participation badge | ❌ | ✅ (own project volunteers) | ✅ |
| Award an achievement badge (incl. VOTY) | ❌ | ❌ | ✅ |

### Badge Categories
- **Participation badges** — tied to a specific major project or event (e.g. Ethos Conf '25). Awarded by Project Lead on completion.
- **Achievement badges** — org-wide recognition for unique accomplishments. Awarded by Board only. VOTY falls here.
- Both categories display on the member's directory profile, potentially in separate sections.
- Badge type creation: Board now, CS HQ team eventually (permission handoff, no schema change needed).

### Directory

| Action | Member | Project Lead | Board |
|---|---|---|---|
| View all member profiles | ✅ | ✅ | ✅ |
| Edit own bio | ✅ | ✅ | ✅ |
| Hide own profile | ❌ | ❌ | ❌ |
| Edit any member's profile | ❌ | ❌ | ✅ (via database, not UI feature) |

### Fundraising

| Action | Member | Project Lead | Board |
|---|---|---|---|
| View donations, contacts, partners | ✅ | ✅ | ✅ |
| Add/edit/delete donations | ❌ | ❌ | ✅ |
| Add/edit/delete contacts | ❌ | ❌ | ✅ |
| Note: Fundraising HQ team lead will eventually take over add/edit/delete permissions (Board updates role, no schema change) | | | |

### Announcements

| Action | Member | Project Lead | Board |
|---|---|---|---|
| View announcements in app | ✅ | ✅ | ✅ |
| Post in #announcements Slack channel | ❌ | ✅ | ✅ |
| Note: Announcements sync one-way from Slack to app. Only certain roles can post in #announcements. | | | |

### Notifications

| Action | Member | Project Lead | Board |
|---|---|---|---|
| Receive in-app notifications | ✅ (always on) | ✅ (always on) | ✅ (always on) |
| Toggle email per event type | ✅ | ✅ | ✅ |
| Toggle Slack per event type | ✅ | ✅ | ✅ |
| Disable both email and Slack for an event | ❌ | ❌ | ❌ |
| Note: In-app notifications are always on for everyone. Email and Slack are the only toggleable channels. | | | |

### Member Management

| Action | Member | Project Lead | Board |
|---|---|---|---|
| Promote a member to Project Lead | ❌ | ❌ | ✅ |
| Demote a Project Lead to Member | ❌ | ❌ | ✅ |
| Set any member's role | ❌ | ❌ | ✅ |
| Link Ethos email to a user account | ❌ | ❌ | ✅ |

### System

| Action | Member | Project Lead | Board |
|---|---|---|---|
| View system logs / integration errors | ❌ | ❌ | ✅ |
| Mark errors as resolved | ❌ | ❌ | ✅ |

## Slack Access

| Role | Slack workspace access |
|---|---|
| Member | ✅ Required — all approved members |
| Project Lead | ✅ |
| Board | ✅ |

- All approved members are added to the Ethos Slack workspace
- Chapter officers, HQ project members, board, and leads have access to officer-level channels
- General members have access to chapter and project channels

## Notes
- Chapter Heads are Project Leads in the app — no separate role or permissions
- HQ Project Leads are Project Leads in the app — no separate role
- "Admin" in the current data model (org_roles) should be renamed to "Board"
- Board editing member profiles is not a UI feature — done directly via Supabase dashboard
