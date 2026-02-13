"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConferenceFilters } from "@/types/conference"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MultiSelectUsers } from "@/components/ui/multi-select"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface FilterDialogProps {
  filters: ConferenceFilters
  onFiltersChange: (filters: Partial<ConferenceFilters>) => void
  onClearFilters: () => void
  triggerButton?: React.ReactNode
}

export function ConferenceFilterDialog({
  filters,
  onFiltersChange,
  onClearFilters,
  triggerButton,
}: FilterDialogProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [localFilters, setLocalFilters] = React.useState<Partial<ConferenceFilters>>(filters)
  const [selectedFaculty, setSelectedFaculty] = React.useState<User[]>([])
  const [selectedStudents, setSelectedStudents] = React.useState<User[]>([])

  // Sync local filters with external filters when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  // Date handlers
  const handleMinDateChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      minDate: value || undefined,
    }))
  }

  const handleMaxDateChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      maxDate: value || undefined,
    }))
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const clearFilters = () => {
    onClearFilters()
    setLocalFilters({})
    setSelectedFaculty([])
    setSelectedStudents([])
    setOpen(false)
  }

  const content = (
    <div className="flex flex-col h-full gap-4">
      <Tabs defaultValue="basic" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
        </TabsList>
        <ScrollArea className="h-[400px] mt-4 p-1">
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label>Conference Status</Label>
              <Select
                value={localFilters.conferenceStatus}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({ ...prev, conferenceStatus: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PRESENTED">Presented</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mode</Label>
              <Select
                value={localFilters.mode}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({ ...prev, mode: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={localFilters.isPublic?.toString()}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({ ...prev, isPublic: value === "true" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Public</SelectItem>
                  <SelectItem value="false">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status Date (From)</Label>
              <Input
                type="date"
                value={localFilters.minDate || ""}
                onChange={(e) => handleMinDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
               <Label>Status Date (To)</Label>
               <Input
                 type="date"
                 value={localFilters.maxDate || ""}
                 onChange={(e) => handleMaxDateChange(e.target.value)}
               />
             </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Registration Fees</Label>
                <Input
                  type="number"
                  value={localFilters.minRegistrationFees || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      minRegistrationFees: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Registration Fees</Label>
                <Input
                  type="number"
                  value={localFilters.maxRegistrationFees || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      maxRegistrationFees: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Reimbursement</Label>
                <Input
                  type="number"
                  value={localFilters.minReimbursement || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      minReimbursement: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Reimbursement</Label>
                <Input
                  type="number"
                  value={localFilters.maxReimbursement || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      maxReimbursement: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="people" className="space-y-4">
            <div className="space-y-2">
              <Label>Faculty Authors</Label>
              <MultiSelectUsers
                isStudent={false}
                value={selectedFaculty}
                onChange={(users) => {
                  setSelectedFaculty(users)
                  setLocalFilters((prev) => ({
                    ...prev,
                    facultyAuthorIds: users.map((u) => u.id),
                  }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Student Authors</Label>
              <MultiSelectUsers
                isStudent={true}
                value={selectedStudents}
                onChange={(users) => {
                  setSelectedStudents(users)
                  setLocalFilters((prev) => ({
                    ...prev,
                    studentAuthorIds: users.map((u) => u.id),
                  }))
                }}
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
      <div className="flex justify-between gap-4 mt-4">
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <Trash2 className="mr-2 h-4 w-4" /> Clear
        </Button>
        <Button onClick={applyFilters} className="w-full">
          Apply Filters
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Filter Conferences</DrawerTitle>
            <DrawerDescription>
              Apply filters to refine your search results.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Conferences</DialogTitle>
          <DialogDescription>
            Apply filters to refine your search results.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
