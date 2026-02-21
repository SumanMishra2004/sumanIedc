"use client"

import * as React from "react"
import axios from "axios"
import { Loader2, Link2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PublicationType, UserRole } from "@prisma/client"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

import { GrantInMapping } from "@/types/grant-in"
import { addGrantOutput, removeGrantOutput } from "@/lib/research/grant-in"

interface GrantOutputDialogProps {
  grantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  existingMappings: GrantInMapping[]
  /** True if user can add/remove outputs */
  canManage: boolean
  /** True if user can remove outputs (PI+/ADMIN only) */
  canRemove: boolean
  onSuccess: () => void
}

const PUBLICATION_TYPE_LABELS: Record<PublicationType, string> = {
  JOURNAL: "Journal",
  CONFERENCE: "Conference",
  BOOKCHAPTER: "Book Chapter",
  PATENT: "Patent",
  COPYRIGHT: "Copyright",
}

// Field name used when linking to grant output (kept for reference)
const PUBLICATION_API_MAP: Record<PublicationType, string> = {
  JOURNAL: "/api/research/journal",
  CONFERENCE: "/api/research/conference",
  BOOKCHAPTER: "/api/research/book-chapter",
  PATENT: "/api/research/patent",
  COPYRIGHT: "/api/research/copyright",
}

interface PublicationItem {
  id: string
  label: string
}

export function GrantOutputDialog({
  grantId,
  open,
  onOpenChange,
  existingMappings,
  canManage,
  canRemove,
  onSuccess,
}: GrantOutputDialogProps) {
  const [selectedType, setSelectedType] = React.useState<PublicationType | "">("")
  const [publications, setPublications] = React.useState<PublicationItem[]>([])
  const [pubLoading, setPubLoading] = React.useState(false)
  const [selectedPubId, setSelectedPubId] = React.useState("")
  const [linking, setLinking] = React.useState(false)
  const [removingId, setRemovingId] = React.useState<string | null>(null)

  // Fetch publications when type changes
  React.useEffect(() => {
    if (!selectedType) {
      setPublications([])
      setSelectedPubId("")
      return
    }

    const fetchPublications = async () => {
      setPubLoading(true)
      setSelectedPubId("")
      try {
        const url = PUBLICATION_API_MAP[selectedType as PublicationType]
        const res = await axios.get(url)
        const data = res.data

        // Extract items from various response shapes
        const items: PublicationItem[] = []
        const list =
          data.bookChapters ||
          data.journals ||
          data.conferences ||
          data.patents ||
          data.copyrights ||
          data.data ||
          []

        for (const item of list) {
          items.push({
            id: item.id,
            label:
              item.title ||
              item.projectCode ||
              item.applicationNo ||
              item.serialNo ||
              item.id,
          })
        }
        setPublications(items)
      } catch (err) {
        console.error(err)
        toast.error("Failed to fetch publications")
      } finally {
        setPubLoading(false)
      }
    }

    fetchPublications()
  }, [selectedType])

  const handleLink = async () => {
    if (!selectedType || !selectedPubId) return
    setLinking(true)
    try {
      const type = selectedType as PublicationType
      const payload = {
        publicationType: type,
        patentId: type === PublicationType.PATENT ? selectedPubId : undefined,
        journalId: type === PublicationType.JOURNAL ? selectedPubId : undefined,
        conferenceId: type === PublicationType.CONFERENCE ? selectedPubId : undefined,
        bookChapterId: type === PublicationType.BOOKCHAPTER ? selectedPubId : undefined,
        copyrightId: type === PublicationType.COPYRIGHT ? selectedPubId : undefined,
      }
      const result = await addGrantOutput(grantId, payload)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Publication linked to grant")
        setSelectedType("")
        setSelectedPubId("")
        onSuccess()
      }
    } catch {
      toast.error("Failed to link publication")
    } finally {
      setLinking(false)
    }
  }

  const handleRemove = async (mappingId: string) => {
    if (!confirm("Remove this publication link?")) return
    setRemovingId(mappingId)
    try {
      const result = await removeGrantOutput(grantId, mappingId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Publication link removed")
        onSuccess()
      }
    } catch {
      toast.error("Failed to remove link")
    } finally {
      setRemovingId(null)
    }
  }

  const getLinkedLabel = (mapping: GrantInMapping): string => {
    const pub =
      mapping.journal ||
      mapping.conference ||
      mapping.bookChapter ||
      mapping.patent ||
      mapping.copyright
    return (
      pub?.title ||
      pub?.projectCode ||
      pub?.applicationNo ||
      pub?.serialNo ||
      mapping.journalId ||
      mapping.conferenceId ||
      mapping.bookChapterId ||
      mapping.patentId ||
      mapping.copyrightId ||
      mapping.id
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Linked Publications</DialogTitle>
          <DialogDescription>
            View and manage research outputs linked to this grant.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-4 py-2">
            {/* Existing mappings */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Links ({existingMappings.length})
              </h4>
              {existingMappings.length === 0 ? (
                <div className="py-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                  No publications linked yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {existingMappings.map((mapping) => (
                    <div
                      key={mapping.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {PUBLICATION_TYPE_LABELS[mapping.publicationType]}
                      </Badge>
                      <span className="text-sm flex-1 truncate">
                        {getLinkedLabel(mapping)}
                      </span>
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(mapping.id)}
                          disabled={removingId === mapping.id}
                        >
                          {removingId === mapping.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Link new publication */}
            {canManage && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Link a New Publication
                  </h4>

                  <div className="space-y-2">
                    <Label>Publication Type</Label>
                    <Select
                      value={selectedType}
                      onValueChange={(v) =>
                        setSelectedType(v as PublicationType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PublicationType).map((t) => (
                          <SelectItem key={t} value={t}>
                            {PUBLICATION_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedType && (
                    <div className="space-y-2">
                      <Label>Publication</Label>
                      {pubLoading ? (
                        <Skeleton className="h-9 w-full" />
                      ) : (
                        <Select
                          value={selectedPubId}
                          onValueChange={setSelectedPubId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a publication…" />
                          </SelectTrigger>
                          <SelectContent>
                            {publications.length === 0 ? (
                              <div className="p-2 text-sm text-center text-muted-foreground">
                                No publications found
                              </div>
                            ) : (
                              publications.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.label.length>50 ? p.label.slice(0, 50) + "..." : p.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={linking}
          >
            Close
          </Button>
          {canManage && (
            <Button
              onClick={handleLink}
              disabled={!selectedType || !selectedPubId || linking}
            >
              {linking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Link Publication
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
