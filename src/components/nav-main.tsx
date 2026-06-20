"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { IconProps, type Icon } from "@tabler/icons-react"
import { IconType } from "react-icons"
import { usePathname } from "next/navigation"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon | React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>> | IconType
    isActive?: boolean
    items?: { title: string; url: string }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="py-0">
      <SidebarGroupLabel className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
        Navigation
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const isActive =
            item.url !== "#" && pathname === item.url
          const hasActiveChild = item.items?.some((sub) => pathname === sub.url)

          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={`
                    group h-9 rounded-lg px-3 text-[13.5px] font-medium transition-all
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                    ${isActive
                      ? "bg-[#c9f53b]/15 text-[#c9f53b] hover:bg-[#c9f53b]/20 hover:text-[#c9f53b]"
                      : "text-sidebar-foreground/70"
                    }
                  `}
                >
                  <Link href={item.url} className="flex items-center gap-2.5">
                    {item.icon && (
                      <item.icon
                        className={`size-4 shrink-0 transition-colors ${
                          isActive ? "text-[#c9f53b]" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                        }`}
                      />
                    )}
                    <span>{item.title}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c9f53b]" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={hasActiveChild || item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={`
                      group h-9 rounded-lg px-3 text-[13.5px] font-medium transition-all
                      hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                      ${hasActiveChild
                        ? "text-sidebar-foreground"
                        : "text-sidebar-foreground/70"
                      }
                    `}
                  >
                    {item.icon && (
                      <item.icon
                        className={`size-4 shrink-0 transition-colors ${
                          hasActiveChild
                            ? "text-[#c9f53b]"
                            : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                        }`}
                      />
                    )}
                    <span className="flex-1">{item.title}</span>
                    {item.items && (
                      <span className="ml-auto mr-0.5 rounded-md bg-sidebar-foreground/8 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-sidebar-foreground/40">
                        {item.items.length}
                      </span>
                    )}
                    <ChevronRight className="size-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
                  <SidebarMenuSub className="ml-4 border-l border-sidebar-border/30 pl-0">
                    {item.items?.map((subItem) => {
                      const isSubActive = pathname === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={`
                               relative h-8 rounded-md pl-4 text-[12.5px] transition-all
                               before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:-translate-y-1/2 before:bg-sidebar-border/40
                               hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                               ${isSubActive
                                 ? "font-medium text-[#c9f53b] before:bg-[#c9f53b]/50"
                                 : "text-sidebar-foreground/55"
                               }
                            `}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                              {isSubActive && (
                                <span className="ml-auto h-1 w-1 rounded-full bg-[#c9f53b]" />
                              )}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}