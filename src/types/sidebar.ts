
import {  type LucideIcon } from "lucide-react"
import { IconType } from "react-icons"
import { UserRole } from "@prisma/client"
import type { Permission } from "@/lib/auth/sidebar-config"

export type SidebarIcon = LucideIcon  | IconType

export interface SidebarNavItem {
  title: string
  url: string
  icon?: SidebarIcon
  isActive?: boolean
  permission?: Permission
  roles?: UserRole[]
  items?: SidebarNavItem[]
  showCount?: boolean
}

