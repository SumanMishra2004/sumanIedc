"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, User, BookOpen, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  createdAt: string
  requestedBy: {
    name: string | null
    email: string | null
    image: string | null
  }
}

type PageState =
  | { stage: "loading" }
  | { stage: "valid"; request: VerificationRequest }
  | { stage: "already_used"; status: string; request: VerificationRequest }
  | { stage: "expired"; request: VerificationRequest }
  | { stage: "resolved"; status: string }
  | { stage: "error"; message: string }
  | { stage: "success"; action: "accept" | "reject" }

function FacultyVerificationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { toast } = useToast()

  const [state, setState] = useState<PageState>({ stage: "loading" })
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setState({ stage: "error", message: "No verification token provided." })
      return
    }

    fetch(`/api/faculty-verification/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setState({ stage: "valid", request: data.request })
        } else if (data.code === "TOKEN_ALREADY_USED") {
          setState({ stage: "already_used", status: data.status, request: data.request })
        } else if (data.code === "TOKEN_EXPIRED") {
          setState({ stage: "expired", request: data.request })
        } else if (data.code === "REQUEST_RESOLVED") {
          setState({ stage: "resolved", status: data.status })
        } else {
          setState({ stage: "error", message: data.error || "Verification failed." })
        }
      })
      .catch(() => setState({ stage: "error", message: "Failed to connect to the server. Please try again." }))
  }, [token])

  const handleAction = async (action: "accept" | "reject") => {
    if (!token) return

    if (action === "reject" && !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting the co-authorship.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/faculty-verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action,
          rejectionReason: action === "reject" ? rejectionReason.trim() : undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setState({ stage: "success", action })
      } else {
        toast({
          title: "Action failed",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Network error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderResearchType = (type: string) => {
    return type.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  if (state.stage === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#c9f53b]" />
        <p className="text-muted-foreground text-sm">Verifying your token…</p>
      </div>
    )
  }

  if (state.stage === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#c9f53b]/10 border-2 border-[#c9f53b]">
          {state.action === "accept" ? (
            <CheckCircle2 className="h-10 w-10 text-[#c9f53b]" />
          ) : (
            <XCircle className="h-10 w-10 text-red-500" />
          )}
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {state.action === "accept" ? "Co-authorship Accepted" : "Co-authorship Rejected"}
          </h1>
          <p className="text-muted-foreground max-w-sm">
            {state.action === "accept"
              ? "Thank you! Your co-authorship has been verified. The student has been notified."
              : "You have rejected the co-authorship request. The student has been notified."}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">You can safely close this page.</p>
      </div>
    )
  }

  if (state.stage === "already_used") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Link Already Used</h1>
          <p className="text-muted-foreground text-sm">
            This verification link has already been used. The request status is{" "}
            <Badge variant="outline">{state.status}</Badge>.
          </p>
        </div>
      </div>
    )
  }

  if (state.stage === "expired") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <Clock className="h-12 w-12 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Link Expired</h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            This verification link has expired. Please ask the student to create a new verification request.
          </p>
        </div>
      </div>
    )
  }

  if (state.stage === "resolved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Already Resolved</h1>
          <p className="text-muted-foreground text-sm">
            This request has already been resolved with status{" "}
            <Badge variant="outline">{state.status}</Badge>.
          </p>
        </div>
      </div>
    )
  }

  if (state.stage === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <XCircle className="h-12 w-12 text-destructive" />
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Verification Error</h1>
          <p className="text-muted-foreground text-sm">{state.message}</p>
        </div>
      </div>
    )
  }

  // stage === "valid"
  const { request } = state

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9f53b] text-black font-bold text-lg">
              I
            </div>
            <span className="text-lg font-bold">IEDC Research Portal</span>
          </div>
          <h1 className="text-2xl font-bold">Co-Author Verification</h1>
          <p className="text-muted-foreground text-sm">
            A student has listed you as a co-author. Please review the details below and confirm or reject.
          </p>
        </div>

        {/* Request details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-[#c9f53b]" />
              Research Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Type</p>
                <Badge variant="secondary">{renderResearchType(request.researchType)}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Submitted on</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {new Date(request.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-muted-foreground text-xs mb-2">Requested by student</p>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{request.requestedBy.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{request.requestedBy.email}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-muted-foreground text-xs mb-2">Your listed information</p>
              <div className="space-y-1">
                <p><span className="text-muted-foreground">Name:</span> {request.facultyName}</p>
                <p><span className="text-muted-foreground">Email:</span> {request.facultyEmail}</p>
                {request.institution && <p><span className="text-muted-foreground">Institution:</span> {request.institution}</p>}
                {request.department && <p><span className="text-muted-foreground">Department:</span> {request.department}</p>}
                {request.designation && <p><span className="text-muted-foreground">Designation:</span> {request.designation}</p>}
                {request.orcidId && <p><span className="text-muted-foreground">ORCID:</span> {request.orcidId}</p>}
                {request.affiliation && <p><span className="text-muted-foreground">Affiliation:</span> {request.affiliation}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action section */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Decision</CardTitle>
            <CardDescription>
              If you accept, you confirm that you are a co-author of this submission.
              If you reject, the listing will be marked as rejected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-sm">
                Rejection Reason <span className="text-muted-foreground">(required only if rejecting)</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="If rejecting, briefly explain why (e.g., incorrect information, not involved in this work)…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleAction("accept")}
                disabled={isSubmitting}
                className="flex-1 bg-[#c9f53b] text-black hover:bg-[#c9f53b]/90 font-semibold"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Accept Co-Authorship
              </Button>

              <Button
                onClick={() => handleAction("reject")}
                disabled={isSubmitting}
                variant="outline"
                className="flex-1 border-destructive text-destructive hover:bg-destructive/5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          This link is single-use and will expire after use. If you did not expect this request, you can safely ignore it.
        </p>
      </div>
    </div>
  )
}

export default function FacultyVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-[#c9f53b]" />
        </div>
      }
    >
      <FacultyVerificationContent />
    </Suspense>
  )
}
