import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
    console.log("Session data:", session);

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
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0 overflow-hidden flex flex-col">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-gradient">
          
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
