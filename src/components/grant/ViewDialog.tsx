"use client"

import * as React from "react"
import {
  Loader2,
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  Edit,
  Trash2,
  Link2,
  Receipt,
} from "lucide-react"
import { UserRole, GrantInRole } from "@prisma/client"
import { format } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import type { GrantIn } from "@/types/grant-in"
import { getGrantInById } from "@/lib/research/grant-in"
import { GrantEditDialog } from "./GrantEditForm"
import { BillsSection } from "./bills/BillsSection"
import { GrantOutputDialog } from "./GrantOutputDialog"

interface GrantViewDialogProps {
  grantId: string | null
  open: boolean
  setOpen: (open: boolean) => void
  userRole: UserRole
  currentUserId: string
  onDelete?: (grant: GrantIn) => void
}

export function GrantViewDialog({
  grantId,
  open,
  setOpen,
  userRole,
  currentUserId,
  onDelete,
}: GrantViewDialogProps) {
  const [grant, setGrant] = React.useState<GrantIn | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [outputOpen, setOutputOpen] = React.useState(false)
  const [billsOpen, setBillsOpen] = React.useState(false)

  const fetchGrant = React.useCallback(async () => {
    if (!grantId) return
    setLoading(true)
    setError(null)
    try {
      const response = await getGrantInById(grantId)
      if (!response.data?.grantIn) {
        setError("Unable to load grant details")
        return
      }
      setGrant(response.data.grantIn)
    } catch {
      setError("Failed to fetch grant details")
    } finally {
      setLoading(false)
    }
  }, [grantId])

  React.useEffect(() => {
    if (open && grantId) fetchGrant()
  }, [open, grantId, fetchGrant])

  const handleClose = () => {
    setOpen(false)
    setGrant(null)
    setError(null)
  }

  // Derived access flags (computed from the loaded grant)
  const isPiOrCoPi = React.useMemo(
    () =>
      grant?.facultyAuthors.some(
        (a) =>
          a.userId === currentUserId &&
          (a.role === GrantInRole.FACULTY_PI ||
            a.role === GrantInRole.FACULTY_COPI)
      ) ?? false,
    [grant, currentUserId]
  )

  const isFacultyMember = React.useMemo(
    () =>
      grant?.facultyAuthors.some((a) => a.userId === currentUserId) ?? false,
    [grant, currentUserId]
  )

  const isStudentMember = React.useMemo(
    () =>
      grant?.studentAuthors.some((a) => a.userId === currentUserId) ?? false,
    [grant, currentUserId]
  )

  const isMember = isFacultyMember || isStudentMember

  const isAdmin = userRole === UserRole.ADMIN
  const canEdit = isAdmin || isPiOrCoPi
  const canDelete = isAdmin || isPiOrCoPi
  const canManageOutput = isAdmin || isFacultyMember
  const canRemoveOutput = isAdmin || isPiOrCoPi

  const utilizationPct =
    grant?.amountGranted && grant.amountGranted > 0
      ? Math.min(
          100,
          Math.round(((grant.usedAmount ?? 0) / grant.amountGranted) * 100)
        )
      : 0

  if (!open) return null

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b bg-muted/40">
            <div className="flex items-center justify-between mr-8">
              <DialogTitle className="text-xl font-bold flex flex-wrap items-center gap-2">
                <span className="truncate max-w-[420px]">
                  {grant?.projectCode || "Grant Details"}
                </span>
                {grant && (
                  <Badge variant={grant.isPublic ? "default" : "secondary"}>
                    {grant.isPublic ? "Public" : "Private"}
                  </Badge>
                )}
              </DialogTitle>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 text-destructive bg-destructive/10 rounded-lg">
                <span className="text-lg font-semibold">Error Loading Grant</span>
                <p>{error}</p>
              </div>
            ) : grant ? (
              <div className="space-y-8">
                {/* Status Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                    <Badge variant={grant.grantInStatus === 'GRANTED' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                      {grant.grantInStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {grant.durationOfProject && (
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Duration</p>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {grant.durationOfProject}
                      </div>
                    </div>
                  )}
                </div>

                {/* Financials & Dates Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2 bg-muted/20">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        Financial Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium text-muted-foreground">Amount Granted</span>
                        <span className="font-bold text-lg text-emerald-600">
                          {grant.amountGranted ? `₹${grant.amountGranted.toLocaleString('en-IN')}` : "N/A"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium text-muted-foreground">Amount Used</span>
                        <span className="font-bold text-lg text-blue-600">
                          {grant.usedAmount ? `₹${grant.usedAmount.toLocaleString('en-IN')}` : "N/A"}
                        </span>
                      </div>
                      {grant.amountGranted != null && grant.amountGranted > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-1 px-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Budget Utilization</span>
                              <span>{utilizationPct}%</span>
                            </div>
                            <Progress value={utilizationPct} className="h-2" />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 bg-muted/20">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Key Dates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium text-muted-foreground">Application Date</span>
                        <span className="font-medium">
                          {grant.applicationDate ? format(new Date(grant.applicationDate), "PPP") : "N/A"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium text-muted-foreground">Grant Date</span>
                        <span className="font-medium">
                          {grant.grantDate ? format(new Date(grant.grantDate), "PPP") : "Pending"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Research Team */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Research Team</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        Faculty Members
                        <Badge variant="outline" className="ml-2">{grant.facultyAuthors.length}</Badge>
                      </h4>
                      {grant.facultyAuthors.length > 0 ? (
                        <div className="space-y-2">
                          {grant.facultyAuthors.map((author) => (
                            <div key={author.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                              <Avatar className="h-8 w-8 border">
                                <AvatarImage src={author.user.image || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">{author.user.name?.charAt(0) || "F"}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <p className="font-medium truncate" title={author.user.name || ""}>{author.user.name}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-[10px] px-1 h-5 capitalize">
                                    {author.role.toLowerCase().replace(/_/g, ' ')}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground truncate">{author.user.email}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">No faculty assigned</div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        Student Members
                        <Badge variant="outline" className="ml-2">{grant.studentAuthors.length}</Badge>
                      </h4>
                      {grant.studentAuthors.length > 0 ? (
                        <div className="space-y-2">
                          {grant.studentAuthors.map((author) => (
                            <div key={author.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                              <Avatar className="h-8 w-8 border">
                                <AvatarImage src={author.user.image || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">{author.user.name?.charAt(0) || "S"}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <p className="font-medium truncate" title={author.user.name || ""}>{author.user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{author.user.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">No students assigned</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bills Section */}
                <Collapsible open={billsOpen} onOpenChange={setBillsOpen}>
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Receipt className="w-5 h-5 text-primary" />
                    <CollapsibleTrigger asChild>
                      <button className="flex-1 text-left">
                        <h3 className="text-lg font-semibold hover:underline">Bills & Expenses</h3>
                      </button>
                    </CollapsibleTrigger>
                    <Badge variant="outline">{(grant.bills ?? []).filter((b) => !b.isMasterPdf).length}</Badge>
                  </div>
                  <CollapsibleContent className="pt-4">
                    <BillsSection
                      bills={grant.bills ?? []}
                      grantId={grant.id}
                      userRole={userRole}
                      currentUserId={currentUserId}
                      isPiOrCoPi={isPiOrCoPi}
                      isMember={isMember}
                      onBillsChange={fetchGrant}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Linked Publications */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Link2 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold flex-1">Linked Publications</h3>
                    <Badge variant="outline">{grant.publicationMappings.length}</Badge>
                    {canManageOutput && (
                      <button
                        onClick={() => setOutputOpen(true)}
                        className="text-xs text-primary underline-offset-2 hover:underline"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                  {grant.publicationMappings.length === 0 ? (
                    <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                      No publications linked to this grant yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {grant.publicationMappings.map((m) => {
                        const pub = m.journal || m.conference || m.bookChapter || m.patent || m.copyright
                        const label = pub?.title || pub?.projectCode || pub?.applicationNo ||
                          m.journalId || m.conferenceId || m.bookChapterId || m.patentId || m.copyrightId || m.id
                        return (
                          <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {m.publicationType.replace(/_/g, ' ').replace('BOOKCHAPTER', 'Book Chapter')}
                            </Badge>
                            <span className="text-sm flex-1 truncate">{label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </ScrollArea>

          {/* Footer Actions */}
          {grant && (canEdit || canDelete) && (
            <DialogFooter className="px-6 py-4 border-t bg-muted/20">
              <div className="flex w-full justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Created {grant.createdAt ? format(new Date(grant.createdAt), "PPP") : ""}
                </span>
                <div className="flex gap-2">
                  {canEdit && (
                    <button
                      onClick={() => setEditOpen(true)}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                  {canDelete && onDelete && (
                    <button
                      onClick={() => { handleClose(); onDelete(grant) }}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Nested Dialogs */}
      {grant && (
        <>
          <GrantEditDialog
            grantId={grant.id}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={fetchGrant}
            userRole={userRole}
          />
          <GrantOutputDialog
            grantId={grant.id}
            open={outputOpen}
            onOpenChange={setOutputOpen}
            existingMappings={grant.publicationMappings}
            canManage={canManageOutput}
            canRemove={canRemoveOutput}
            onSuccess={fetchGrant}
          />
        </>
      )}
    </>
  )
}
