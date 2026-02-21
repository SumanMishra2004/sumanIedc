import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // Fetch user's grants for sidebar (role-based)
  let grants: { id: string; projectCode: string | null }[] = [];
  if (session?.user?.id) {
    const userId = session.user.id;
    const userRole = session.user.role;

    const whereClause: Record<string, unknown> = {};
    if (userRole === "FACULTY") {
      whereClause.facultyAuthors = { some: { userId } };
    } else if (userRole === "STUDENT") {
      whereClause.studentAuthors = { some: { userId } };
    }
    // ADMIN sees all grants

    grants = await prisma.grantIn.findMany({
      where: whereClause,
      select: { id: true, projectCode: true },
      orderBy: { createdAt: "desc" },
    });
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-gradient">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
