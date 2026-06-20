"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Eye,
  FileEdit,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  User,
  Phone,
  Link as LinkIcon,
  DollarSign
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { uploadFile } from "@/lib/appwrite"
import { ImageCropModal } from "@/components/ui/ImageCropModal"
import { useImageCrop } from "@/hooks/useImageCrop"

interface Event {
  id: string
  name: string
  posterUrl: string | null
  registrationCost: number | null
  description: string
  registrationLink: string
  contactName: string
  contactPhone: string
  eventDate: string
  createdAt: string
}

export default function AdminEventsPage() {
  const { data: session, status } = useSession()
  const [events, setEvents] = React.useState<Event[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Crop modal for event posters (3:4 ratio)
  const { cropState, openCrop, closeCrop } = useImageCrop()
  const createPosterInputRef = React.useRef<HTMLInputElement>(null)
  const editPosterInputRef = React.useRef<HTMLInputElement>(null)

  // Modal control
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [registrationLink, setRegistrationLink] = React.useState("")
  const [registrationCost, setRegistrationCost] = React.useState("")
  const [contactName, setContactName] = React.useState("")
  const [contactPhone, setContactPhone] = React.useState("")
  const [eventDate, setEventDate] = React.useState("")
  const [posterFile, setPosterFile] = React.useState<File | null>(null)

  // Edit form state
  const [editName, setEditName] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")
  const [editRegistrationLink, setEditRegistrationLink] = React.useState("")
  const [editRegistrationCost, setEditRegistrationCost] = React.useState("")
  const [editContactName, setEditContactName] = React.useState("")
  const [editContactPhone, setEditContactPhone] = React.useState("")
  const [editEventDate, setEditEventDate] = React.useState("")
  const [editPosterFile, setEditPosterFile] = React.useState<File | null>(null)

  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/events")
      const data = await res.json()
      if (res.ok) {
        setEvents(data.events || [])
      } else {
        toast.error("Failed to load events", {
          description: data.error || "Something went wrong",
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch events from API")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      // Schedule fetch asynchronously to avoid triggering synchronous setState within the effect
      const id = window.setTimeout(() => {
        fetchEvents()
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [session])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !description || !registrationLink || !contactName || !contactPhone || !eventDate) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    let posterUrl = ""

    try {
      if (posterFile) {
        toast.info("Uploading event poster...")
        posterUrl = await uploadFile(posterFile)
      }

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          registrationLink,
          registrationCost: registrationCost ? parseFloat(registrationCost) : null,
          contactName,
          contactPhone,
          eventDate,
          posterUrl: posterUrl || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Event created successfully!")
        setIsCreateOpen(false)
        resetCreateForm()
        fetchEvents()
      } else {
        toast.error("Failed to create event", {
          description: data.error || "Verify inputs and try again.",
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error occurred while creating event")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditOpen = (event: Event) => {
    setSelectedEvent(event)
    setEditName(event.name)
    setEditDescription(event.description)
    setEditRegistrationLink(event.registrationLink)
    setEditRegistrationCost(event.registrationCost !== null ? String(event.registrationCost) : "")
    setEditContactName(event.contactName)
    setEditContactPhone(event.contactPhone)
    // Convert eventDate ISO string to local datetime-local input string
    const d = new Date(event.eventDate)
    const offset = d.getTimezoneOffset()
    const localTime = new Date(d.getTime() - offset * 60 * 1000)
    setEditEventDate(localTime.toISOString().slice(0, 16))
    setEditPosterFile(null)
    setIsEditOpen(true)
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return
    if (!editName || !editDescription || !editRegistrationLink || !editContactName || !editContactPhone || !editEventDate) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    let posterUrl = selectedEvent.posterUrl

    try {
      if (editPosterFile) {
        toast.info("Uploading new event poster...")
        posterUrl = await uploadFile(editPosterFile)
      }

      const res = await fetch(`/api/admin/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          registrationLink: editRegistrationLink,
          registrationCost: editRegistrationCost ? parseFloat(editRegistrationCost) : null,
          contactName: editContactName,
          contactPhone: editContactPhone,
          eventDate: editEventDate,
          posterUrl,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Event updated successfully!")
        setIsEditOpen(false)
        fetchEvents()
      } else {
        toast.error("Failed to update event", {
          description: data.error || "Verify inputs and try again.",
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error occurred while updating event")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event? This will remove it from the database.")) {
      return
    }

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Event deleted successfully")
        fetchEvents()
      } else {
        toast.error("Failed to delete event", {
          description: data.error || "Please try again.",
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error deleting event")
    }
  }

  const resetCreateForm = () => {
    setName("")
    setDescription("")
    setRegistrationLink("")
    setRegistrationCost("")
    setContactName("")
    setContactPhone("")
    setEventDate("")
    setPosterFile(null)
  }

  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Auth gate
  if (status === "loading") {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 w-full" />
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
      {/* Crop modal for event posters */}
      {cropState.open && (
        <ImageCropModal
          src={cropState.src}
          ratio={cropState.ratio}
          fileName={cropState.fileName}
          onCrop={cropState.onCrop}
          onCancel={closeCrop}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <CalendarDays className="h-6 w-6 text-primary" />
            Event Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, update, and manage upcoming institutional events and registrations.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#c9f53b] hover:bg-[#b0d832] text-black font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Create New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[#0e0e0e] border-white/10 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Upcoming Event</DialogTitle>
              <DialogDescription className="text-white/60">
                Publish a new event details, registration cost, poster, and registration links.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-name" className="text-white/80">Event Name *</Label>
                  <Input
                    id="event-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hackathon 2026"
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-date" className="text-white/80">Event Date & Time *</Label>
                  <Input
                    id="event-date"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-cost" className="text-white/80">Registration Cost (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="reg-cost"
                      type="number"
                      placeholder="Free or amount"
                      value={registrationCost}
                      onChange={(e) => setRegistrationCost(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-link" className="text-white/80">Registration URL Link *</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="reg-link"
                      placeholder="https://docs.google.com/forms/..."
                      value={registrationLink}
                      onChange={(e) => setRegistrationLink(e.target.value)}
                      required
                      className="pl-9 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-white/80">Contact Person Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="contact-name"
                      placeholder="Coordinator Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="pl-9 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone" className="text-white/80">Contact Person Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="contact-phone"
                      placeholder="Phone Number"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                      className="pl-9 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-desc" className="text-white/80">Description *</Label>
                <Textarea
                  id="event-desc"
                  placeholder="Provide details about the schedule, tracks, and guest speakers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <Label htmlFor="poster" className="text-white/80 flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Upload Event Poster (Optional) — 3:4 portrait
                </Label>
                {/* Hidden file input — opens crop on selection */}
                <input
                  ref={createPosterInputRef}
                  id="poster"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    e.target.value = ""
                    openCrop(file, "poster", (cropped) => {
                      closeCrop()
                      setPosterFile(cropped)
                    })
                  }}
                />
                <button
                  type="button"
                  onClick={() => createPosterInputRef.current?.click()}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-sm transition-colors"
                >
                  <Upload className="h-4 w-4 shrink-0" />
                  {posterFile ? posterFile.name : "Choose poster image…"}
                </button>
                {posterFile && (
                  <p className="text-xs text-[#c9f53b]/70">
                    ✓ Cropped to 3:4 — ready to upload
                  </p>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    "Publish Event"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-4 rounded-xl">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="border border-white/10 rounded-xl bg-black/40 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#c9f53b]" />
            <p className="text-sm text-white/55">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/60">No events found.</p>
            <p className="text-xs text-white/40 mt-1">Publish your first upcoming event above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-white/10">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70 font-semibold">Event Name</TableHead>
                  <TableHead className="text-white/70 font-semibold">Date & Time</TableHead>
                  <TableHead className="text-white/70 font-semibold">Registration Cost</TableHead>
                  <TableHead className="text-white/70 font-semibold">Contact Person</TableHead>
                  <TableHead className="text-white/70 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((item) => (
                  <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-semibold flex items-center gap-3">
                      {item.posterUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.posterUrl}
                          alt=""
                          className="h-12 w-9 rounded object-cover border border-white/10 shrink-0"
                          style={{ aspectRatio: "3/4" }}
                        />
                      )}
                      <div>
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-xs text-white/40 max-w-xs truncate">{item.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-white/55" />
                        {new Date(item.eventDate).toLocaleString("default", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.registrationCost !== null && item.registrationCost > 0 ? (
                        <Badge className="bg-[#c9f53b]/10 text-[#c9f53b] border border-[#c9f53b]/20 hover:bg-[#c9f53b]/10">
                          ${item.registrationCost}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10">
                          Free
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{item.contactName}</div>
                        <div className="text-xs text-white/40">{item.contactPhone}</div>
                      </div>
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
                            onClick={() => handleEditOpen(item)}
                            className="hover:bg-white/10 cursor-pointer flex items-center gap-2"
                          >
                            <FileEdit className="h-4 w-4 text-orange-400" /> Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              window.open(item.registrationLink, "_blank")
                            }}
                            className="hover:bg-white/10 cursor-pointer flex items-center gap-2"
                          >
                            <LinkIcon className="h-4 w-4 text-blue-400" /> Go to Reg Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteEvent(item.id)}
                            className="hover:bg-white/10 text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
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

      {/* Edit Event Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl bg-[#0e0e0e] border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event Details</DialogTitle>
            <DialogDescription className="text-white/60">
              Update the fields below to adjust event scheduling, information or poster.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEvent} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-event-name" className="text-white/80">Event Name *</Label>
                <Input
                  id="edit-event-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-event-date" className="text-white/80">Event Date & Time *</Label>
                <Input
                  id="edit-event-date"
                  type="datetime-local"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-reg-cost" className="text-white/80">Registration Cost (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="edit-reg-cost"
                    type="number"
                    value={editRegistrationCost}
                    onChange={(e) => setEditRegistrationCost(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reg-link" className="text-white/80">Registration URL Link *</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="edit-reg-link"
                    value={editRegistrationLink}
                    onChange={(e) => setEditRegistrationLink(e.target.value)}
                    required
                    className="pl-9 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contact-name" className="text-white/80">Contact Person Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="edit-contact-name"
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                    required
                    className="pl-9 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact-phone" className="text-white/80">Contact Person Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="edit-contact-phone"
                    value={editContactPhone}
                    onChange={(e) => setEditContactPhone(e.target.value)}
                    required
                    className="pl-9 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-event-desc" className="text-white/80">Description *</Label>
              <Textarea
                id="edit-event-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
                rows={4}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2 border-t border-white/10 pt-4">
              <Label htmlFor="edit-poster" className="text-white/80 flex items-center gap-2">
                <Upload className="h-4 w-4" /> Replace Event Poster (Optional) — 3:4 portrait
              </Label>
              <input
                ref={editPosterInputRef}
                id="edit-poster"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  e.target.value = ""
                  openCrop(file, "poster", (cropped) => {
                    closeCrop()
                    setEditPosterFile(cropped)
                  })
                }}
              />
              <button
                type="button"
                onClick={() => editPosterInputRef.current?.click()}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-sm transition-colors"
              >
                <Upload className="h-4 w-4 shrink-0" />
                {editPosterFile ? editPosterFile.name : "Choose replacement poster…"}
              </button>
              {editPosterFile && (
                <p className="text-xs text-[#c9f53b]/70">✓ Cropped to 3:4 — ready to upload</p>
              )}
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
