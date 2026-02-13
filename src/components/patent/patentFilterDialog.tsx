"use client"

import * as React from "react"
import { FilterIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatentFilters } from "@/types/patent"
import { MultiSelectUsers } from "@/components/ui/multi-select"
import {
  PatentStatus,
  TeacherStatus,
} from "@prisma/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface FilterDialogProps {
  filters: PatentFilters
  onFiltersChange: (filters: Partial<PatentFilters>) => void
  onClearFilters: () => void
  triggerButton?: React.ReactNode
}

export function FilterDialog({
  filters,
  onFiltersChange,
  onClearFilters,
  triggerButton,
}: FilterDialogProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [localFilters, setLocalFilters] = React.useState<Partial<PatentFilters>>(filters)
  const [selectedFaculty, setSelectedFaculty] = React.useState<User[]>([])
  const [selectedStudents, setSelectedStudents] = React.useState<User[]>([])

  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  // Date handlers
  const handleDateChange = (field: keyof PatentFilters, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }))
  }

  const clearDateRange = (fromField: keyof PatentFilters, toField: keyof PatentFilters) => {
    setLocalFilters((prev) => ({
      ...prev,
      [fromField]: undefined,
      [toField]: undefined,
    }))
  }

  // Status handlers
  const handlePatentStatusChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      patentStatus: value === "all" ? undefined : (value as PatentStatus),
    }))
  }

  const handleTeacherStatusChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      teacherStatus: value === "all" ? undefined : (value as TeacherStatus),
    }))
  }

  const handleVisibilityChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      isPublic: value === "all" ? undefined : value === "public",
    }))
  }

  // Apply and reset handlers
  const handleApply = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleReset = () => {
    setLocalFilters({})
    setSelectedFaculty([])
    setSelectedStudents([])
    onClearFilters()
  }

  // Active filter count
  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.patentStatus) count++
    if (filters.teacherStatus) count++
    if (filters.isPublic !== undefined) count++
    if (filters.keyword) count++
    if (filters.applicationNo) count++
    if (filters.grantedPatentNo) count++
    if (filters.createdFrom || filters.createdTo) count++
    if (filters.filingDateFrom || filters.filingDateTo) count++
    if (filters.submissionDateFrom || filters.submissionDateTo) count++
    if (filters.publicationDateFrom || filters.publicationDateTo) count++
    if (filters.grantDateFrom || filters.grantDateTo) count++
    if (filters.facultyAuthorIds && filters.facultyAuthorIds.length > 0) count++
    if (filters.studentAuthorIds && filters.studentAuthorIds.length > 0) count++
    return count
  }, [filters])

  const filterContent = (
    <Tabs defaultValue="dates"  className="w-full flex flex-col h-full">
      <TabsList className="grid w-full grid-cols-3 shrink-0">
        <TabsTrigger value="dates">Dates</TabsTrigger>
        <TabsTrigger value="authors">Authors</TabsTrigger>
        <TabsTrigger value="other">Other</TabsTrigger>
      </TabsList>
      <ScrollArea className="flex-1 min-h-0 mt-4">
      <TabsContent value="dates" className="mt-4 flex-1 flex flex-col overflow-hidden min-h-0">
       
          <div className="space-y-6 pb-4">
            {/* Created Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Created Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={localFilters.createdFrom || ""}
                    onChange={(e) => handleDateChange("createdFrom", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.createdTo || ""}
                    onChange={(e) => handleDateChange("createdTo", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.createdFrom || localFilters.createdTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange("createdFrom", "createdTo")}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear created date range
                </Button>
              )}
            </div>

            <Separator />

            {/* Filing Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Filing Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={localFilters.filingDateFrom || ""}
                    onChange={(e) => handleDateChange("filingDateFrom", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.filingDateTo || ""}
                    onChange={(e) => handleDateChange("filingDateTo", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.filingDateFrom || localFilters.filingDateTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange("filingDateFrom", "filingDateTo")}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear filing date range
                </Button>
              )}
            </div>

            <Separator />

            {/* Submission Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Submission Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={localFilters.submissionDateFrom || ""}
                    onChange={(e) => handleDateChange("submissionDateFrom", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.submissionDateTo || ""}
                    onChange={(e) => handleDateChange("submissionDateTo", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.submissionDateFrom || localFilters.submissionDateTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange("submissionDateFrom", "submissionDateTo")}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear submission date range
                </Button>
              )}
            </div>

            <Separator />

            {/* Publication Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Publication Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={localFilters.publicationDateFrom || ""}
                    onChange={(e) => handleDateChange("publicationDateFrom", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.publicationDateTo || ""}
                    onChange={(e) => handleDateChange("publicationDateTo", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.publicationDateFrom || localFilters.publicationDateTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange("publicationDateFrom", "publicationDateTo")}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear publication date range
                </Button>
              )}
            </div>

            <Separator />

            {/* Grant Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Grant Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={localFilters.grantDateFrom || ""}
                    onChange={(e) => handleDateChange("grantDateFrom", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.grantDateTo || ""}
                    onChange={(e) => handleDateChange("grantDateTo", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.grantDateFrom || localFilters.grantDateTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange("grantDateFrom", "grantDateTo")}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear grant date range
                </Button>
              )}
            </div>
          </div>
     
      </TabsContent>

      <TabsContent value="authors" className="mt-4 flex-1 flex flex-col overflow-hidden min-h-0">
     
          <div className="space-y-6 pb-4">
            {/* Faculty Authors */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Faculty Authors</Label>
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
              {selectedFaculty.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFaculty.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="px-2 py-1"
                    >
                      {user.name}
                      <button
                        type="button"
                        onClick={() => {
                          const newFaculty = selectedFaculty.filter((u) => u.id !== user.id)
                          setSelectedFaculty(newFaculty)
                          setLocalFilters((prev) => ({
                            ...prev,
                            facultyAuthorIds: newFaculty.map((u) => u.id),
                          }))
                        }}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Student Authors */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Student Authors</Label>
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
              {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="px-2 py-1"
                    >
                      {user.name}
                      <button
                        type="button"
                        onClick={() => {
                          const newStudents = selectedStudents.filter((u) => u.id !== user.id)
                          setSelectedStudents(newStudents)
                          setLocalFilters((prev) => ({
                            ...prev,
                            studentAuthorIds: newStudents.map((u) => u.id),
                          }))
                        }}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        
      </TabsContent>

      <TabsContent value="other" className="mt-4 flex-1 flex flex-col overflow-hidden min-h-0">
       
          <div className="space-y-6 pb-4">
            {/* Patent Status */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Patent Status</Label>
              <Select
                value={localFilters.patentStatus || "all"}
                onValueChange={handlePatentStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(PatentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Teacher Status */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Teacher Status</Label>
              <Select
                value={localFilters.teacherStatus || "all"}
                onValueChange={handleTeacherStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teacher Statuses</SelectItem>
                  {Object.values(TeacherStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Visibility */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Visibility</Label>
              <Select
                value={
                  localFilters.isPublic === undefined 
                    ? "all" 
                    : localFilters.isPublic 
                    ? "public" 
                    : "private"
                }
                onValueChange={handleVisibilityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Application Number */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Application Number</Label>
              <Input
                placeholder="Enter application number..."
                value={localFilters.applicationNo || ""}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    applicationNo: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <Separator />

            {/* Granted Patent Number */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Granted Patent Number</Label>
              <Input
                placeholder="Enter granted patent number..."
                value={localFilters.grantedPatentNo || ""}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    grantedPatentNo: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <Separator />

            {/* Keyword */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Keyword</Label>
              <Input
                placeholder="Enter keyword..."
                value={localFilters.keyword || ""}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    keyword: e.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>
       
      </TabsContent>
      </ScrollArea>
    </Tabs>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton || (
            <Button variant="outline" className="relative">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="border-b">
            <DrawerTitle>Filter Patents</DrawerTitle>
            <DrawerDescription>
              Apply filters to narrow down your patent search
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden p-4">
            {filterContent}
          </div>
          <DrawerFooter className="border-t">
            <Button onClick={handleApply}>Apply Filters</Button>
            <Button variant="outline" onClick={handleReset}>
              Reset All
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="relative">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Filter Patents</DialogTitle>
          <DialogDescription>
            Apply filters to narrow down your patent search
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-6 py-4">
          {filterContent}
        </div>
        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset All
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
