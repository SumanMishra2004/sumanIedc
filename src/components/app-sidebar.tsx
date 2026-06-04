"use client"

import * as React from "react"
import { IconInnerShadowTop } from "@tabler/icons-react"
import { Award, BookOpen, CircleDollarSign, Settings, User2, UserCog } from "lucide-react"
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
import { SidebarNavItem } from "@/types/sidebar"
import { NavMain } from "./nav-main"
import { ProfileSearch } from "./profile-search"

interface GrantSidebarItem {
  id: string
  projectCode: string | null
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  grants?: GrantSidebarItem[]
}

export function AppSidebar({ grants = [], ...props }: AppSidebarProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  const researchItems = [
    { title: "Book Chapters", url: "/dashboard/book-chapters" },
    { title: "Copyright", url: "/dashboard/copyright" },
    { title: "Journal", url: "/dashboard/journal" },
    { title: "Conferences", url: "/dashboard/conferences" },
    { title: "Patent", url: "/dashboard/patent" },
    ...(userRole === "FACULTY" || userRole === "ADMIN"
      ? [{ title: "FDP", url: "/dashboard/fdp" }]
      : []),
  ]

  const recognitionItems = [
    { title: "Certificate", url: "/dashboard/certificate" },
    { title: "Achievements", url: "/dashboard/achievements" },
  ]

  const grantSubItems = [
    { title: "Grant In", url: "/dashboard/grant" },
    ...grants.map((g) => ({
      title: g.projectCode ?? g.id.slice(0, 8),
      url: `/dashboard/grant/${g.id}`,
    })),
  ]

  const navMain: SidebarNavItem[] = [
    {
      title: "My Profile",
      url: "/dashboard",
      icon: User2,
    },
    {
      title: "Setup Profile",
      url: "/dashboard/profile",
      icon: Settings,
    },
    {
      title: "Research",
      url: "#",
      icon: BookOpen,
      items: researchItems,
    },
    {
      title: "Recognition",
      url: "#",
      icon: Award,
      items: recognitionItems,
    },
    {
      title: "Grants",
      url: "#",
      icon: CircleDollarSign,
      items: grantSubItems,
    },
    ...(userRole === "ADMIN"
      ? [
          {
            title: "Admin",
            url: "#",
            icon: UserCog,
            items: [
              { title: "All Users", url: "/dashboard/admin/users" },
              { title: "Access Management", url: "/dashboard/admin/special-user" },
              { title: "Book Chapter Management", url: "/dashboard/admin/book-chapters" },
              { title: "Journal Management", url: "/dashboard/admin/journals" },
              { title: "Conference Management", url: "/dashboard/admin/conferences" },
              { title: "Patent Management", url: "/dashboard/admin/patents" },
              { title: "Grant Management", url: "/dashboard/admin/grants" },
              { title: "Certificate Management", url: "/dashboard/admin/certificates" },
              { title: "FDP Management", url: "/dashboard/admin/fdps" },
              { title: "Event Management", url: "/dashboard/admin/events" },
              { title: "Achievement Verification", url: "/dashboard/admin/achievements" },
            ],
          },
        ]
      : []),
  ]

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
              <a href="/" className="flex items-center gap-3">
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[#c9f53b] text-black shadow-sm">
                  <IconInnerShadowTop className="size-5" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[15px] font-semibold tracking-tight">IEDC</span>
                  <span className="truncate text-[11px] text-sidebar-foreground/50 font-medium uppercase tracking-widest">
                    Research Portal
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mx-3 my-2 h-px bg-sidebar-border/40" />

        <div className="px-2 pb-3">
          <ProfileSearch />
        </div>
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