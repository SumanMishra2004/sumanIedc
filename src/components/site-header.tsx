"use client"

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import UserMenu from "./user-menu";
import { NotificationBell } from "@/components/journal/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileSearch } from "./profile-search";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/45 bg-background/80 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
      <div className="flex w-full items-center gap-4 px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
          <Separator orientation="vertical" className="h-4 bg-border/60" />
        </div>

        {/* Search - grows to fill space with premium feel */}
        <div className="flex-1 max-w-sm">
          <ProfileSearch />
        </div>

        {/* Right section - aligned items */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Theme Toggle */}
          <ThemeToggle />
        
          {/* Notification Bell */}
          <NotificationBell />

          {/* Avatar Dropdown */}
          <UserMenu/>
        </div>
      </div>
    </header>
  );
}
