"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import UserMenu from "./user-menu";
import { NotificationBell } from "@/components/journal/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
        </div>

        {/* Search - grows to fill space */}
        <div className="flex-1 max-w-md">
          <Input placeholder="Search..." className="w-full bg-card" />
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
