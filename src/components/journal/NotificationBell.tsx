"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  BellOff,
  Check,
  Loader2,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isOpen, setIsOpen] = React.useState(false)

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Fetch when popover opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      fetchNotifications()
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        )
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  // Mark single notification as read
  const handleNotificationClick = async (notif: Notification) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    )

    if (!notif.read) {
      try {
        await fetch(`/api/notifications/${notif.id}`, {
          method: "PATCH",
        })
      } catch (err) {
        console.error("Failed to mark notification as read:", err)
      }
    }

    setIsOpen(false)
    if (notif.link) {
      router.push(notif.link)
      // Force a refresh/refetch if already on dashboard to get updated journal table statuses
      router.refresh()
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  // Helper for rendering relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (isNaN(diffInSeconds)) return "some time ago"
    if (diffInSeconds < 60) return "just now"
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  // Helper for notification icons
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "JOURNAL_SUBMITTED":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "JOURNAL_APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "JOURNAL_UPDATE_REQUESTED":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "JOURNAL_REJECTED":
        return <XCircle className="h-4 w-4 text-rose-500" />
      case "JOURNAL_PUBLISHED":
        return <Globe className="h-4 w-4 text-violet-500" />
      default:
        return <Bell className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-300"
          aria-label="Notifications"
        >
          <Bell className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-300",
            unreadCount > 0 && "animate-pulse text-primary fill-primary/10"
          )} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold border-2 border-background animate-in zoom-in duration-300"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 bg-background/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-xl z-50"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border-none">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-md transition-colors flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[380px] w-full">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary/80" />
              <span className="text-xs">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-accent/40 flex items-center justify-center text-muted-foreground/60">
                <BellOff className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/80">All caught up!</p>
                <p className="text-xs text-muted-foreground/75 mt-0.5">No notifications yet</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-accent/40 flex gap-3 transition-colors duration-200 relative focus:outline-none focus:bg-accent/40",
                    !notif.read && "bg-accent/20"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center shadow-xs border border-border/40">
                      {getNotificationIcon(notif.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={cn(
                      "text-xs font-medium text-foreground leading-tight",
                      !notif.read && "font-semibold text-primary"
                    )}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/60 mt-1.5 block font-medium">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.read && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
