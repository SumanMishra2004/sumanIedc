// Role-based dashboard sidebar config.
// Hiding a link is UI only. Enforce the same rules in middleware and in every API route.

export type Role = "STUDENT" | "FACULTY" | "EDITOR" | "ADMIN" | "SUPERADMIN";

export type BadgeKey =
  | "unreadNotifications"
  | "pendingReviews"
  | "pendingBills"
  | "pendingVerifications";

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  /** lucide-react icon name */
  icon: string;
  roles: Role[];
  badge?: BadgeKey;
  children?: NavChild[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const ALL: Role[] = ["STUDENT", "FACULTY", "EDITOR", "ADMIN", "SUPERADMIN"];
const AUTHORS: Role[] = ["STUDENT", "FACULTY"];
const FACULTY_ONLY: Role[] = ["FACULTY"];
const STAFF: Role[] = ["EDITOR", "ADMIN", "SUPERADMIN"];
const ADMINS: Role[] = ["ADMIN", "SUPERADMIN"];
const SUPER: Role[] = ["SUPERADMIN"];

export const SIDEBAR: NavSection[] = [
  {
    title: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ALL },
      {
        label: "Notifications",
        href: "/dashboard/notifications",
        icon: "Bell",
        roles: ALL,
        badge: "unreadNotifications",
      },
      { label: "Events", href: "/dashboard/events", icon: "CalendarDays", roles: ALL },
      { label: "My Profile", href: "/dashboard/profile", icon: "User", roles: ALL },
    ],
  },
  // ── STUDENT + FACULTY ─────────────────────────────────────
  {
    title: "My Research",
    items: [
      { label: "Journals", href: "/dashboard/research/journals", icon: "BookOpen", roles: AUTHORS },
      { label: "Conferences", href: "/dashboard/research/conferences", icon: "Presentation", roles: AUTHORS },
      { label: "Book Chapters", href: "/dashboard/research/book-chapters", icon: "Book", roles: AUTHORS },
      { label: "Patents", href: "/dashboard/research/patents", icon: "Lightbulb", roles: AUTHORS },
      { label: "Copyrights", href: "/dashboard/research/copyrights", icon: "Copyright", roles: AUTHORS },
    ],
  },
  {
    title: "My Records",
    items: [
      { label: "Certificates", href: "/dashboard/certificates", icon: "Award", roles: AUTHORS },
      { label: "Achievements", href: "/dashboard/achievements", icon: "Trophy", roles: AUTHORS },
      { label: "FDPs", href: "/dashboard/fdps", icon: "GraduationCap", roles: FACULTY_ONLY },
    ],
  },
  {
    title: "Grants",
    items: [
      { label: "My Grants", href: "/dashboard/grants", icon: "Landmark", roles: AUTHORS },
      { label: "Apply for Grant", href: "/dashboard/grants/new", icon: "FilePlus", roles: FACULTY_ONLY },
      {
        label: "Verification Requests",
        href: "/dashboard/verifications",
        icon: "UserCheck",
        roles: FACULTY_ONLY,
      },
    ],
  },
  // ── EDITOR + ADMIN + SUPERADMIN ───────────────────────────
  {
    title: "Review",
    items: [
      {
        label: "Review Queue",
        href: "/dashboard/review",
        icon: "ClipboardCheck",
        roles: STAFF,
        badge: "pendingReviews",
        children: [
          { label: "Journals", href: "/dashboard/review/journals" },
          { label: "Conferences", href: "/dashboard/review/conferences" },
          { label: "Book Chapters", href: "/dashboard/review/book-chapters" },
          { label: "Patents", href: "/dashboard/review/patents" },
          { label: "Copyrights", href: "/dashboard/review/copyrights" },
          { label: "Certificates", href: "/dashboard/review/certificates" },
          { label: "FDPs", href: "/dashboard/review/fdps" },
          { label: "Achievements", href: "/dashboard/review/achievements" },
        ],
      },
      { label: "All Research", href: "/dashboard/research", icon: "Library", roles: STAFF },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Manage Events", href: "/dashboard/manage/events", icon: "CalendarCog", roles: STAFF },
      {
        label: "Faculty Verifications",
        href: "/dashboard/manage/verifications",
        icon: "ShieldCheck",
        roles: STAFF,
        badge: "pendingVerifications",
      },
    ],
  },
  // ── ADMIN + SUPERADMIN ────────────────────────────────────
  {
    title: "Administration",
    items: [
      { label: "Users", href: "/dashboard/admin/users", icon: "Users", roles: ADMINS },
      { label: "Special Users", href: "/dashboard/admin/special-users", icon: "UserPlus", roles: ADMINS },
      { label: "All Grants", href: "/dashboard/admin/grants", icon: "Landmark", roles: ADMINS },
      {
        label: "Bills",
        href: "/dashboard/admin/bills",
        icon: "Receipt",
        roles: ADMINS,
        badge: "pendingBills",
      },
      { label: "Reports & Export", href: "/dashboard/admin/reports", icon: "FileBarChart", roles: ADMINS },
      { label: "Broadcast", href: "/dashboard/admin/broadcast", icon: "Megaphone", roles: ADMINS },
    ],
  },
  // ── SUPERADMIN ────────────────────────────────────────────
  {
    title: "System",
    items: [
      { label: "Role Management", href: "/dashboard/superadmin/roles", icon: "KeyRound", roles: SUPER },
      { label: "Hidden Grants", href: "/dashboard/superadmin/hidden-grants", icon: "EyeOff", roles: SUPER },
      { label: "Deactivated Users", href: "/dashboard/superadmin/deactivated-users", icon: "UserX", roles: SUPER },
      { label: "Maintenance", href: "/dashboard/superadmin/maintenance", icon: "Wrench", roles: SUPER },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ALL }],
  },
];

/** Sidebar for one role. Empty sections are dropped. */
export function getSidebar(role: Role): NavSection[] {
  return SIDEBAR.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}

/** Route-prefix guard for middleware. Longest matching prefix wins. */
export const ROUTE_ACCESS: Array<{ prefix: string; roles: Role[] }> = [
  // ── SUPERADMIN only ──
  { prefix: "/dashboard/superadmin", roles: SUPER },
  
  // ── ADMIN+ ──
  { prefix: "/dashboard/admin", roles: ADMINS },
  
  // ── STAFF (EDITOR+) ──
  { prefix: "/dashboard/review", roles: STAFF },
  { prefix: "/dashboard/manage", roles: STAFF },
  
  // ── FACULTY only ──
  { prefix: "/dashboard/fdps", roles: FACULTY_ONLY },
  { prefix: "/dashboard/verifications", roles: FACULTY_ONLY },
  { prefix: "/dashboard/grants/new", roles: FACULTY_ONLY },
  
  // ── AUTHORS (STUDENT + FACULTY) ──
  { prefix: "/dashboard/research", roles: AUTHORS },
  { prefix: "/dashboard/certificates", roles: AUTHORS },
  { prefix: "/dashboard/achievements", roles: AUTHORS },
  { prefix: "/dashboard/grants", roles: AUTHORS },
  
  // ── ALL authenticated ──
  { prefix: "/dashboard/notifications", roles: ALL },
  { prefix: "/dashboard/events", roles: ALL },
  { prefix: "/dashboard/profile", roles: ALL },
  { prefix: "/dashboard/settings", roles: ALL },
  { prefix: "/dashboard", roles: ALL },
];

export function canAccess(role: Role, pathname: string): boolean {
  const rule = ROUTE_ACCESS
    .filter((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return rule ? rule.roles.includes(role) : false;
}
