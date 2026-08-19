"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  User,
  BookOpen,
  Building2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { isFacultyOrHigher } from "@/lib/auth/permissions"

interface VerificationRequest {
  id: string
  researchType: string
  researchId: string
  facultyName: string
  facultyEmail: string
  institution: string | null
  department: string | null
  designation: string | null
  orcidId: string | null
  affiliation: string | null
  status: string
  rejectionReason: string | null
  createdAt: string
  verifiedAt: string | null
  requestedBy: {
    name: string | null
    email: string | null
    image: string | null
  }
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
  PENDING: { label: "Pending", icon: Clock, color: "text-amber-500" },
  ACCEPTED: { label: "Accepted", icon: CheckCircle2, color: "text-green-500" },
  REJECTED: { label: "Rejected", icon: XCircle, color: "text-red-500" },
}

function renderResearchType(type: string) {
  return type.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function FacultyVerificationRequestsPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"PENDING" | "ACCEPTED" | "REJECTED">("PENDING")

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string; facultyName: string }>({
    open: false,
    requestId: "",
    facultyName: "",
  })
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userRole = session?.user?.role ?? "STUDENT"

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/faculty-verification")
      const data = await res.json()
      if (res.ok) {
        setRequests(data.requests ?? [])
      }
    } catch {
      toast({ title: "Error", description: "Failed to load verification requests", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchRequests()
    }
    // fetchRequests is stable (empty deps), so only re-run when auth status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-6 flex justify-center h-64 items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isFacultyOrHigher(userRole)) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center flex flex-col items-center gap-3">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="text-lg font-semibold text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground">This page is only accessible to faculty members and above.</p>
        </div>
      </div>
    )
  }

  const handleAccept = async (requestId: string, facultyName: string) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/faculty-verification/${requestId}/accept`, { method: "PATCH" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to accept")
      toast({ title: "Accepted", description: `Co-authorship with ${facultyName} accepted.` })
      await fetchRequests()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openRejectDialog = (requestId: string, facultyName: string) => {
    setRejectionReason("")
    setRejectDialog({ open: true, requestId, facultyName })
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({ title: "Required", description: "Please provide a rejection reason.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/faculty-verification/${rejectDialog.requestId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to reject")
      toast({ title: "Rejected", description: "Request rejected and student notified." })
      setRejectDialog({ open: false, requestId: "", facultyName: "" })
      await fetchRequests()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = requests.filter((r) => r.status === activeTab)

  const counts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    ACCEPTED: requests.filter((r) => r.status === "ACCEPTED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          Co-Author Verification Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and respond to co-author verification requests from students.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {(["PENDING", "ACCEPTED", "REJECTED"] as const).map((tab) => {
          const cfg = STATUS_CONFIG[tab]
          const Icon = cfg.icon
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              {cfg.label}
              {counts[tab] > 0 && (
                <Badge variant="secondary" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
                  {counts[tab]}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* Request cards */}
      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 text-sm">
          No {activeTab.toLowerCase()} requests.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const cfg = STATUS_CONFIG[req.status]
            const Icon = cfg.icon

            return (
              <Card key={req.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        {renderResearchType(req.researchType)} Co-Authorship Request
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        Requested by: <strong>{req.requestedBy.name ?? req.requestedBy.email ?? "Unknown"}</strong>
                        &nbsp;·&nbsp;
                        {new Date(req.createdAt).toLocaleDateString("en-IN")}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Faculty info listed by student */}
                  <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Your Listed Information
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>
                        <span className="text-muted-foreground text-xs">Name: </span>
                        <span>{req.facultyName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Email: </span>
                        <span>{req.facultyEmail}</span>
                      </div>
                      {req.institution && (
                        <div>
                          <span className="text-muted-foreground text-xs">Institution: </span>
                          <span>{req.institution}</span>
                        </div>
                      )}
                      {req.department && (
                        <div>
                          <span className="text-muted-foreground text-xs">Department: </span>
                          <span>{req.department}</span>
                        </div>
                      )}
                      {req.designation && (
                        <div>
                          <span className="text-muted-foreground text-xs">Designation: </span>
                          <span>{req.designation}</span>
                        </div>
                      )}
                      {req.orcidId && (
                        <div>
                          <span className="text-muted-foreground text-xs">ORCID: </span>
                          <span>{req.orcidId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {req.status === "REJECTED" && req.rejectionReason && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                      <p className="text-xs font-semibold text-destructive mb-1">Rejection Reason</p>
                      <p className="text-muted-foreground">{req.rejectionReason}</p>
                    </div>
                  )}

                  {req.status === "PENDING" && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(req.id, req.facultyName)}
                        disabled={isSubmitting}
                        className="bg-[#c9f53b] text-black hover:bg-[#c9f53b]/90 font-semibold"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRejectDialog(req.id, req.facultyName)}
                        disabled={isSubmitting}
                        className="border-destructive text-destructive hover:bg-destructive/5"
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => !o && setRejectDialog({ open: false, requestId: "", facultyName: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Co-Author Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the co-authorship request from <strong>{rejectDialog.facultyName}</strong>.
              The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason <span className="text-destructive">*</span></Label>
            <Textarea
              id="reason"
              placeholder="e.g., I am not involved in this research / The information listed is incorrect…"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, requestId: "", facultyName: "" })}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              variant="destructive"
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Rejecting…</> : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
