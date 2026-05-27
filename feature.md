# Platform Features

This document lists the features available in the platform, grouped by user role, and shows the current implementation stage of each feature.

## Stage Legend

- `completed properly` - feature is built, connected, and working as expected.
- `completed with bug` - feature exists, but there is a visible issue or mismatch.
- `only backend` - API or database logic exists, but no finished UI is connected.
- `only frontend` - UI exists, but it is using static or placeholder data.
- `frontend-backend not connected` - both sides exist, but they are not wired together correctly.
- `nothing done` - feature is not present yet.

## Public Visitor Features

| Feature | What it does | Stage |
|---|---|---|
| Home landing page | Shows the institutional brand, hero section, about section, achievements, image carousel, and footer. | completed properly |
| Public navigation experience | Lets visitors browse the public site without signing in. | completed properly |
| Public journal route | Public journal page exists, but it currently shows a placeholder and is not fully wired to the API. | frontend-backend not connected |
| Public journal API | Exposes public journal data through API routes. | only backend |

## Student Features

| Feature | What it does | Stage |
|---|---|---|
| Student dashboard access | Logged-in students can enter the dashboard area after auth and profile checks. | completed properly |
| Profile setup | Collects name, bio, department, phone, and profile image during onboarding. | completed properly |
| Profile image upload | Uploads profile images through Appwrite and stores the returned URL. | completed properly |
| Book chapter access | Students can view and manage book chapter records they are allowed to see. | completed properly |
| Certificate access | Students can view and manage certificate records they are allowed to see. | completed properly |
| Journal access | Students can manage journal entries based on ownership and public visibility. | completed properly |
| Conference access | Students can manage conference records based on ownership and public visibility. | completed properly |
| Patent access | Students can manage patent records based on ownership and public visibility. | completed properly |
| Grant-in participation | Students can appear as student authors in grant-in records and see related grant data. | completed properly |

## Faculty Features

| Feature | What it does | Stage |
|---|---|---|
| Faculty dashboard access | Logged-in faculty can enter the dashboard and faculty-protected pages. | completed properly |
| Special role resolution | Faculty role can be assigned through the SpecialUser seed or admin panel. | completed properly |
| FDP management | Faculty and admins can manage FDP records. | completed properly |
| Book chapter management | Faculty can manage book chapter records and author mapping. | completed properly |
| Certificate management | Faculty can manage certificate records and stats. | completed properly |
| Journal management | Faculty can manage journal records, status, and authorship. | completed properly |
| Conference management | Faculty can manage conference records and authorship. | completed properly |
| Patent management | Faculty can manage patent records and authorship. | completed properly |
| Grant-in management | Faculty can create and manage grants, including PI and Co-PI roles. | completed properly |
| Grant sidebar visibility | Faculty see their grant list in the dashboard sidebar. | completed properly |

## Admin Features

| Feature | What it does | Stage |
|---|---|---|
| Admin dashboard access | Admin can access all protected admin areas. | completed properly |
| Special users management | Admin can add, update, list, and delete special users by email and role. | completed properly |
| Role assignment control | Admin can pre-assign roles before signup or override access rules through special users. | completed properly |
| Full research visibility | Admin can view all records across research modules. | completed properly |
| Grant-in admin view | Admin can see all grants and use grant statistics across the institution. | completed properly |
| User search API | Backend support exists for searching users by role, name, and email. | only backend |

## Shared Platform Features

| Feature | What it does | Stage |
|---|---|---|
| Authentication system | Supports sign in, sign up, session handling, and protected routes. | completed properly |
| Email verification flow | Prevents unverified users from continuing until verification is complete. | completed properly |
| Password reset flow | Supports forgot-password and reset-password flows. | completed properly |
| Route protection | `proxy.ts` enforces role-based access and profile completion checks. | completed properly |
| Special user seed | Automatically creates the default faculty special user for `velocium.iot@gmail.com`. | completed properly |
| Stats endpoints | Research modules expose stats endpoints for charts and analytics. | completed properly |
| Export actions | Several modules include export routes for downloadable data. | completed properly |
| Bill upload and verification | Grant-in records support bill upload, bill retrieval, and bill verification. | completed properly |
| Sidebar caching | Grant sidebar uses cached data to reduce repeated database calls. | completed properly |
| Dashboard summary cards | Dashboard home currently shows static sample numbers instead of live project metrics. | completed with bug |

## Known Gaps And Partial Areas

| Feature | Current state | Stage |
|---|---|---|
| Public journal page UI | The route exists, but the page is still a placeholder. | frontend-backend not connected |
| Dashboard home metrics | The dashboard landing cards are demo-style values and should be tied to live data. | completed with bug |
| Some admin screens duplicate the same special-user workflow | There are multiple screens for special users, which can confuse the admin flow. | completed with bug |
| Some backend routes are support-only | A few API routes exist without a polished user-facing screen. | only backend |

## What Can Be Added Next

| Suggested feature | Why it would help | Suggested stage |
|---|---|---|
| Real dashboard KPIs | Replace demo counts with live institution metrics. | not started |
| Unified public journal page | Connect the public journal route to a real listing and detail view. | not started |
| Notifications | Alert users about approvals, rejections, and pending actions. | not started |
| Approval workflow | Add reviewer and approver steps for research records. | not started |
| Audit logs | Track who created, updated, or deleted records. | not started |
| Role-specific dashboards | Create cleaner views for student, faculty, and admin instead of shared screens. | not started |
| Advanced search and filters | Make records easier to find across all modules. | not started |
| Reports and exports dashboard | Add a single report center for PDFs, CSVs, and summaries. | not started |
| Activity timeline | Show recent actions for each user and department. | not started |
| Multi-step approval notifications | Let admins and faculty see pending tasks in one place. | not started |

## Short Client Summary

The platform already supports authentication, role-based access, profile onboarding, special-user role assignment, and multiple research-management modules. The strongest current areas are the secured dashboard, grant-in workflow, and admin special-user control. The main visible gaps are the public journal page connection and a few demo-style dashboard elements that should be tied to live metrics.