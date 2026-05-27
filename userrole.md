# User Roles And Access Levels

This document explains what each user role can do in the platform, how much access each level has, and what kind of work the user is expected to perform.

## Role Structure

The platform is built around a simple role hierarchy:

1. Public Visitor
2. Student
3. Faculty
4. Admin

Each level adds more access, more control, and more responsibility.

## 1. Public Visitor

### Who this is

A public visitor is someone who has not signed in yet. This is the first level of access and is limited to open pages only.

### What the user can do

- View the home page and institutional branding.
- Read public content and public-facing information.
- Explore the public journal area when available.
- Move through the visible marketing and introduction sections of the site.

### What the user cannot do

- Cannot access the dashboard.
- Cannot create or edit research records.
- Cannot manage profile data.
- Cannot use admin or faculty tools.

### Access level summary

This is a read-only level. It is meant for discovery, awareness, and public presentation of the institution.

## 2. Student

### Who this is

A student is a logged-in user who belongs to the lowest authenticated level of the platform.

### What the user can do

- Sign in and access the dashboard after profile completion.
- Complete the profile setup screen with name, bio, department, phone, and image.
- View student-allowed research records.
- Create and manage records where student participation is supported.
- Participate in book chapters, journals, conferences, patents, certificates, and grant-in records where applicable.
- See grant entries where the student is linked as an author or participant.

### What the user works on

- Personal academic and research contributions.
- Record submission and viewing.
- Keeping profile data updated.
- Tracking participation in institution research work.

### What the user cannot do

- Cannot manage admin-only special user access.
- Cannot see restricted admin control screens.
- Cannot act as a full system manager.

### Access level summary

This is a contributor level. Students can enter and maintain their own academic activity, but only within the permissions assigned to them.

## 3. Faculty

### Who this is

A faculty user is a higher-level authenticated user with broader academic control than a student.

### What the user can do

- Sign in and access the protected faculty area.
- Complete onboarding and profile setup like any other user.
- Manage faculty-related records across the platform.
- Create, edit, and review book chapters.
- Create, edit, and review journals.
- Create, edit, and review conferences.
- Create, edit, and review patents.
- Manage FDP records.
- Participate in grant-in projects as PI, Co-PI, or faculty author.
- View grant data from the sidebar and dashboard context.

### What the user works on

- Research supervision and academic publishing.
- Record approval or preparation work for institutional reporting.
- Grant participation and funding-related academic activity.
- Supporting student-linked research work.

### What the user cannot do

- Cannot manage special-user administration.
- Cannot override admin access rules.
- Cannot access the highest system control layer.

### Access level summary

This is a power-user level. Faculty users can handle more research and academic content and are generally responsible for guided academic output.

## 4. Admin

### Who this is

An admin is the highest-level user in the platform and has the widest access across the system.

### What the user can do

- Access all protected admin sections.
- Add, update, list, and remove special users.
- Assign roles to users before or after signup through the special-user system.
- View all research data across modules.
- See institution-wide grants and statistics.
- Manage access control for users and roles.
- Monitor the overall platform from a central control point.

### What the user works on

- Access administration.
- User and role management.
- System-wide research oversight.
- Institutional governance and data visibility.
- Correcting or maintaining special access mapping.

### What the user cannot do

- Admins are not blocked by role permissions inside the platform unless a feature is unfinished or intentionally restricted by business rules.

### Access level summary

This is the control level. Admin users can see the broadest view of the system and manage the platform structure itself.

## Role Progression View

The platform behaves like a layered access system:

- Public Visitor: can only view public content.
- Student: can work with personal academic and research records.
- Faculty: can manage wider academic work and grant participation.
- Admin: can manage the whole system, roles, and access rules.

## How Role Assignment Works

The platform uses both authentication and role resolution:

- If a user signs in without a special user mapping, the default role is usually Student.
- If the email exists in the special-user table, the assigned role is applied.
- If the user is marked as incomplete, the system redirects them to complete the profile first.
- The proxy layer then decides which dashboard or page the user is allowed to see.

## Client-Friendly Summary

The platform is designed so each user level sees only the work they need to handle. Visitors see the public face of the website, students handle their own academic records, faculty manage broader research work, and admins control access and system-wide visibility. This keeps the application secure, organized, and easy to understand.