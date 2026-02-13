
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Building,
  Tag,
  User,
  Info,
  Clock,
  Layout,
} from "lucide-react";
import { FDP } from "@/types/fdp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FDPViewDialogProps {
  fdp: FDP | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FDPViewDialog({
  fdp,
  open,
  onOpenChange,
}: FDPViewDialogProps) {
  if (!fdp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold leading-tight mb-2">
                {fdp.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Details */}
              <div className="space-y-6">
                
                {/* Organization & Topic */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-primary" />
                    <span className="font-semibold w-24">Organized By:</span>
                    <span className="text-muted-foreground">
                      {fdp.organizedBy || "N/A"}
                    </span>
                  </div>
                   <div className="flex items-center gap-2 text-sm">
                    <Layout className="h-4 w-4 text-primary" />
                    <span className="font-semibold w-24">Topic:</span>
                    <span className="text-muted-foreground">
                      {fdp.topic || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Dates & Duration */}
                <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Timeline
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground block text-xs">Start Date</span>
                            <span className="font-medium">{fdp.startDate ? new Date(fdp.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">End Date</span>
                            <span className="font-medium">{fdp.endDate ? new Date(fdp.endDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                    {fdp.duration && (
                         <div className="flex items-center gap-2 text-sm pt-2 border-t mt-2">
                             <Clock className="h-3 w-3 text-muted-foreground" />
                             <span className="text-muted-foreground">Duration: {fdp.duration}</span>
                         </div>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Info className="h-4 w-4" />
                    Description
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {fdp.description || "No description provided."}
                  </div>
                </div>

              </div>

              {/* Right Column: User & Meta */}
              <div className="space-y-6">
                 {/* User Info */}
                 <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" /> User Details
                    </h4>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={fdp.user?.image || undefined} />
                            <AvatarFallback>{fdp.user?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{fdp.user.name}</p>
                            <p className="text-xs text-muted-foreground">{fdp.user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Tag className="h-4 w-4" />
                    Keywords
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fdp.keywords.length > 0 ? (
                      fdp.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="bg-background">
                          {keyword}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No keywords</span>
                    )}
                  </div>
                </div>
                
                {/* Remarks */}
                {fdp.remark && (
                    <div className="border rounded-lg p-4 space-y-2 bg-muted/10">
                        <h4 className="font-semibold text-sm">Remark</h4>
                        <p className="text-sm text-muted-foreground">{fdp.remark}</p>
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
