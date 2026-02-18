import { IconDashboard, IconInnerShadowTop, IconPigMoney } from "@tabler/icons-react"
import { BookOpen, CircleDollarSign, type LucideIcon } from "lucide-react"
import { IconType } from "react-icons"

export type SidebarIcon = LucideIcon  | IconType

export interface SidebarUser {
  name: string
  email: string
  avatar: string
}

export interface SidebarTeam {
  name: string
  logo: SidebarIcon
  plan: string
}

export interface SidebarNavItem {
  title: string
  url: string
  icon?: SidebarIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}


export interface SidebarData {
  user: SidebarUser
  teams: SidebarTeam[]
  navMain: SidebarNavItem[]
}


export const sidebardata: SidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
     {
        name: "Acme Inc.",
        logo: IconInnerShadowTop,
        plan: "Enterprise"
     }
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Research",
      url: "#",
      icon: BookOpen,
      items: [
        {
            title: "Book Chapters",
            url: "/dashboard/book-chapters",
        },
        {
            title: "Copyright",
            url: "/dashboard/copyright",
        },
        {
            title: "Journal",
            url: "/dashboard/journal",
        },
        {
            title: "Conferences",
            url:"/dashboard/conferences",
        },
        {
            title: "Patent",
            url:"/dashboard/patent",
        },
        {
            title: "Certificate",
            url:"/dashboard/certificate",
        },
        {
            title: "FDP",
            url:"/dashboard/fdp",
        },
       
      ]
    },
    {
        title: "Grants",
        url: "#",
        icon: CircleDollarSign,
        items:[
            {
                title:"My Bills",
                url:"/dashboard/bills",
            },
            {
                title: "Grant In",
                url: "/dashboard/grant",
            }
        ]
    }
  ],
  
}
