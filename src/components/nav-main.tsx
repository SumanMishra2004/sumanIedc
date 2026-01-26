"use client"

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import type { LucideIcon } from "lucide-react"
import type { IconType } from "react-icons"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon | LucideIcon | IconType
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url
            
            return (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url} className="flex items-center gap-2">
              <SidebarMenuButton 
                tooltip={item.title}
                className={cn(
                  isActive && "bg-chart-2 text-chart-2-foreground hover:bg-chart-2/90 "
                )}
              >
                {item.icon && <item.icon className={`size-5  ${isActive ? "text-chart-2-foreground" : "text-chart-2"}`} />}
                <span>{item.title}</span>
              </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
