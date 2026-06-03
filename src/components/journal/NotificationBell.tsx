"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  User,
  BookOpen,
  ExternalLink,
  MessageSquare,
  Users,
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

  // Dialog and details state
  const [selectedNotification, setSelectedNotification] = React.useState<Notification | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [detailsLoading, setDetailsLoading] = React.useState(false)
  const [details, setDetails] = React.useState<any | null>(null)

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

  // Mark single notification as read and fetch details for dialog
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
    setSelectedNotification(notif)
    setIsDialogOpen(true)
    setDetails(null)

    // Parse ID and type from the link
    if (notif.link) {
      let resourceId: string | null = null
      let resourceType: "journal" | "book-chapter" | "copyright" | null = null

      try {
        const url = new URL(notif.link, window.location.origin)
        resourceId = url.searchParams.get("id")
        if (notif.link.includes("journal")) {
          resourceType = "journal"
        } else if (notif.link.includes("book-chapter") || notif.link.includes("book-chapters")) {
          resourceType = "book-chapter"
        } else if (notif.link.includes("copyright")) {
          resourceType = "copyright"
        }
      } catch (e) {
        // Fallback matching
        const match = notif.link.match(/[?&]id=([^&]+)/)
        if (match) resourceId = match[1]
        if (notif.link.includes("journal")) {
          resourceType = "journal"
        } else if (notif.link.includes("book-chapter") || notif.link.includes("book-chapters")) {
          resourceType = "book-chapter"
        } else if (notif.link.includes("copyright")) {
          resourceType = "copyright"
        }
      }

      if (resourceId && resourceType) {
        setDetailsLoading(true)
        try {
          const apiPath = resourceType === "journal"
            ? `/api/research/journal/${resourceId}`
            : resourceType === "book-chapter"
            ? `/api/research/book-chapter/${resourceId}`
            : `/api/research/copyright/${resourceId}`

          const res = await fetch(apiPath)
          if (res.ok) {
            const data = await res.json()
            setDetails(
              resourceType === "journal"
                ? data.journal
                : resourceType === "book-chapter"
                ? data.bookChapter
                : data.copyright
            )
          }
        } catch (err) {
          console.error("Failed to fetch notification resource details:", err)
        } finally {
          setDetailsLoading(false)
        }
      }
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
      case "BOOK_CHAPTER_SUBMITTED":
      case "COPYRIGHT_SUBMITTED":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "JOURNAL_APPROVED":
      case "BOOK_CHAPTER_APPROVED":
      case "COPYRIGHT_APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "JOURNAL_UPDATE_REQUESTED":
      case "BOOK_CHAPTER_UPDATE_REQUESTED":
      case "COPYRIGHT_UPDATE_REQUESTED":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "JOURNAL_REJECTED":
      case "BOOK_CHAPTER_REJECTED":
      case "COPYRIGHT_REJECTED":
        return <XCircle className="h-4 w-4 text-rose-500" />
      case "JOURNAL_PUBLISHED":
      case "BOOK_CHAPTER_PUBLISHED":
      case "COPYRIGHT_PUBLISHED":
        return <Globe className="h-4 w-4 text-violet-500" />
      default:
        return <Bell className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-6 bg-background border border-border/80 shadow-2xl rounded-xl max-h-[85vh] overflow-y-auto z-50">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {selectedNotification && getNotificationIcon(selectedNotification.type)}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold tracking-tight text-foreground truncate">
                  {selectedNotification?.title || "Notification Details"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Received {selectedNotification && formatRelativeTime(selectedNotification.createdAt)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {/* Notification message details */}
            <div className="p-4 rounded-lg bg-accent/40 border border-border/55 text-sm text-foreground/90 flex gap-3">
              <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground block">Notification Message</span>
                <p className="text-sm font-medium">{selectedNotification?.message}</p>
              </div>
            </div>

            {detailsLoading ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-xs">Fetching publication details...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded-md w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded-md w-1/2" />
                  <div className="h-16 bg-muted animate-pulse rounded-md w-full" />
                </div>
              </div>
            ) : details ? (
              <div className="space-y-4">
                {/* Journal/Book Title */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground block">
                    {selectedNotification?.type.startsWith("JOURNAL_") ? "Journal Title" : selectedNotification?.type.startsWith("BOOK_CHAPTER_") ? "Book Chapter Title" : "Copyright Title"}
                  </span>
                  <div className="flex gap-2 items-start">
                    <BookOpen className="h-4 w-4 text-primary shrink-0 mt-1" />
                    <h4 className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                      {details.title}
                    </h4>
                  </div>
                  {details.journalName && (
                    <p className="text-xs text-muted-foreground ml-6">
                      Published in: <span className="font-medium text-foreground/80">{details.journalName}</span>
                    </p>
                  )}
                  {details.publisher && (
                    <p className="text-xs text-muted-foreground ml-6">
                      Publisher: <span className="font-medium text-foreground/80">{details.publisher}</span>
                    </p>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-4 ml-6">
                  {details.journalStatus && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Publication Status</span>
                      <Badge variant="outline" className={cn(
                        "text-xs px-2 py-0.5 font-medium border capitalize",
                        details.journalStatus === "PUBLISHED" && "bg-green-500/10 text-green-500 border-green-500/20",
                        details.journalStatus === "APPROVED" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        details.journalStatus === "UNDER_REVIEW" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                        details.journalStatus === "SUBMITTED" && "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      )}>
                        {details.journalStatus.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>
                  )}
                  {details.bookChapterStatus && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Publication Status</span>
                      <Badge variant="outline" className={cn(
                        "text-xs px-2 py-0.5 font-medium border capitalize",
                        details.bookChapterStatus === "PUBLISHED" && "bg-green-500/10 text-green-500 border-green-500/20",
                        details.bookChapterStatus === "APPROVED" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        details.bookChapterStatus === "UNDER_REVIEW" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                        details.bookChapterStatus === "SUBMITTED" && "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      )}>
                        {details.bookChapterStatus.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>
                  )}
                  {details.copyrightStatus && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Publication Status</span>
                      <Badge variant="outline" className={cn(
                        "text-xs px-2 py-0.5 font-medium border capitalize",
                        details.copyrightStatus === "PUBLISHED" && "bg-green-500/10 text-green-500 border-green-500/20",
                        details.copyrightStatus === "APPROVED" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        details.copyrightStatus === "UNDER_REVIEW" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                        details.copyrightStatus === "SUBMITTED" && "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      )}>
                        {details.copyrightStatus.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>
                  )}
                  {details.teacherStatus && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Faculty Review Status</span>
                      <Badge variant="outline" className={cn(
                        "text-xs px-2 py-0.5 font-medium border capitalize",
                        details.teacherStatus === "ACCEPTED" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                        details.teacherStatus === "REJECTED" && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                        details.teacherStatus === "UPDATE" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                        details.teacherStatus === "UPLOADED" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        details.teacherStatus === "PUBLISHED" && "bg-violet-500/10 text-violet-500 border-violet-500/20"
                      )}>
                        {details.teacherStatus.toLowerCase()}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Update comments (if requested change) */}
                {details.updateComment && (
                  <div className="ml-6 p-3 rounded-md border border-amber-500/25 bg-amber-500/5 text-xs text-foreground/90 leading-relaxed">
                    <span className="font-semibold text-amber-500 block mb-1">Reviewer Feedback:</span>
                    {details.updateComment}
                  </div>
                )}

                {/* Abstract */}
                {details.abstract && (
                  <div className="space-y-1 ml-6">
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground block">Abstract</span>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-accent/25 p-3 rounded-md border border-border/40">
                      {details.abstract}
                    </p>
                  </div>
                )}

                {/* Who Made It (Authors) */}
                <div className="space-y-2.5 ml-6">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground block">Authors (Who Made It)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {/* Student Authors */}
                    {details.studentAuthors?.map((author: any) => (
                      <div key={author.user.id} className="flex items-center gap-2.5 p-2 rounded-md border border-border/40 bg-accent/15">
                        <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{author.user.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{author.user.email}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Badge className="text-[8px] h-4 px-1 py-0 bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-none rounded">Student</Badge>
                            {author.user.department && (
                              <span className="text-[9px] text-muted-foreground truncate max-w-[80px]">{author.user.department}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Faculty Authors */}
                    {details.facultyAuthors?.map((author: any) => (
                      <div key={author.user.id} className="flex items-center gap-2.5 p-2 rounded-md border border-border/40 bg-accent/15">
                        <div className="h-7 w-7 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-violet-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{author.user.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{author.user.email}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Badge className="text-[8px] h-4 px-1 py-0 bg-violet-500/10 text-violet-500 hover:bg-violet-500/10 border-none rounded">Faculty</Badge>
                            {author.user.department && (
                              <span className="text-[9px] text-muted-foreground truncate max-w-[80px]">{author.user.department}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Fallback view when no details or fetching failed
              <div className="py-2 text-xs text-muted-foreground italic text-center">
                Detailed publication information is not available or has been removed.
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 border-t border-border/40 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="text-xs h-9 cursor-pointer"
            >
              Close
            </Button>
            {selectedNotification?.link && (
              <Button
                variant="default"
                onClick={() => {
                  setIsDialogOpen(false)
                  router.push(selectedNotification.link!)
                  router.refresh()
                }}
                className="text-xs h-9 flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Go to Dashboard
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
