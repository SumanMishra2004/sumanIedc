"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Users,
  Building,
} from "lucide-react";
import Image from "next/image";
import { Conference } from "@/types/conference";

interface ViewDialogProps {
  conference: Conference | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConferenceViewDialog({
  conference,
  open,
  onOpenChange,
}: ViewDialogProps) {
  if (!conference) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="text-xl line-clamp-1 pr-4">
              {conference.conferenceName}
            </DialogTitle>
            <div className="flex gap-2 shrink-0">
              <Badge
                variant={conference.isPublic ? "default" : "secondary"}
                className="capitalize"
              >
                {conference.isPublic ? "Public" : "Private"}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {conference.conferenceStatus.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
          <DialogDescription>
             Conference details and information
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header Section with Image and Basic Info */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 aspect-[3/4] relative rounded-lg overflow-hidden border bg-muted shrink-0">
                {conference.imageUrl ? (
                  <Image
                    src={conference.imageUrl}
                    alt={conference.conferenceName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <FileText className="h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                   <h3 className="font-semibold text-lg mb-1">Paper Name</h3>
                   <p className="text-muted-foreground">{conference.paperName || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      Conference Date
                    </div>
                    <p className="font-medium">
                      {conference.conferenceDate
                        ? new Date(conference.conferenceDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building className="mr-2 h-4 w-4" />
                      Publisher
                    </div>
                    <p className="font-medium">{conference.conferencePublisher || "N/A"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Globe className="mr-2 h-4 w-4" />
                      Mode
                    </div>
                    <p className="font-medium capitalize">{conference.mode.toLowerCase() || "N/A"}</p>
                  </div>
                </div>

                {conference.documentUrl && (
                  <Button asChild className="w-full mt-4">
                    <a
                      href={conference.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Document
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Abstract */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Abstract
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {conference.abstract || "No abstract provided."}
              </p>
            </div>

            <Separator />

            {/* Financial Details */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Financial Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Registration Fees</p>
                  <p className="font-medium">
                    {conference.registrationFees
                      ? `₹${conference.registrationFees.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Reimbursement</p>
                  <p className="font-medium">
                    {conference.reimbursement
                      ? `₹${conference.reimbursement.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Authors */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Authors
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Faculty Authors</h4>
                  {conference.facultyAuthors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {conference.facultyAuthors.map((author) => (
                        <div key={author.id} className="flex items-center gap-2 p-2 border rounded-md bg-card">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {author.user.name?.charAt(0) || "U"}
                          </div>
                          <div className="text-sm">
                            <p className="font-medium leading-none">{author.user.name}</p>
                            <p className="text-xs text-muted-foreground">{author.user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No faculty authors</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Student Authors</h4>
                  {conference.studentAuthors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {conference.studentAuthors.map((author) => (
                        <div key={author.id} className="flex items-center gap-2 p-2 border rounded-md bg-card">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {author.user.name?.charAt(0) || "U"}
                          </div>
                          <div className="text-sm">
                            <p className="font-medium leading-none">{author.user.name}</p>
                            <p className="text-xs text-muted-foreground">{author.user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No student authors</p>
                  )}
                </div>
              </div>
            </div>

            {/* Keywords */}
            {conference.keywords.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {conference.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Additional Links */}
            {(conference.paperDoi || conference.paperLink) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Additional Links
                  </h3>
                  <div className="flex flex-col gap-2">
                    {conference.paperDoi && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">DOI:</span>
                        <a href={`https://doi.org/${conference.paperDoi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {conference.paperDoi}
                        </a>
                      </div>
                    )}
                    {conference.paperLink && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Paper Link:</span>
                        <a href={conference.paperLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                          {conference.paperLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
