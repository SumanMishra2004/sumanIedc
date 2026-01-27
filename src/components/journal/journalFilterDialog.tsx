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
import { JournalFilters } from "@/types/journal"
import { MultiSelectUsers } from "@/components/ui/multi-select"
import {
  TeacherStatus,
  JournalStatus,
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode
} from "@prisma/client"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface FilterDialogProps {
  filters: JournalFilters
  onFiltersChange: (filters: Partial<JournalFilters>) => void
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
  const [localFilters, setLocalFilters] = React.useState<Partial<JournalFilters>>(filters)
  const [selectedFaculty, setSelectedFaculty] = React.useState<User[]>([])
  const [selectedStudents, setSelectedStudents] = React.useState<User[]>([])

  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  // Date handlers
  const handleDateChange = (field: keyof JournalFilters, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }))
  }

  const clearDateRange = (fromField: keyof JournalFilters, toField: keyof JournalFilters) => {
    setLocalFilters((prev) => ({
      ...prev,
      [fromField]: undefined,
      [toField]: undefined,
    }))
  }

  // Fee range handlers
  const handleMinFeesChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      minRegistrationFees: value ? Number(value) : undefined,
    }))
  }

  const handleMaxFeesChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      maxRegistrationFees: value ? Number(value) : undefined,
    }))
  }

  const handleMinReimbursementChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      minReimbursement: value ? Number(value) : undefined,
    }))
  }

  const handleMaxReimbursementChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      maxReimbursement: value ? Number(value) : undefined,
    }))
  }

  // Impact Factor range handlers
  const handleMinImpactFactorChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      minImpactFactor: value ? Number(value) : undefined,
    }))
  }

  const handleMaxImpactFactorChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      maxImpactFactor: value ? Number(value) : undefined,
    }))
  }

  // Scope handler
  const handleScopeChange = (scope: JournalScope | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      scope: scope,
    }))
  }

  // Review Type handler  
  const handleReviewTypeChange = (reviewType: JournalReviewType | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      reviewType: reviewType,
    }))
  }

  // Access Type handler
  const handleAccessTypeChange = (accessType: JournalAccessType | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      accessType: accessType,
    }))
  }

  // Indexing handler
  const handleIndexingChange = (indexing: JournalIndexing | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      indexing: indexing,
    }))
  }

  // Quartile handler
  const handleQuartileChange = (quartile: JournalQuartile | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      quartile: quartile,
    }))
  }

  // Publication Mode handler
  const handlePublicationModeChange = (publicationMode: JournalPublicationMode | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      publicationMode: publicationMode,
    }))
  }

  // Journal Status handler
  const handleJournalStatusChange = (journalStatus: JournalStatus | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      journalStatus: journalStatus,
    }))
  }

  // Teacher Status handler
  const handleTeacherStatusChange = (teacherStatus: TeacherStatus | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      teacherStatus: teacherStatus,
    }))
  }

  // Publisher filter
  const handlePublisherChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      publisher: value || undefined,
    }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: Partial<JournalFilters> = {
      journalStatus: undefined,
      teacherStatus: undefined,
      isPublic: undefined,
      scope: undefined,
      reviewType: undefined,
      accessType: undefined,
      indexing: undefined,
      quartile: undefined,
      publicationMode: undefined,
      publisher: undefined,
      search: undefined,
      minRegistrationFees: undefined,
      maxRegistrationFees: undefined,
      minReimbursement: undefined,
      maxReimbursement: undefined,
      minImpactFactor: undefined,
      maxImpactFactor: undefined,
      createdFrom: undefined,
      createdTo: undefined,
      publishedFrom: undefined,
      publishedTo: undefined,
      facultyAuthorIds: undefined,
      studentAuthorIds: undefined,
    }
    setLocalFilters(clearedFilters)
    setSelectedFaculty([])
    setSelectedStudents([])
    onClearFilters()
    setOpen(false)
  }

  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.journalStatus) count++
    if (filters.teacherStatus) count++
    if (filters.isPublic !== undefined) count++
    if (filters.scope) count++
    if (filters.reviewType) count++
    if (filters.accessType) count++
    if (filters.indexing) count++
    if (filters.quartile) count++
    if (filters.publicationMode) count++
    if (filters.publisher) count++
    if (filters.minRegistrationFees !== undefined) count++
    if (filters.maxRegistrationFees !== undefined) count++
    if (filters.minReimbursement !== undefined) count++
    if (filters.maxReimbursement !== undefined) count++
    if (filters.minImpactFactor !== undefined) count++
    if (filters.maxImpactFactor !== undefined) count++
    if (filters.createdFrom || filters.createdTo) count++
    if (filters.publishedFrom || filters.publishedTo) count++
    if (filters.facultyAuthorIds && filters.facultyAuthorIds.length > 0) count++
    if (filters.studentAuthorIds && filters.studentAuthorIds.length > 0) count++
    return count
  }, [filters])

  const filterContent = (
    <Tabs defaultValue="dates" className="w-full flex flex-col">
      <TabsList className="grid w-full grid-cols-4 shrink-0">
        <TabsTrigger value="dates">Dates</TabsTrigger>
        <TabsTrigger value="fees-impact">Fees & Impact</TabsTrigger>
        <TabsTrigger value="authors">Authors</TabsTrigger>
        <TabsTrigger value="type-other">Type & Other</TabsTrigger>
      </TabsList>

      <TabsContent value="dates" className="mt-4 overflow-auto max-h-[50vh] scrollbar-gradient ">
        <div className="space-y-6 pb-4 pr-4">
            {/* Created Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Created Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={localFilters.createdFrom || ""}
                    onChange={(e) => handleDateChange('createdFrom', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.createdTo || ""}
                    onChange={(e) => handleDateChange('createdTo', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.createdFrom || localFilters.createdTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange('createdFrom', 'createdTo')}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear created date range
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
                    value={localFilters.publishedFrom || ""}
                    onChange={(e) => handleDateChange('publishedFrom', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.publishedTo || ""}
                    onChange={(e) => handleDateChange('publishedTo', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.publishedFrom || localFilters.publishedTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange('publishedFrom', 'publishedTo')}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear publication date range
                </Button>
              )}
            </div>
          </div>
     
      </TabsContent>

      <TabsContent value="fees-impact" className="scrollbar-gradient mt-4 overflow-auto max-h-[50vh]">
        <div className="space-y-6 pb-4 pr-4">
            {/* Registration Fee Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Registration Fees Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minFees" className="text-xs text-muted-foreground">
                    Minimum ($)
                  </Label>
                  <Input
                    id="minFees"
                    type="number"
                    placeholder="0"
                    value={localFilters.minRegistrationFees || ""}
                    onChange={(e) => handleMinFeesChange(e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFees" className="text-xs text-muted-foreground">
                    Maximum ($)
                  </Label>
                  <Input
                    id="maxFees"
                    type="number"
                    placeholder="100000"
                    value={localFilters.maxRegistrationFees || ""}
                    onChange={(e) => handleMaxFeesChange(e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
              </div>
              {(localFilters.minRegistrationFees !== undefined ||
                localFilters.maxRegistrationFees !== undefined) && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">
                    Range: $
                    {localFilters.minRegistrationFees || 0} - $
                    {localFilters.maxRegistrationFees || "∞"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleMinFeesChange("")
                      handleMaxFeesChange("")
                    }}
                    className="h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Reimbursement Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Reimbursement Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minReimbursement" className="text-xs text-muted-foreground">
                    Minimum ($)
                  </Label>
                  <Input
                    id="minReimbursement"
                    type="number"
                    placeholder="0"
                    value={localFilters.minReimbursement || ""}
                    onChange={(e) => handleMinReimbursementChange(e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxReimbursement" className="text-xs text-muted-foreground">
                    Maximum ($)
                  </Label>
                  <Input
                    id="maxReimbursement"
                    type="number"
                    placeholder="100000"
                    value={localFilters.maxReimbursement || ""}
                    onChange={(e) => handleMaxReimbursementChange(e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
              </div>
              {(localFilters.minReimbursement !== undefined ||
                localFilters.maxReimbursement !== undefined) && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">
                    Range: $
                    {localFilters.minReimbursement || 0} - $
                    {localFilters.maxReimbursement || "∞"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleMinReimbursementChange("")
                      handleMaxReimbursementChange("")
                    }}
                    className="h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Impact Factor Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Impact Factor Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minImpactFactor" className="text-xs text-muted-foreground">
                    Minimum
                  </Label>
                  <Input
                    id="minImpactFactor"
                    type="number"
                    placeholder="0"
                    step="0.01"
                    value={localFilters.minImpactFactor || ""}
                    onChange={(e) => handleMinImpactFactorChange(e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxImpactFactor" className="text-xs text-muted-foreground">
                    Maximum
                  </Label>
                  <Input
                    id="maxImpactFactor"
                    type="number"
                    placeholder="100"
                    step="0.01"
                    value={localFilters.maxImpactFactor || ""}
                    onChange={(e) => handleMaxImpactFactorChange(e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
              </div>
              {(localFilters.minImpactFactor !== undefined ||
                localFilters.maxImpactFactor !== undefined) && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">
                    Range: {localFilters.minImpactFactor || 0} - {localFilters.maxImpactFactor || "∞"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleMinImpactFactorChange("")
                      handleMaxImpactFactorChange("")
                    }}
                    className="h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
      
      </TabsContent>

      <TabsContent value="authors" className="scrollbar-gradient mt-4 overflow-auto max-h-[50vh]">
        <div className="space-y-6 pb-4 pr-4">
            {/* Faculty Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Faculty Authors</Label>
              <MultiSelectUsers
                isStudent={false}
                value={selectedFaculty}
                onChange={(users) => {
                  setSelectedFaculty(users)
                  setLocalFilters((prev) => ({
                    ...prev,
                    facultyAuthorIds: users.length > 0 ? users.map(u => u.id) : undefined,
                  }))
                }}
              />
              <p className="text-xs text-muted-foreground">
                Filter journals by faculty authors
              </p>
            </div>

            <Separator />

            {/* Student Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Student Authors</Label>
              <MultiSelectUsers
                isStudent={true}
                value={selectedStudents}
                onChange={(users) => {
                  setSelectedStudents(users)
                  setLocalFilters((prev) => ({
                    ...prev,
                    studentAuthorIds: users.length > 0 ? users.map(u => u.id) : undefined,
                  }))
                }}
              />
              <p className="text-xs text-muted-foreground">
                Filter journals by student authors
              </p>
            </div>
          </div>
        
      </TabsContent>

      <TabsContent value="type-other" className="scrollbar-gradient mt-4 overflow-auto max-h-[50vh]">
        <div className="space-y-6 pb-4 pr-4">
            {/* Journal Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Journal Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={localFilters.journalStatus === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleJournalStatusChange(undefined)}
                  className="w-full"
                >
                  All Status
                </Button>
                {Object.values(JournalStatus).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={localFilters.journalStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleJournalStatusChange(status)}
                    className="w-full"
                  >
                    {status.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Filter journals by publication status
              </p>
            </div>

            <Separator />

            {/* Teacher Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Teacher Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={localFilters.teacherStatus === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTeacherStatusChange(undefined)}
                  className="w-full"
                >
                  All Status
                </Button>
                {Object.values(TeacherStatus).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={localFilters.teacherStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTeacherStatusChange(status)}
                    className="w-full"
                  >
                    {status.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Filter journals by teacher approval status
              </p>
            </div>

            <Separator />

            {/* Publisher Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Publisher</Label>
              <Input
                placeholder="Enter publisher name..."
                value={localFilters.publisher || ""}
                onChange={(e) => handlePublisherChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Search by publisher name
              </p>
            </div>
          </div>
      
      </TabsContent>
    </Tabs>
  )

  const triggerButtonContent = triggerButton || (
    <Button variant="outline" className="gap-2 relative bg-accent hover:bg-accent/80">
      <FilterIcon className="h-4 w-4" />
      <span className="inline">Advanced Filters</span>
      {activeFilterCount > 0 && (
        <Badge
          variant="default"
          className="rounded-full px-2 py-0.5 text-xs absolute -top-2 -right-2 bg-green-800 text-white shadow-md"
        >
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  )

  const footerContent = (
    <div className="flex gap-2 justify-end">
      <Button
        variant="outline"
        onClick={handleClearFilters}
        disabled={activeFilterCount === 0}
      >
        Clear All Filters
      </Button>
      <Button onClick={handleApplyFilters}>
        Apply Filters
        {activeFilterCount > 0 && ` (${activeFilterCount})`}
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButtonContent}
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="px-4 pt-4 pb-4">
            <DrawerTitle className="text-xl font-bold">Advanced Filters</DrawerTitle>
            <DrawerDescription>
              Apply multiple filters to narrow down your search results
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            {filterContent}
          </div>
          <DrawerFooter className="px-4 pb-4 pt-4">
            {footerContent}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButtonContent}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold">Advanced Filters</DialogTitle>
          <DialogDescription>
            Apply multiple filters to narrow down your search results
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          {filterContent}
        </div>
        <DialogFooter className="px-6 pb-6 pt-4 gap-2">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={activeFilterCount === 0}
          >
            Clear All Filters
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
