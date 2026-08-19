import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CompleteProfileDialog } from "@/components/profile/CompleteProfileDialog";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/* -----------------------------------------------------------------
   Cached grants fetcher — cached per user for 5 minutes.
   The cache is invalidated via revalidateTag("grants-sidebar-<userId>")
   in the grant-in POST and DELETE route handlers so the sidebar stays
   consistent without constantly hitting the database.
----------------------------------------------------------------- */
function getCachedGrants(userId: string, userRole: string) {
  // Admins and SuperAdmins see ALL grants — use a shared tag so any grant mutation revalidates
  // the admin's sidebar. Regular users get a per-user tag.
  const isPrivileged = userRole === "ADMIN" || userRole === "SUPERADMIN"
  const cacheKey = isPrivileged ? "grants-sidebar-all" : `grants-sidebar-${userId}`

  return unstable_cache(
    async () => {
      const whereClause: Record<string, unknown> = {};
      if (userRole === "FACULTY" || userRole === "EDITOR") {
        whereClause.facultyAuthors = { some: { userId } };
      } else if (userRole === "STUDENT") {
        whereClause.studentAuthors = { some: { userId } };
      }
      // ADMIN / SUPERADMIN — no filter, sees all grants

      return prisma.grantIn.findMany({
        where: whereClause,
        select: { id: true, projectCode: true },
        orderBy: { createdAt: "desc" },
      });
    },
    [cacheKey],
    {
      revalidate: 300, // 5-minute fallback revalidation
      tags: [cacheKey],
    }
  )();
}

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // Fetch user's grants for sidebar (cached per user, invalidated on grant mutations)
  let grants: { id: string; projectCode: string | null }[] = [];
  if (session?.user?.id) {
    grants = await getCachedGrants(session.user.id, session.user.role ?? "STUDENT");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
      className="h-screen overflow-hidden"
    >
      <AppSidebar variant="inset" grants={grants} />
      <SidebarInset className="min-w-0 overflow-hidden flex flex-col">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-gradient" data-lenis-prevent>
          {children}
        </div>
      </SidebarInset>
      <CompleteProfileDialog />
    </SidebarProvider>
  );
}
