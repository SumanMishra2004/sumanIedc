"use client"

import * as React from "react"
import { IconDashboard, IconInnerShadowTop } from "@tabler/icons-react"
import { BookOpen, CircleDollarSign } from "lucide-react"
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
import {  SidebarNavItem } from "@/types/sidebar"
import { NavMain } from "./nav-main"

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
  console.log("User Role:", userRole) // Debugging line to check the user role
  const researchItems = [
    { title: "Book Chapters", url: "/dashboard/book-chapters" },
    { title: "Copyright", url: "/dashboard/copyright" },
    { title: "Journal", url: "/dashboard/journal" },
    { title: "Conferences", url: "/dashboard/conferences" },
    { title: "Patent", url: "/dashboard/patent" },
    { title: "Certificate", url: "/dashboard/certificate" },
    // FDP is only visible to FACULTY and ADMIN
    ...(userRole === "FACULTY" || userRole === "ADMIN"
      ? [{ title: "FDP", url: "/dashboard/fdp" }]
      : []),
  ]

  const grantSubItems = [
    { title: "Grant In", url: "/dashboard/grant" },
    // Dynamic grant links from the user's grants
    ...grants.map((g) => ({
      title: g.projectCode ?? g.id.slice(0, 8),
      url: `/dashboard/grant/${g.id}`,
    })),
  ]

  const navMain: SidebarNavItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
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
  ]

  const user = session?.user
    ? {
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        avatar: session.user.image ?? "/avatars/shadcn.jpg",
      }
   :{
      name: "Guest",
      email: "",
      avatar: "/avatars/shadcn.jpg",
   }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
