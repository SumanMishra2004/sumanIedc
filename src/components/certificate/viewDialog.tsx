
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
import {
  CalendarDays,
  Globe,
  Tag,
  User,
  ExternalLink,
  FileText,
  Info,
  Calendar,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Certificate } from "@/types/certificate";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CertificateViewDialogProps {
  certificate: Certificate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CertificateViewDialog({
  certificate,
  open,
  onOpenChange,
}: CertificateViewDialogProps) {
  if (!certificate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold leading-tight mb-2">
                {certificate.title}
              </DialogTitle>
                <div className="flex flex-wrap gap-2">
                    <Badge variant={certificate.isPublic ? "default" : "secondary"}>
                    {certificate.isPublic ? "Public" : "Private"}
                    </Badge>
                </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Details */}
              <div className="space-y-6">
                
                {/* Offered By & Date */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-primary" />
                    <span className="font-semibold w-24">Offered By:</span>
                    <span className="text-muted-foreground">
                      {certificate.offeredBy || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold w-24">Completed:</span>
                    <span className="text-muted-foreground">
                       {certificate.dateOfCompletion ? new Date(certificate.dateOfCompletion).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Info className="h-4 w-4" />
                    Description
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {certificate.description || "No description provided."}
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Tag className="h-4 w-4" />
                    Keywords
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {certificate.keywords.length > 0 ? (
                      certificate.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="bg-background">
                          {keyword}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No keywords</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: User & Documents */}
              <div className="space-y-6">
                 {/* User Info */}
                 <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" /> User Details
                    </h4>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={certificate.user?.image || undefined} />
                            <AvatarFallback>{certificate.user?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{certificate.user.name}</p>
                            <p className="text-xs text-muted-foreground">{certificate.user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Document Link */}
                {certificate.documentUrl && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Document
                    </h4>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={certificate.documentUrl} target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Certificate Document
                      </Link>
                    </Button>
                  </div>
                )}
                
                {/* Remarks */}
                {certificate.remark && (
                    <div className="border rounded-lg p-4 space-y-2 bg-muted/10">
                        <h4 className="font-semibold text-sm">Remark</h4>
                        <p className="text-sm text-muted-foreground">{certificate.remark}</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
