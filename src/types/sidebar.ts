
import {  type LucideIcon } from "lucide-react"
import { IconType } from "react-icons"

export type SidebarIcon = LucideIcon  | IconType


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


