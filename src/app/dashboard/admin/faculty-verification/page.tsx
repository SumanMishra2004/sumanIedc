"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  User,
  BookOpen,
  MoreHorizontal,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { isAdminOrHigher } from "@/lib/auth/permissions"

interface VerificationRequest {
  id: string
  researchType: string
  researchId: string
  facultyName: string
  facultyEmail: string
  institution: string | null
  department: string | null
  designation: string | null
  status: string
  rejectionReason: string | null
  overrideBy: string | null
  overrideAt: string | null
  overrideReason: string | null
  createdAt: string
  verifiedAt: string | null
  requestedBy: {
    name: string | null
    email: string | null
  }
}

const STATUS_CONFIG: Record<string, { icon: React.FC<{ className?: string }>; color: string }> = {
  PENDING: { icon: Clock, color: "text-amber-500" },
  ACCEPTED: { icon: CheckCircle2, color: "text-green-500" },
  REJECTED: { icon: XCircle, color: "text-red-500" },
}

export default function AdminFacultyVerificationPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Override dialog
  const [overrideDialog, setOverrideDialog] = useState<{
    open: boolean
    requestId: string
    action: "accept" | "reject"
    facultyName: string
  }>({ open: false, requestId: "", action: "accept", facultyName: "" })
  const [overrideReason, setOverrideReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userRole = session?.user?.role ?? "STUDENT"

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/faculty-verification")
      const data = await res.json()
      if (res.ok) setRequests(data.requests ?? [])
    } catch {
      toast({ title: "Error", description: "Failed to load", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status === "authenticated") fetchRequests()
    // fetchRequests is stable (empty deps), so only re-run when auth status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-5xl p-6 flex justify-center h-64 items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdminOrHigher(userRole)) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center flex flex-col items-center gap-3">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="text-lg font-semibold text-destructive">Access Denied</p>
        </div>
      </div>
    )
  }

  const filtered = requests.filter((r) => {
    const matchSearch =
      !search ||
      r.facultyName.toLowerCase().includes(search.toLowerCase()) ||
      r.facultyEmail.toLowerCase().includes(search.toLowerCase()) ||
      (r.requestedBy.name ?? "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const openOverrideDialog = (requestId: string, action: "accept" | "reject", facultyName: string) => {
    setOverrideReason("")
    setOverrideDialog({ open: true, requestId, action, facultyName })
  }

  const handleOverride = async () => {
    if (!overrideReason.trim()) {
      toast({ title: "Required", description: "Override reason is required for audit purposes.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/faculty-verification/${overrideDialog.requestId}/admin-override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: overrideDialog.action, overrideReason: overrideReason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Override failed")
      toast({ title: "Override applied", description: `${overrideDialog.facultyName}'s request has been ${overrideDialog.action}ed.` })
      setOverrideDialog({ open: false, requestId: "", action: "accept", facultyName: "" })
      await fetchRequests()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <Shield className="h-6 w-6 text-primary" />
          Faculty Verification Records
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all faculty co-author verification requests. Use overrides only when necessary.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search by faculty name, email, or student…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <div className="flex gap-1">
          {["all", "PENDING", "ACCEPTED", "REJECTED"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="text-xs"
            >
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} record(s)</p>

      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 text-sm">No records found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const cfg = STATUS_CONFIG[req.status]
            const Icon = cfg.icon

            return (
              <Card key={req.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        {req.researchType.replace(/_/g, " ")} — {req.facultyName}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        <User className="h-3 w-3 inline mr-1" />
                        By {req.requestedBy.name ?? req.requestedBy.email ?? "?"} ·{" "}
                        {new Date(req.createdAt).toLocaleDateString("en-IN")}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {req.status}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-xs">Admin Override</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openOverrideDialog(req.id, "accept", req.facultyName)}
                            className="text-green-600 focus:text-green-600"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                            Override: Accept
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openOverrideDialog(req.id, "reject", req.facultyName)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-2" />
                            Override: Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Email:</span> {req.facultyEmail}</p>
                  {req.institution && <p><span className="font-medium text-foreground">Institution:</span> {req.institution}</p>}
                  {req.department && <p><span className="font-medium text-foreground">Department:</span> {req.department}</p>}
                  {req.rejectionReason && (
                    <p className="text-red-500"><span className="font-medium">Rejection Reason:</span> {req.rejectionReason}</p>
                  )}
                  {req.overrideBy && (
                    <p className="text-amber-600">
                      <span className="font-medium">Admin Override:</span> {req.overrideReason}{" "}
                      {req.overrideAt && `(${new Date(req.overrideAt).toLocaleDateString("en-IN")})`}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Override dialog */}
      <Dialog
        open={overrideDialog.open}
        onOpenChange={(o) => !o && setOverrideDialog({ open: false, requestId: "", action: "accept", facultyName: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Override — {overrideDialog.action === "accept" ? "Accept" : "Reject"}</DialogTitle>
            <DialogDescription>
              This is an administrative override for <strong>{overrideDialog.facultyName}</strong>.
              A reason is required and will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="override-reason">Override Reason <span className="text-destructive">*</span></Label>
            <Textarea
              id="override-reason"
              placeholder="Explain the administrative justification for this override…"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOverrideDialog({ open: false, requestId: "", action: "accept", facultyName: "" })}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={isSubmitting || !overrideReason.trim()}
              variant={overrideDialog.action === "accept" ? "default" : "destructive"}
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing…</> : "Apply Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
