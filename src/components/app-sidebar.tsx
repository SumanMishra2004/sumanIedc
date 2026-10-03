"use client"

import * as React from "react"
import { IconInnerShadowTop } from "@tabler/icons-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { 
  SIDEBAR_CONFIG, 
  buildSidebar, 
  type GrantSidebarItem 
} from "@/lib/auth/sidebar-config"
import type { UserRole } from "@prisma/client"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  grants?: GrantSidebarItem[]
}

export function AppSidebar({ grants = [], ...props }: AppSidebarProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role as UserRole | undefined

  // Build filtered sidebar based on user role and permissions
  const navMain = React.useMemo(
    () => buildSidebar(SIDEBAR_CONFIG, userRole, grants),
    [userRole, grants]
  )

  const user = session?.user
    ? {
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        avatar: session.user.image ?? "/avatars/shadcn.jpg",
      }
    : { name: "Guest", email: "", avatar: "/avatars/shadcn.jpg" }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="pb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/60 transition-colors">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[#c9f53b] text-black shadow-sm">
                  <IconInnerShadowTop className="size-5" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[14px] font-bold tracking-tight">IEDC</span>
                  <span className="truncate text-[9.5px] text-sidebar-foreground/50 font-semibold uppercase tracking-wider">
                    Research Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 pt-2">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
