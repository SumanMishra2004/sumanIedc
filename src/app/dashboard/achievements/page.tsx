"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileDown,
  Globe,
  Loader2,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  AlertCircle,
  Edit2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge"
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
import { uploadFile } from "@/lib/appwrite"
import { ImageCropModal } from "@/components/ui/ImageCropModal"
import { useImageCrop } from "@/hooks/useImageCrop"

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
}

const CATEGORIES = [
  "Quantum Computing",
  "BioTech",
  "AI & Vision",
  "Space Tech",
  "Cybersecurity",
  "Robotics",
  "General",
  "Other"
]

const YEARS = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i))

export default function UserAchievementsPage() {
  const { data: session } = useSession()
  const [achievements, setAchievements] = React.useState<Achievement[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState("ALL")

  // Modals state
  const [isSubmitOpen, setIsSubmitOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isViewOpen, setIsViewOpen] = React.useState(false)
  const [selectedAchievement, setSelectedAchievement] = React.useState<Achievement | null>(null)

  // Crop modal for achievement poster images
  const { cropState, openCrop, closeCrop } = useImageCrop()

  // File input refs for crop flow
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const editImageInputRef = React.useRef<HTMLInputElement>(null)

  // Form states
  const [submitTitle, setSubmitTitle] = React.useState("")
  const [submitDesc, setSubmitDesc] = React.useState("")
  const [submitCat, setSubmitCat] = React.useState("")
  const [submitYear, setSubmitYear] = React.useState(String(new Date().getFullYear()))
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [proofFile, setProofFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Edit states
  const [editTitle, setEditTitle] = React.useState("")
  const [editDesc, setEditDesc] = React.useState("")
  const [editCat, setEditCat] = React.useState("")
  const [editYear, setEditYear] = React.useState("")
  const [editImageFile, setEditImageFile] = React.useState<File | null>(null)
  const [editProofFile, setEditProofFile] = React.useState<File | null>(null)

  const fetchAchievements = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/research/achievement")
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
      toast.error("Failed to fetch achievements")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchAchievements()
  }, [])

  const resetSubmitForm = () => {
    setSubmitTitle("")
    setSubmitDesc("")
    setSubmitCat("")
    setSubmitYear(String(new Date().getFullYear()))
    setImageFile(null)
    setProofFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submitTitle || !submitDesc || !submitYear) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    let imageUrl = ""
    let documentUrl = ""

    try {
      if (imageFile) {
        toast.info("Uploading image poster...")
        imageUrl = await uploadFile(imageFile)
      }
      if (proofFile) {
        toast.info("Uploading proof document...")
        documentUrl = await uploadFile(proofFile)
      }

      const res = await fetch("/api/research/achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: submitTitle,
          description: submitDesc,
          category: submitCat || null,
          year: submitYear,
          imageUrl: imageUrl || null,
          documentUrl: documentUrl || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Achievement submitted successfully!", {
          description: "An admin will review your submission shortly.",
        })
        setIsSubmitOpen(false)
        resetSubmitForm()
        fetchAchievements()
      } else {
        toast.error("Failed to submit achievement", {
          description: data.error || "Please try again.",
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error submitting achievement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditOpen = (achievement: Achievement) => {
    setSelectedAchievement(achievement)
    setEditTitle(achievement.title)
    setEditDesc(achievement.description)
    setEditCat(achievement.category || "")
    setEditYear(achievement.year)
    setEditImageFile(null)
    setEditProofFile(null)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAchievement) return
    if (!editTitle || !editDesc || !editYear) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    let imageUrl = selectedAchievement.imageUrl
    let documentUrl = selectedAchievement.documentUrl

    try {
      if (editImageFile) {
        toast.info("Uploading new image poster...")
        imageUrl = await uploadFile(editImageFile)
      }
      if (editProofFile) {
        toast.info("Uploading new proof document...")
        documentUrl = await uploadFile(editProofFile)
      }

      const res = await fetch(`/api/research/achievement/${selectedAchievement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          category: editCat || null,
          year: editYear,
          imageUrl,
          documentUrl,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Achievement updated successfully!", {
          description: "Submission set back to pending review.",
        })
        setIsEditOpen(false)
        fetchAchievements()
      } else {
        toast.error("Failed to update achievement", {
          description: data.error || "Please try again.",
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error updating achievement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this achievement? This action cannot be undone.")) {
      return
    }

    try {
      const res = await fetch(`/api/research/achievement/${id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Achievement deleted successfully")
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

  // Filters logic
  const filteredAchievements = achievements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategoryFilter === "ALL" || a.category === selectedCategoryFilter

    return matchesSearch && matchesCategory
  })

  // Stats calculation
  const totalCount = achievements.length
  const approvedCount = achievements.filter((a) => a.achievementStatus === "APPROVED").length
  const pendingCount = achievements.filter((a) => a.achievementStatus === "SUBMITTED" || a.achievementStatus === "UNDER_REVIEW").length
  const publicCount = achievements.filter((a) => a.isPublic).length

  return (
    <div className="w-full h-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Manage your submissions, track approval statuses, and configure landing page features.
          </p>
        </div>
        <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-[#c9f53b] hover:bg-[#b0d832] text-black font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Submit Achievement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[#0e0e0e] border-white/10 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Academic / Innovation Achievement</DialogTitle>
              <DialogDescription className="text-white/60">
                Submit details of your project, lab award, patent grant, or standard academic achievements. Admin verification is required before showcasing.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white/80">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter achievement title"
                    value={submitTitle}
                    onChange={(e) => setSubmitTitle(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white/80">Category</Label>
                  <Select value={submitCat} onValueChange={setSubmitCat}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181818] border-white/10 text-white">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="hover:bg-white/10 cursor-pointer">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-white/80">Year *</Label>
                  <Select value={submitYear} onValueChange={setSubmitYear}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181818] border-white/10 text-white">
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y} className="hover:bg-white/10 cursor-pointer">
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc" className="text-white/80">Description *</Label>
                <Textarea
                  id="desc"
                  placeholder="Provide a detailed description of the achievement or innovation breakthroughs..."
                  value={submitDesc}
                  onChange={(e) => setSubmitDesc(e.target.value)}
                  required
                  rows={4}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-white/80 flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Poster / Image (Optional) — 3:4
                  </Label>
                  <input
                    ref={imageInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      e.target.value = ""
                      openCrop(file, "poster", (cropped) => {
                        closeCrop()
                        setImageFile(cropped)
                      })
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-sm transition-colors"
                  >
                    <Upload className="h-4 w-4 shrink-0" />
                    {imageFile ? imageFile.name : "Choose poster image…"}
                  </button>
                  {imageFile && (
                    <p className="text-xs text-[#c9f53b]">✓ Cropped to 3:4 — ready to upload</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof" className="text-white/80 flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Verification Proof PDF (Optional)
                  </Label>
                  <Input
                    id="proof"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="bg-white/5 border-white/10 text-white cursor-pointer"
                  />
                  {proofFile && (
                    <p className="text-xs text-[#c9f53b]">Selected: {proofFile.name}</p>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubmitOpen(false)}
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-dashed border-2 border-chart-1 bg-black/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submitted</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#c9f53b]" />
            ) : (
              <div className="text-2xl font-bold">{totalCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">All portfolios submitted</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-chart-2 bg-black/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#c9f53b]" />
            ) : (
              <div className="text-2xl font-bold text-emerald-500">{approvedCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Verified achievements</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-chart-3 bg-black/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Under Review / Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#c9f53b]" />
            ) : (
              <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Awaiting admin verification</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-chart-4 bg-black/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Public Showcase</CardTitle>
            <Globe className="h-4 w-4 text-[#c9f53b]" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#c9f53b]" />
            ) : (
              <div className="text-2xl font-bold text-[#c9f53b]">{publicCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Visible on public homepage</p>
          </CardContent>
        </Card>
      </div>

      {/* Table & Filters Section */}
      <div className="border border-white/10 rounded-xl bg-black/40 overflow-hidden text-white p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search title, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="w-full md:w-56">
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Filter Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#181818] border-white/10 text-white">
                <SelectItem value="ALL" className="hover:bg-white/10 cursor-pointer">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="hover:bg-white/10 cursor-pointer">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#c9f53b]" />
            <p className="text-sm text-white/55">Loading achievements...</p>
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
            <AlertCircle className="h-10 w-10 mx-auto text-white/30 mb-2" />
            <p className="text-white/60">No achievements found.</p>
            <p className="text-xs text-white/40 mt-1">Submit your first academic or innovation award above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-white/10">
                <TableRow className="border-white/10 hover:bg-transparent">
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
                    <TableCell className="font-medium max-w-xs truncate">{item.title}</TableCell>
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAchievement(item)
                              setIsViewOpen(true)
                            }}
                            className="hover:bg-white/10 cursor-pointer flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4 text-blue-400" /> View Details
                          </DropdownMenuItem>

                          {item.achievementStatus !== "APPROVED" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleEditOpen(item)}
                                className="hover:bg-white/10 cursor-pointer flex items-center gap-2"
                              >
                                <Edit2 className="h-4 w-4 text-orange-400" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(item.id)}
                                className="hover:bg-white/10 text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl bg-[#0e0e0e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Achievement Details</DialogTitle>
          </DialogHeader>
          {selectedAchievement && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs text-white/50">Submitted on {new Date(selectedAchievement.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <Badge className={
                    selectedAchievement.achievementStatus === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    selectedAchievement.achievementStatus === "SUBMITTED" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                    selectedAchievement.achievementStatus === "UNDER_REVIEW" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }>
                    {selectedAchievement.achievementStatus}
                  </Badge>
                  {selectedAchievement.isPublic && (
                    <Badge className="bg-[#c9f53b]/10 text-[#c9f53b] border border-[#c9f53b]/20">Public Showcase</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#c9f53b]">{selectedAchievement.title}</h3>
                <p className="text-xs text-white/60 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Category: {selectedAchievement.category || "General"} | Year: {selectedAchievement.year}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-white/60">Description</span>
                <p className="text-sm bg-white/5 border border-white/10 rounded-lg p-3 text-white/80 whitespace-pre-line">
                  {selectedAchievement.description}
                </p>
              </div>

              {selectedAchievement.updateComment && (
                <div className="space-y-1 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-amber-300">
                  <span className="text-xs font-semibold block">Admin Feedback / Review Notes:</span>
                  <p className="text-sm">{selectedAchievement.updateComment}</p>
                </div>
              )}

              {/* Assets Section */}
              {(selectedAchievement.imageUrl || selectedAchievement.documentUrl) && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <span className="text-xs font-semibold text-white/60">Attached Artifacts</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedAchievement.imageUrl && (
                      <div className="relative group border border-white/10 rounded-lg overflow-hidden h-32 bg-black">
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
                          <span className="text-xs font-semibold block">Verification Proof</span>
                          <span className="text-[10px] text-white/40 block truncate max-w-[120px]">Proof Document.pdf</span>
                        </div>
                        <a
                          href={selectedAchievement.documentUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/5">
                            <FileDown className="h-4 w-4 mr-1 text-[#c9f53b]" /> View
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="border-t border-white/10 pt-4">
            <Button variant="outline" onClick={() => setIsViewOpen(false)} className="border-white/10 text-white hover:bg-white/5">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl bg-[#0e0e0e] border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Achievement Details</DialogTitle>
            <DialogDescription className="text-white/60">
              Update your submission details. Upon saving, your status will return to pending review.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-white/80">Title *</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-white/80">Category</Label>
                <Select value={editCat} onValueChange={setEditCat}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181818] border-white/10 text-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="hover:bg-white/10 cursor-pointer">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-year" className="text-white/80">Year *</Label>
                <Select value={editYear} onValueChange={setEditYear}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181818] border-white/10 text-white">
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y} className="hover:bg-white/10 cursor-pointer">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-desc" className="text-white/80">Description *</Label>
              <Textarea
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                required
                rows={4}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-image" className="text-white/80 flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Replace Poster Image (Optional)
                </Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                  className="bg-white/5 border-white/10 text-white cursor-pointer"
                />
                {editImageFile && (
                  <p className="text-xs text-[#c9f53b]">Selected: {editImageFile.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-proof" className="text-white/80 flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Replace Proof PDF (Optional)
                </Label>
                <Input
                  id="edit-proof"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setEditProofFile(e.target.files?.[0] || null)}
                  className="bg-white/5 border-white/10 text-white cursor-pointer"
                />
                {editProofFile && (
                  <p className="text-xs text-[#c9f53b]">Selected: {editProofFile.name}</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
