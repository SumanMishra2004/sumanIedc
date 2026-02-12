"use client"

import * as React from "react"
import {
  Calendar, 
  FileText, 
  ExternalLink,
  Users,
  Tag,
  Loader2
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getPatentById } from "@/lib/research/patentApi"
import { Patent } from "@/types/patent"

interface PatentViewDialogProps {
  patentId: string | null
  open: boolean
  setOpen: (open: boolean) => void
  setViewingPatentId: (id: string | null) => void
}

export function PatentViewDialog({
  patentId,
  open,
  setOpen,
  setViewingPatentId,
}: PatentViewDialogProps) {
  const [patent, setPatent] = React.useState<Patent | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !patentId) return

    const fetchPatent = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getPatentById(patentId)

        if (!response.data?.patent) {
          setError("Unable to load patent")
          setLoading(false)
          return
        }

        setPatent(response.data.patent)
      } catch {
        setError("Failed to fetch patent details")
      } finally {
        setLoading(false)
      }
    }

    fetchPatent()
  }, [open, patentId])

  const handleClose = () => {
    setOpen(false)
    setViewingPatentId(null)
    setPatent(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[800px] h-[80vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Patent Details</DialogTitle>
        </DialogHeader>

        {loading ? (
             <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
        ) : error ? (
            <div className="flex items-center justify-center flex-1 text-red-500">
                {error}
            </div>
        ) : patent ? (
            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                    {/* Header Info */}
                    <div>
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl font-bold">{patent.title}</h2>
                            <Badge variant={patent.patentStatus === 'GRANTED' ? 'default' : 'secondary'}>
                                {patent.patentStatus}
                            </Badge>
                        </div>
                        {patent.grantedPatentNo && (
                            <div className="text-sm text-muted-foreground mt-1">
                                Granted Patent No: <span className="font-medium text-foreground">{patent.grantedPatentNo}</span>
                            </div>
                        )}
                        {patent.applicationNo && (
                             <div className="text-sm text-muted-foreground mt-1">
                                Application No: <span className="font-medium text-foreground">{patent.applicationNo}</span>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Description/Abstract */}
                    <div className="space-y-2">
                         <h3 className="text-sm font-semibold flex items-center gap-2">
                             <FileText className="h-4 w-4" /> Abstract
                         </h3>
                         <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                             {patent.abstract || "No abstract available."}
                         </p>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {patent.filingDate && (
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Filing Date</span>
                                <div className="text-sm font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(patent.filingDate).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                        {patent.submissionDate && (
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Submission Date</span>
                                <div className="text-sm font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(patent.submissionDate).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                        {patent.publicationDate && (
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Publication Date</span>
                                <div className="text-sm font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(patent.publicationDate).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                         {patent.grantDate && (
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Grant Date</span>
                                <div className="text-sm font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(patent.grantDate).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Authors */}
                    <div className="space-y-3">
                         <h3 className="text-sm font-semibold flex items-center gap-2">
                             <Users className="h-4 w-4" /> Authors
                         </h3>
                         {/* We can rely on the data structure if it includes authors, 
                             or if the backend returns them separately. 
                             Usually getPatentById returns full object including relations */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {(patent as any).facultyAuthors?.length > 0 && (
                                 <div>
                                     <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Faculty</h4>
                                     <ul className="text-sm space-y-1">
                                         {(patent as any).facultyAuthors.map((author: any) => (
                                             <li key={author.id}>{author.user.name}</li>
                                         ))}
                                     </ul>
                                 </div>
                             )}
                              {(patent as any).studentAuthors?.length > 0 && (
                                 <div>
                                     <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Students</h4>
                                     <ul className="text-sm space-y-1">
                                         {(patent as any).studentAuthors.map((author: any) => (
                                             <li key={author.id}>{author.user.name}</li>
                                         ))}
                                     </ul>
                                 </div>
                             )}
                         </div>
                    </div>

                    {/* Metadata */}
                     <div className="space-y-3">
                         <h3 className="text-sm font-semibold flex items-center gap-2">
                             <Tag className="h-4 w-4" /> Keywords
                         </h3>
                         <div className="flex flex-wrap gap-2">
                             {patent.keywords?.map((keyword, index) => (
                                 <Badge key={index} variant="secondary">{keyword}</Badge>
                             ))}
                         </div>
                    </div>
                    
                    {/* Links */}
                     {(patent.patentLink || patent.documentUrl) && (
                         <div className="space-y-3">
                             <h3 className="text-sm font-semibold flex items-center gap-2">
                                 <ExternalLink className="h-4 w-4" /> Resources
                             </h3>
                             <div className="flex gap-4">
                                {patent.patentLink && (
                                    <a 
                                      href={patent.patentLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline flex items-center gap-1"
                                    >
                                        Patent Link <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                                {patent.documentUrl && (
                                    <a 
                                      href={patent.documentUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline flex items-center gap-1"
                                    >
                                        View Document <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                             </div>
                         </div>
                     )}

                </div>
            </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
