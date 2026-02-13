"use client"

import * as React from "react"
import {
  IconBrandBooking,
  IconCamera,
  IconCertificate,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconMicrophone,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"


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
import { BookAIcon, Copyright, UserStar } from "lucide-react"
import { LuNotebookPen } from "react-icons/lu";
import { BsBookFill, BsJournalBookmarkFill } from "react-icons/bs";
import { NavMain } from "./nav-main"
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Book Chapters",
      url: "/dashboard/book-chapters",
      icon: LuNotebookPen
    },
    {
      title: "Copyright",
      url: "/dashboard/copyright",
      icon: Copyright
    },
    
    {
      title: "Journal",
      url: "/dashboard/journal",
      icon: BsJournalBookmarkFill
    },
    {
      title: "Conferences",
      url:"/dashboard/conferences",
      icon: IconMicrophone
    },
    {
      title: "Patent",
      url:"/dashboard/patent",
      icon: BsBookFill
    },
    {
      title: "Certificate",
      url:"/dashboard/certificate",
      icon: IconCertificate
    },
    {
      title: "FDP",
      url:"/dashboard/fdp",
      icon: UserStar
    },

  ],
  
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
