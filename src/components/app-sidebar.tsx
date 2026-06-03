"use client"

import * as React from "react"
import { IconInnerShadowTop } from "@tabler/icons-react"
import { BookOpen, CircleDollarSign, User2, UserCog } from "lucide-react"
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
    { title: "Certificate", url: "/dashboard/certificate" },
    ...(userRole === "FACULTY" || userRole === "ADMIN"
      ? [{ title: "FDP", url: "/dashboard/fdp" }]
      : []),
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
      title: "Research",
      url: "#",
      icon: BookOpen,
      items: researchItems,
    },
    {
      title: "Grants",
      url: "#",
      icon: CircleDollarSign,
      items: grantSubItems,
    },
    // ── Admin-only: Admin Panel ────────────────────────────────
    ...(userRole === "ADMIN"
      ? [
          {
            title: "Admin",
            url: "#",
            icon: UserCog,
            items: [
              { title: "All Users", url: "/dashboard/admin/users" },
              {
                title: "Access Management",
                url: "/dashboard/admin/special-user",
              },
              { title: "Book Chapter Management", url: "/dashboard/admin/book-chapters" },
              { title: "Journal Management", url: "/dashboard/admin/journals" },
              { title: "Conference Management", url: "/dashboard/admin/conferences" },
              { title: "Patent Management", url: "/dashboard/admin/patents" },
              { title: "Certificate Management", url: "/dashboard/admin/certificates" },
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
    : {
        name: "Guest",
        email: "",
        avatar: "/avatars/shadcn.jpg",
      }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconInnerShadowTop className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">IEDC</span>
                  <span className="truncate text-xs">Research Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 pb-2">
          <ProfileSearch />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
