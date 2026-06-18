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

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NextStudio } from "next-sanity/studio";
import { useEffect } from "react";
import config from "../../../../sanity/sanity.config";

export default function StudioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c9f53b]/20 border-t-[#c9f53b] rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center backdrop-blur-sm shadow-xl">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-xl font-bold text-[#fca5a5] mb-2 tracking-tight">Access Denied</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Sanity Studio is only accessible to accounts with the administrator role.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-lg bg-[#c9f53b] hover:bg-[#b0d830] text-[#0c0c0c] text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#c9f53b]/10"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <NextStudio config={config} />;
}
