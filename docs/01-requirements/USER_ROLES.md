# User Roles and Permissions (P01-03)

**Task:** P01-03 · **Owner:** TPM / QA Lead (Product Manager / Requirements Analyst role) · **Last updated:** 2026-11-12 · **Status:** Awaiting Review (user walkthrough at P01-07)
**Companion documents:** [REQUIREMENTS_SPECIFICATION.md](REQUIREMENTS_SPECIFICATION.md) · [BUSINESS_RULES.md](BUSINESS_RULES.md) · [USER_JOURNEYS.md](USER_JOURNEYS.md) · [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
**Sources:** [PROJECT_ASSESSMENT.md §3](../00-project-assessment/PROJECT_ASSESSMENT.md#3-user-roles), reverse-engineering [04](../reverse-engineering/04-user-journeys.md) and [05 §2](../reverse-engineering/05-api-inventory.md), [DECISION_LOG.md](../DECISION_LOG.md) (D-02, D-03).

---

## 1. Principles

1. **One account model.** Designer, employer and hirer are **capabilities** of a normal member account, not separate sign-up types. This follows the reference product, where one account does both and the homepage only toggles content [Observed, assessment §3].
2. **Teams are accounts without credentials.** A team is an account of type `team`; people act for it through a team membership role (BR-57). Nobody signs in "as" a team.
3. **Deny by default.** Every mutation has an explicit authorization rule and a rate-limit class (BR-76; workflow rule 1.1a-15). Anything not allowed in the matrix below is denied.
4. **Server-side enforcement.** Hiding a control is a usability measure only. The server checks every rule again, because Server Actions are public POST endpoints (risk R-20).
5. **Releases.** A permission exists only from the release that ships its feature (D-02). Before that, the control is not rendered (BR-45).
6. **Admin and moderator are a proposal.** They were never observed on the reference product. §5 defines a minimal capability for R1/R2, and its approval is open question **OQ-04**.

---

## 2. Roles

| Role | Who | How the role is obtained | Evidence |
|---|---|---|---|
| **Visitor** | Anyone without a session | Default | Observed (all reverse-engineering was done as a visitor) |
| **Pending member** (state) | Signed in, no username yet | Verified an email code or Google sign-in but has not finished onboarding (BR-16) | Clone decision (D-02 minimal username step) |
| **Member** | Signed-in, onboarded user | Completed onboarding (username + display name) | Observed (auth UI); post-login behaviour unverified |
| **Designer** (capability) | Member who publishes shots | Publishing a first shot (R2). In R1 only seed accounts have shots | Inferred (`forHire`, uploader gated) |
| **Employer** (capability) | Member who posts jobs | Posting a first job (R2) | Observed job form; submission unverified |
| **Team owner** | The one member who controls a team | Creating a team, or receiving ownership by transfer (R2) | Clone decision (roles inferred in doc 06) |
| **Team admin** | Member who manages a team | Promotion by the owner (R2) | Clone decision |
| **Team member** | Member who publishes for a team | Accepting an invitation (R2) | Observed (Members tab, "X for Team"); administration unverified |
| **Moderator** (proposal) | Platform staff handling reports | Granted by the operator through a server-side script (BR-67) | Clone decision (proposal) |
| **Admin** (proposal) | Platform operator | Granted by the operator through a server-side script (BR-67) | Clone decision (proposal) |
| **Suspended** (state) | Any account under suspension | Moderator or admin action (BR-25) | Clone decision |
| **System** | Scheduled jobs (popularity, reconciliation, clean-up) | Host cron with a secret; not a person (D-11) | Clone decision |

Pro subscribers, advertisers and the vetted-designer programme exist on the reference product but belong to **Later** (payment approval). The renamed **Featured Studio** badge is a profile attribute set by an admin (OQ-27); it is not a role and grants no permissions.

---

## 3. Permission matrix (R1–R3)

**Legend:** ✔ allowed · ✖ denied · **own** = only on resources the user owns (see §4) · **gate** = the control is shown and opens the auth-gate modal with `intent` + `returnTo` (FR-15) · **login** = page redirects to `/login?returnTo=` (BR-17) · — = not applicable.
**Columns:** V = Visitor · PM = Pending member · M = Member (includes the designer and employer capabilities) · TM = Team member · TA = Team admin · TO = Team owner · Mod = Moderator · Adm = Admin. Team columns apply to the team's resources; for anything else these users have Member rights. Moderators and admins also have every Member right. Suspended accounts have no session and so get Visitor rights, except that sign-in is refused.

### 3.1 R1

| Resource / action | Rel. | V | PM | M | TM | TA | TO | Mod | Adm | Rule |
|---|---|---|---|---|---|---|---|---|---|---|
| View homepage, feeds, filters, shot detail, related shots | R1 | ✔ | ✖ (redirect to onboarding) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-16, BR-37 |
| View profiles (Work, About), search, tags | R1 | ✔ | ✖ (redirect) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-16 |
| Share a shot; open Details modal | R1 | ✔ | ✖ (redirect) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-44 |
| Have a view counted | R1 | ✔ | — | ✔ (not on own shots) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-29 |
| Like / unlike a shot | R1 | gate | ✖ | ✔ (not own) | ✔ (not own) | ✔ | ✔ | ✔ | ✔ | BR-46 |
| Request / verify sign-in code; Google sign-in | R1 | ✔ | — | — | — | — | — | — | — | BR-01–BR-11 |
| Complete onboarding (choose username + display name) | R1 | login | ✔ | ✖ (already done) | — | — | — | — | — | BR-16, BR-18–BR-22 |
| Sign out | R1 | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-13 |
| Request account deletion (on request in R1) | R1 | ✖ | ✔ | ✔ | ✔ | ✔ | ✔ (after transfer) | ✔ | ✔ | BR-24 |
| View a hidden shot or a suspended profile | R1 | ✖ (404) | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✔ | BR-68 |
| Hide / unhide a shot (script or admin-only action) | R1 | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✔ | BR-68 |
| Suspend / unsuspend a user | R1 | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ (not admins) | ✔ | BR-25, BR-68 |
| Grant / revoke moderator or admin | R1 | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Operator script only | BR-67 |
| Set the Featured Studio badge | R1 | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ (script) | OQ-27 |

### 3.2 R2

| Resource / action | Rel. | V | PM | M | TM | TA | TO | Mod | Adm | Rule |
|---|---|---|---|---|---|---|---|---|---|---|
| Open upload page `/uploads/new` | R2 | login | ✖ (onboarding) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-17 |
| Upload media; create draft; publish shot | R2 | ✖ | ✖ | ✔ (within quotas) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-61–BR-66 |
| Attribute own shot to a team | R2 | ✖ | ✖ | ✖ | ✔ | ✔ | ✔ | — | — | BR-59 |
| Edit / delete a shot | R2 | ✖ | ✖ | own | own | own + remove team attribution from team shots | own + remove team attribution | hide only | hide only | BR-60, BR-65 |
| View a draft | R2 | ✖ (404) | ✖ | own | own | own | own | ✖ | ✖ | BR-65 |
| Like a comment | R2 | gate | ✖ | ✔ (not own) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-52 |
| Read comments | R2 | ✔ | ✖ (redirect) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-49 |
| Post comment / reply | R2 | gate | ✖ | ✔ (unless disabled) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-48, BR-51 |
| Edit own comment (15 min) / delete own comment | R2 | ✖ | ✖ | own | own | own | own | own | own | BR-50 |
| Delete any comment on a shot | R2 | ✖ | ✖ | own shots | own shots | own + team shots | own + team shots | hide | hide | BR-50, BR-68 |
| Disable comments on a shot | R2 | ✖ | ✖ | own shots | own shots | own + team shots | own + team shots | ✖ | ✖ | BR-51 |
| Save a shot to a collection | R2 | gate | ✖ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-55 |
| Create / rename / delete a collection; change privacy | R2 | ✖ | ✖ | own | own | own | own | hide only | hide only | BR-53, BR-54 |
| View a public collection | R2 | ✔ | ✖ (redirect) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-54 |
| View a private collection | R2 | ✖ (404) | ✖ | own | own | own | own | ✖ | ✖ | BR-54 |
| Follow / unfollow | R2 | gate | ✖ | ✔ (not self) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-56 |
| View followers / following lists | R2 | ✔ | ✖ (redirect) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-56 |
| View Liked Shots tab `/:username/likes` | R2 | login | ✖ | own only (others: 404) | own | own | own | own | own | BR-17, FR-57 |
| Edit own profile; settings; change username | R2 | login | ✖ | own | own | own | own | own | own | BR-23 |
| Delete own account (self-service) | R2 | ✖ | ✔ | own | own | own | after transferring ownership | own | own | BR-24 |
| Create a team | R2 | ✖ | ✖ | ✔ (≤ 10 teams) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-57 |
| Edit team profile | R2 | ✖ | ✖ | ✖ | ✖ | ✔ | ✔ | hide only | hide only | BR-58 |
| Invite / remove team members | R2 | ✖ | ✖ | ✖ | ✖ | ✔ (not the owner or other admins) | ✔ | ✖ | ✖ | BR-58 |
| Promote / demote admins; transfer ownership; delete team | R2 | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ | ✖ | BR-58 |
| Accept / decline a team invitation; leave a team | R2 | ✖ | ✖ | own invitations | leave | leave | ✖ (transfer first) | — | — | BR-58 |
| View job board and job detail | R2 | ✔ | ✖ (redirect) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-75 |
| Apply to a job (external link) | R2 | ✔ | ✖ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-74 |
| Post a free job | R2 | gate (`post-job`) | ✖ | ✔ (≤ 3 active) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-71, BR-73 |
| Edit / close a job | R2 | ✖ | ✖ | own | own | own | own | hide only | hide only | BR-73 |
| Report content | R2 | gate | ✖ | ✔ (not own) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-69 |
| View report queue; hide/unhide comments, collections, jobs; dismiss reports | R2 | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✔ | BR-68 |

### 3.3 R3

| Resource / action | Rel. | V | PM | M | TM | TA | TO | Mod | Adm | Rule |
|---|---|---|---|---|---|---|---|---|---|---|
| Receive and read notifications | R3 | login | ✖ | own | own | own | own | own | own | BR-83 |
| Block / unblock a user | R3 | gate | ✖ | ✔ (not self) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-81 |
| Start a conversation ("Get in touch") | R3 | gate (`message-user`) | ✖ | ✔ (unless blocked) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-82 |
| Read / reply in a conversation | R3 | login | ✖ | participant only | participant | participant | participant | ✖ (no access to message content) | ✖ | BR-82 |
| Message a team | R3 | gate | ✖ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Delivered to owner and admins (OQ-17) |
| View hire directory and services | R3 | ✔ | ✖ (redirect) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Create / edit / delete a service listing | R3 | ✖ | ✖ | own | own | team listings | team listings | hide only | hide only | BR-84 |
| "Hire Now" / "Request service" (opens a message) | R3 | gate | ✖ | ✔ (not own) | ✔ | ✔ | ✔ | ✔ | ✔ | BR-84 |
| Colour search | R3 | ✔ | ✖ (redirect) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-80 |
| Give / withdraw cookie consent | R3 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | BR-85 |

### 3.4 Gated actions from reverse-engineering doc 04

Every gated action observed in [doc 04](../reverse-engineering/04-user-journeys.md) has an explicit rule:

| Gated action (doc 04) | Observed gate on the reference | Clone rule | Release |
|---|---|---|---|
| Like (card or shot page) | Sign-up modal, `intent=like-shot` | Visitor: gate; pending member: onboarding; member: allowed except own shot (BR-46) | R1 |
| Save (bookmark) | Sign-up modal, `data-context="bucket-shot"` | Gate (`save-shot`); member allowed (BR-55) | R2 (hidden in R1) |
| Comment (write) | Panel; write needs an account | Gate (`comment-shot`); member allowed unless disabled (BR-51) | R2 (hidden in R1) |
| Follow | Sign-up modal (inferred) | Gate (`follow-user`); no self-follow (BR-56) | R2 (hidden in R1) |
| Get in touch (message) | Sign-up modal, `data-context="message-user"` | Gate (`message-user`); blocked users cannot message (BR-81, BR-82) | R3 (hidden in R1–R2) |
| Hire Now / Request service | Sign-up modal, `intent=request-service` | Gate; opens a message, no checkout (BR-84) | R3 |
| Liked Shots tab `/:username/likes` | 302 to login | Login redirect; owner only (FR-57) | R2 |
| Upload `/uploads/new` | 302 to login | Login redirect (BR-17) | R2 |
| Post a job (submission) | Form public, submission unverified | Form visible; submitting needs sign-in via gate `post-job` (BR-73) | R2 |
| Project brief, brief board, proposals, Pro | Pro or payment gates | Not built (Later, payment approval) | Later |

---

## 4. Ownership rules

| ID | Resource | Owner | Rule |
|---|---|---|---|
| OWN-01 | Account and profile | The account holder | Only the holder edits the profile, settings and username, or deletes the account. Admins can suspend but not edit it (BR-25). |
| OWN-02 | Shot | Its individual author | Only the author edits, deletes or publishes it and manages its blocks, tags and category. For a team shot, the team owner/admin can also remove the team attribution and disable comments (BR-60). Ownership never transfers. |
| OWN-03 | Team | The team owner | Exactly one owner (BR-57). Ownership transfers only to an existing admin or member who accepts. The team is deleted only by the owner; its shots keep their individual authors and lose the attribution. |
| OWN-04 | Comment | Its author | The author edits (within 15 min) and deletes it. The shot author deletes comments on their shot. Moderators hide (BR-50, BR-68). |
| OWN-05 | Collection and its items | The collection owner | Only the owner adds, removes, renames, deletes it and changes privacy. Saving does not give rights over the shot (BR-53–BR-55). |
| OWN-06 | Like, follow, save | The acting user | Only that user can remove it. Removing is idempotent (BR-26). |
| OWN-07 | Media upload | The uploader | Can be attached only to the uploader's own shots. Unattached uploads expire after 24 h (BR-66). |
| OWN-08 | Job post | The posting member | Only the poster edits or closes it. Company details belong to the post, not to a separate company account in R2 (BR-71, BR-73). |
| OWN-09 | Report | The reporter | The reporter cannot see or edit reports after submitting. Moderators resolve them (BR-69). |
| OWN-10 | Conversation (R3) | Its participants | Only participants can read it; leaving hides it for that participant only (BR-82). |
| OWN-11 | Service listing (R3) | Its seller (individual or team) | Same model as shots: the creator edits; team owner/admin manage team listings (BR-84). |

---

## 5. Moderation proposal

The reference product's staff tools were never observed. The clone has user-generated content from R2 onwards (shots, comments, collections, jobs) and user-chosen names from R1, so a **minimal** capability is proposed. It deliberately avoids an admin console. Approval is **OQ-04**; the workflow currently has no tasks for this work, so the lead would add the P09/P10 items after approval.

| Capability | Release | Form | Notes |
|---|---|---|---|
| Grant moderator/admin roles | R1 | Operator script only | BR-67. No UI. |
| Suspend / unsuspend a user | R1 | Script or admin-only Server Action; no public UI | BR-25, BR-68. Covers abusive usernames, the only user-generated text in R1 |
| Hide / unhide a shot | R1 | Script or admin-only Server Action | BR-68. R1 content is seed data, so this is a safety net |
| Audit log of every moderation action | R1 | Table written by every action | BR-68. Retained 2 years (BR-79) |
| Account deletion on request | R1 | Operator script | BR-24 |
| Report button on shot, comment, profile, collection, job | R2 | Member UI | BR-69 |
| Report queue with Hide / Dismiss / Suspend actions | R2 | One minimal protected page `/admin/reports` (moderators and admins only) | BR-68, BR-69. No analytics, no bulk tools |
| Content policy text | R2 | Terms page | BR-70, OQ-05 |

Out of scope unless separately approved: automated content scanning, appeal workflows, user-visible strikes, IP bans, a full admin console, category management UI (categories are fixed, BR-36).
