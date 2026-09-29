/**
 * Role-aware API client.
 *
 * Resolves the correct base URL for each resource depending on the user's role
 * so all components continue to call a single helper — no mass find-replace needed.
 *
 * Usage:
 *   const base = apiBase("journal", session?.user?.role)
 *   await axios.get(`${base}`)          // list
 *   await axios.get(`${base}/${id}`)    // single
 *   await axios.post(base, data)        // create
 *   await axios.patch(`${base}/${id}`, data)  // update
 *   await axios.delete(`${base}/${id}`)       // delete
 */

export type UserRole = "STUDENT" | "FACULTY" | "EDITOR" | "ADMIN" | "SUPERADMIN";

export type ResourceKey =
  | "journal"
  | "book-chapter"
  | "conference"
  | "patent"
  | "copyright"
  | "grant"
  | "certificate"
  | "fdp"
  | "achievement"
  | "event"
  | "user"
  | "verification"
  | "notification"
  | "dashboard"
  | "profile";

type RouteMap = Partial<Record<ResourceKey, string>>;

const STUDENT_ROUTES: RouteMap = {
  journal:        "/api/student/journals",
  "book-chapter": "/api/student/book-chapters",
  certificate:    "/api/student/certificates",
  achievement:    "/api/student/achievements",
  notification:   "/api/student/notifications",
  profile:        "/api/student/profile",
  dashboard:      "/api/student/dashboard",
};

const FACULTY_ROUTES: RouteMap = {
  journal:        "/api/faculty/journals",
  "book-chapter": "/api/faculty/book-chapters",
  conference:     "/api/faculty/conferences",
  patent:         "/api/faculty/patents",
  copyright:      "/api/faculty/copyrights",
  grant:          "/api/faculty/grants",
  fdp:            "/api/faculty/fdps",
  achievement:    "/api/student/achievements",   // faculty re-uses student path
  certificate:    "/api/student/certificates",
  notification:   "/api/student/notifications",
  verification:   "/api/faculty/verifications",
  profile:        "/api/faculty/profile",
  dashboard:      "/api/faculty/dashboard",
};

const EDITOR_ROUTES: RouteMap = {
  journal:        "/api/editor/journals",
  "book-chapter": "/api/editor/book-chapters",
  conference:     "/api/editor/conferences",
  patent:         "/api/editor/patents",
  copyright:      "/api/editor/copyrights",
  certificate:    "/api/editor/certificates",
  fdp:            "/api/editor/fdps",
  achievement:    "/api/editor/achievements",
  event:          "/api/editor/events",
  verification:   "/api/editor/verifications",
  dashboard:      "/api/editor/dashboard",
  profile:        "/api/faculty/profile",
  notification:   "/api/student/notifications",
};

const ADMIN_ROUTES: RouteMap = {
  journal:        "/api/admin/journals",
  "book-chapter": "/api/admin/book-chapters",
  conference:     "/api/admin/conferences",
  patent:         "/api/admin/patents",
  copyright:      "/api/admin/copyrights",
  grant:          "/api/admin/grants",
  certificate:    "/api/admin/certificates",
  fdp:            "/api/admin/fdps",
  achievement:    "/api/admin/achievements",
  event:          "/api/admin/events",
  user:           "/api/admin/users",
  verification:   "/api/admin/verifications",
  dashboard:      "/api/admin/dashboard",
  profile:        "/api/faculty/profile",
  notification:   "/api/student/notifications",
};

const SUPERADMIN_ROUTES: RouteMap = {
  ...ADMIN_ROUTES,
  user:           "/api/superadmin/users",
  dashboard:      "/api/superadmin/dashboard",
};

const ROLE_ROUTES: Record<UserRole, RouteMap> = {
  STUDENT:    STUDENT_ROUTES,
  FACULTY:    FACULTY_ROUTES,
  EDITOR:     EDITOR_ROUTES,
  ADMIN:      ADMIN_ROUTES,
  SUPERADMIN: SUPERADMIN_ROUTES,
};

/**
 * Returns the correct API base URL for a resource + role combination.
 *
 * Falls back to the legacy `/api/research/*` path when no role is given
 * or the route is not mapped (backwards-compatible).
 */
export function apiBase(resource: ResourceKey, role?: string | null): string {
  if (!role) return legacyFallback(resource);

  const upper = role.toUpperCase() as UserRole;
  const routes = ROLE_ROUTES[upper];
  if (!routes) return legacyFallback(resource);

  return routes[resource] ?? legacyFallback(resource);
}

function legacyFallback(resource: ResourceKey): string {
  const legacyMap: Partial<Record<ResourceKey, string>> = {
    journal:        "/api/research/journal",
    "book-chapter": "/api/research/book-chapter",
    conference:     "/api/research/conference",
    patent:         "/api/research/patent",
    copyright:      "/api/research/copyright",
    grant:          "/api/research/grant-in",
    certificate:    "/api/research/certificate",
    fdp:            "/api/research/fdp",
    achievement:    "/api/research/achievement",
  };
  return legacyMap[resource] ?? `/api/${resource}`;
}

// ─── Convenience named exports ────────────────────────────────────────────────

export const journalApi      = (role?: string | null) => apiBase("journal",        role);
export const bookChapterApi  = (role?: string | null) => apiBase("book-chapter",   role);
export const conferenceApi   = (role?: string | null) => apiBase("conference",     role);
export const patentApi       = (role?: string | null) => apiBase("patent",         role);
export const copyrightApi    = (role?: string | null) => apiBase("copyright",      role);
export const grantApi        = (role?: string | null) => apiBase("grant",          role);
export const certificateApi  = (role?: string | null) => apiBase("certificate",    role);
export const fdpApi          = (role?: string | null) => apiBase("fdp",            role);
export const achievementApi  = (role?: string | null) => apiBase("achievement",    role);
export const eventApi        = (role?: string | null) => apiBase("event",          role);
export const userApi         = (role?: string | null) => apiBase("user",           role);
export const verificationApi = (role?: string | null) => apiBase("verification",   role);
export const dashboardApi    = (role?: string | null) => apiBase("dashboard",      role);
export const profileApi      = (role?: string | null) => apiBase("profile",        role);
export const notificationApi = (role?: string | null) => apiBase("notification",   role);
