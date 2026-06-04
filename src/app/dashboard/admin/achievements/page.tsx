"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileDown,
  Globe,
  Loader2,
  Lock,
  MoreHorizontal,
  Search,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  XCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  department: string | null
  role: string
}

interface Achievement {
  id: string
  title: string
  description: string
  category: string | null
  year: string
  imageUrl: string | null
  documentUrl: string | null
  achievementStatus: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"
  isPublic: boolean
  updateComment: string | null
  createdAt: string
  user: UserProfile
}

export default function AdminAchievementsPage() {
  const { data: session, status } = useSession()
  const [achievements, setAchievements] = React.useState<Achievement[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("ALL")

  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = React.useState(false)
  const [selectedAchievement, setSelectedAchievement] = React.useState<Achievement | null>(null)
  const [reviewStatus, setReviewStatus] = React.useState<"SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED">("SUBMITTED")
  const [reviewComment, setReviewComment] = React.useState("")
  const [reviewIsPublic, setReviewIsPublic] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const fetchAchievements = async () => {
    setIsLoading(true)
    try {
      const url = new URL("/api/admin/achievements", window.location.origin)
      if (statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter)
      }
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setAchievements(data.achievements || [])
      } else {
        toast.error("Failed to load achievements", {
          description: data.error || "Something went wrong",
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch achievements from server")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchAchievements()
    }
  }, [session, statusFilter])

  const handleReviewOpen = (achievement: Achievement) => {
    setSelectedAchievement(achievement)
    setReviewStatus(achievement.achievementStatus)
    setReviewComment(achievement.updateComment || "")
    setReviewIsPublic(achievement.isPublic)
    setIsReviewOpen(true)
  }

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAchievement) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/achievements/${selectedAchievement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievementStatus: reviewStatus,
          isPublic: reviewIsPublic,
          updateComment: reviewComment || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Achievement review updated successfully!")
        setIsReviewOpen(false)
        fetchAchievements()
      } else {
        toast.error("Failed to save review", {
          description: data.error || "Please try again.",
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error saving review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this achievement? This action cannot be undone.")) {
      return
    }

    try {
      const res = await fetch(`/api/admin/achievements/${id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Achievement deleted successfully by admin")
        fetchAchievements()
      } else {
        toast.error("Failed to delete achievement", {
          description: data.error || "Please try again.",
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error deleting achievement")
    }
  }

  const filteredAchievements = achievements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.user.name && a.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.user.email && a.user.email.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  // Auth gate
  if (status === "loading") {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-destructive">Access Denied</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This area is restricted to system administrators.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 text-white">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <Award className="h-6 w-6 text-primary" />
          Achievement Verification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review, approve, and configure landing-page showcases for student and faculty achievements.
        </p>
      </div>

      {/* Filter and search row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 border border-white/10 p-4 rounded-xl">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search submitter, title, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="w-full md:w-56">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent className="bg-[#181818] border-white/10 text-white">
              <SelectItem value="ALL" className="cursor-pointer">All Submissions</SelectItem>
              <SelectItem value="SUBMITTED" className="cursor-pointer">Pending (Submitted)</SelectItem>
              <SelectItem value="UNDER_REVIEW" className="cursor-pointer">Under Review</SelectItem>
              <SelectItem value="APPROVED" className="cursor-pointer">Approved</SelectItem>
              <SelectItem value="REJECTED" className="cursor-pointer">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-xl bg-black/40 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#c9f53b]" />
            <p className="text-sm text-white/55">Loading achievements portfolio...</p>
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/60">No achievements matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-white/10">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70 font-semibold">Submitter</TableHead>
                  <TableHead className="text-white/70 font-semibold">Title</TableHead>
                  <TableHead className="text-white/70 font-semibold">Category</TableHead>
                  <TableHead className="text-white/70 font-semibold">Year</TableHead>
                  <TableHead className="text-white/70 font-semibold">Status</TableHead>
                  <TableHead className="text-white/70 font-semibold">Showcase</TableHead>
                  <TableHead className="text-white/70 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAchievements.map((item) => (
                  <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div>
                        <div className="font-semibold text-white">{item.user.name || "Unknown User"}</div>
                        <div className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize text-[#c9f53b]">{item.user.role.toLowerCase()}</span>
                          {item.user.department && (
                            <>
                              <span className="text-white/20">|</span>
                              <span>{item.user.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-medium">{item.title}</TableCell>
                    <TableCell>{item.category || "General"}</TableCell>
                    <TableCell>{item.year}</TableCell>
                    <TableCell>
                      {item.achievementStatus === "APPROVED" && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10">
                          Approved
                        </Badge>
                      )}
                      {item.achievementStatus === "SUBMITTED" && (
                        <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/10">
                          Submitted
                        </Badge>
                      )}
                      {item.achievementStatus === "UNDER_REVIEW" && (
                        <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/10">
                          Under Review
                        </Badge>
                      )}
                      {item.achievementStatus === "REJECTED" && (
                        <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10">
                          Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.isPublic ? (
                        <Badge className="bg-[#c9f53b]/10 text-[#c9f53b] border border-[#c9f53b]/20 hover:bg-[#c9f53b]/10 flex items-center gap-1 w-max">
                          <Globe className="h-3 w-3" /> Public
                        </Badge>
                      ) : (
                        <Badge className="bg-white/5 text-white/50 border border-white/10 hover:bg-white/5 flex items-center gap-1 w-max">
                          <Lock className="h-3 w-3" /> Private
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-white/60 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#181818] border-white/10 text-white">
                          <DropdownMenuLabel>Audit actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => handleReviewOpen(item)}
                            className="hover:bg-white/10 cursor-pointer flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4 text-[#c9f53b]" /> Review & Verify
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAchievement(item.id)}
                            className="hover:bg-white/10 text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Delete submission
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl bg-[#0e0e0e] border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Achievement Submission</DialogTitle>
            <DialogDescription className="text-white/60">
              Verify credentials, review descriptions, check evidence documents, and set showcase status.
            </DialogDescription>
          </DialogHeader>
          {selectedAchievement && (
            <form onSubmit={handleSaveReview} className="space-y-4 py-2">
              {/* User Bio Card */}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-white/50 uppercase font-semibold">Submitter Info</span>
                <div className="flex items-center gap-3">
                  {selectedAchievement.user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedAchievement.user.image}
                      alt=""
                      className="h-10 w-10 rounded-full border border-white/10"
                    />
                  )}
                  <div>
                    <div className="font-semibold">{selectedAchievement.user.name || "Anonymous User"}</div>
                    <div className="text-xs text-white/50">
                      Email: {selectedAchievement.user.email} | Role: <span className="capitalize text-[#c9f53b]">{selectedAchievement.user.role.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-white/50 uppercase font-semibold">Title</span>
                <h3 className="text-lg font-bold text-[#c9f53b]">{selectedAchievement.title}</h3>
                <div className="text-xs text-white/60 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Category: {selectedAchievement.category || "General"} | Year: {selectedAchievement.year}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-white/50 uppercase font-semibold">Description</span>
                <p className="text-sm bg-white/5 border border-white/10 rounded-lg p-3 text-white/80 whitespace-pre-line max-h-40 overflow-y-auto">
                  {selectedAchievement.description}
                </p>
              </div>

              {/* Assets Section */}
              {(selectedAchievement.imageUrl || selectedAchievement.documentUrl) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  {selectedAchievement.imageUrl && (
                    <div className="border border-white/10 rounded-lg overflow-hidden h-32 relative group bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedAchievement.imageUrl}
                        alt="Poster Preview"
                        className="object-cover w-full h-full opacity-80"
                      />
                      <a
                        href={selectedAchievement.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs gap-1"
                      >
                        <Eye className="h-4 w-4" /> Open Full Image
                      </a>
                    </div>
                  )}
                  {selectedAchievement.documentUrl && (
                    <div className="border border-white/10 rounded-lg p-3 bg-white/5 flex items-center justify-between h-32">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold block">Evidence Proof</span>
                        <span className="text-[10px] text-white/40 block truncate max-w-[120px]">proof-doc.pdf</span>
                      </div>
                      <a
                        href={selectedAchievement.documentUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm" variant="outline" type="button" className="border-white/10 hover:bg-white/5">
                          <FileDown className="h-4 w-4 mr-1 text-[#c9f53b]" /> View File
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Audit inputs */}
              <div className="border-t border-white/10 pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="review-status" className="text-white/80">Audit Status Decision</Label>
                    <Select
                      value={reviewStatus}
                      onValueChange={(val) => setReviewStatus(val as any)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Status Decision" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181818] border-white/10 text-white">
                        <SelectItem value="SUBMITTED" className="cursor-pointer">Submitted (Pending)</SelectItem>
                        <SelectItem value="UNDER_REVIEW" className="cursor-pointer">Under Review</SelectItem>
                        <SelectItem value="APPROVED" className="cursor-pointer">Verify & Approve</SelectItem>
                        <SelectItem value="REJECTED" className="cursor-pointer">Reject submission</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between border border-white/10 p-3 rounded-lg bg-white/5">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-[#c9f53b]" /> Showcase Publicly
                      </Label>
                      <p className="text-xs text-white/50">Display on landing page carousel.</p>
                    </div>
                    <Switch
                      checked={reviewIsPublic}
                      onCheckedChange={setReviewIsPublic}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-comment" className="text-white/80">Review Notes / Feedback Comments</Label>
                  <Textarea
                    id="review-comment"
                    placeholder="Provide any feedback for the submitter or rejection reason comments..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReviewOpen(false)}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#c9f53b] hover:bg-[#b0d832] text-black font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Review...
                    </>
                  ) : (
                    "Save Audit"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
