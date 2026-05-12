"use client";

import { usePathname } from "next/navigation";
import NavbarWrapper from "./NavbarWrapper";

/**
 * ConditionalNavbar component that shows the navbar on all pages except:
 * - Dashboard pages (/dashboard/*)
 * - Admin pages (/admin/*)
 */
export default function ConditionalNavbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current path should hide the navbar
  const shouldHideNavbar = 
    pathname?.startsWith("/dashboard") || 
    pathname?.startsWith("/admin") || 
    pathname?.startsWith("/auth") || 
    pathname?.startsWith("/setup-profile");

  if (shouldHideNavbar) {
    // No navbar, just render children
    return <>{children}</>;
  }

  // Show navbar with proper spacing
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarWrapper>{children}</NavbarWrapper>
    </div>
  );
}
