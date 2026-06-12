"use client";

/**
 * Embedded Sanity Studio at /studio
 *
 * Access is intentionally unrestricted at the route level — Sanity Studio
 * requires its own login so unauthenticated visitors will be prompted to
 * sign in via Sanity's auth flow before they can edit anything.
 *
 * To restrict to ADMIN users from your own auth system, wrap this component
 * with a session guard using next-auth's useSession hook.
 */

import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity/sanity.config";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
