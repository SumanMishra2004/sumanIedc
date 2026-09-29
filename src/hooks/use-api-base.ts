"use client";
/**
 * useApiBase — returns the role-correct API base URL for a resource.
 *
 * Components that previously hard-coded `/api/research/journal` should call:
 *   const base = useApiBase("journal")
 * then use `base` in their fetch/axios calls.
 */
import { useSession } from "next-auth/react";
import { apiBase, ResourceKey } from "@/lib/api-client";

export function useApiBase(resource: ResourceKey): string {
  const { data: session } = useSession();
  return apiBase(resource, session?.user?.role);
}

/**
 * Returns all commonly-needed API bases at once to avoid multiple hook calls.
 */
export function useAllApiBases() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  return {
    journal:      apiBase("journal",       role),
    bookChapter:  apiBase("book-chapter",  role),
    conference:   apiBase("conference",    role),
    patent:       apiBase("patent",        role),
    copyright:    apiBase("copyright",     role),
    grant:        apiBase("grant",         role),
    certificate:  apiBase("certificate",   role),
    fdp:          apiBase("fdp",           role),
    achievement:  apiBase("achievement",   role),
    event:        apiBase("event",         role),
    user:         apiBase("user",          role),
    verification: apiBase("verification",  role),
    dashboard:    apiBase("dashboard",     role),
    profile:      apiBase("profile",       role),
    notification: apiBase("notification",  role),
    role,
  };
}
