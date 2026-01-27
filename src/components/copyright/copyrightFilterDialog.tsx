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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CopyrightFilters } from "@/types/copyright"
import { MultiSelectUsers } from "@/components/ui/multi-select"
import { CopyrightStatus, TeacherStatus } from "@prisma/client"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface FilterDialogProps {
  filters: CopyrightFilters
  onFiltersChange: (filters: Partial<CopyrightFilters>) => void
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
  const [localFilters, setLocalFilters] = React.useState<Partial<CopyrightFilters>>(filters)
  const [selectedFaculty, setSelectedFaculty] = React.useState<User[]>([])
  const [selectedStudents, setSelectedStudents] = React.useState<User[]>([])

  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  // Date handlers
  const handleDateChange = (field: keyof CopyrightFilters, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }))
  }

  const clearDateRange = (fromField: keyof CopyrightFilters, toField: keyof CopyrightFilters) => {
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

  // Serial Number filter
  const handleRegNoChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      regNo: value || undefined,
    }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: Partial<CopyrightFilters> = {
      copyrightStatus: undefined,
      teacherStatus: undefined,
      isPublic: undefined,
      regNo: undefined,
      search: undefined,
      minRegistrationFees: undefined,
      maxRegistrationFees: undefined,
      minReimbursement: undefined,
      maxReimbursement: undefined,
      createdFrom: undefined,
      createdTo: undefined,
      filingFrom: undefined,
      filingTo: undefined,
      submissionFrom: undefined,
      submissionTo: undefined,
      publishedFrom: undefined,
      publishedTo: undefined,
      grantFrom: undefined,
      grantTo: undefined,
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
    if (filters.copyrightStatus) count++
    if (filters.teacherStatus) count++
    if (filters.isPublic !== undefined) count++
    if (filters.regNo) count++
    if (filters.minRegistrationFees !== undefined) count++
    if (filters.maxRegistrationFees !== undefined) count++
    if (filters.minReimbursement !== undefined) count++
    if (filters.maxReimbursement !== undefined) count++
    if (filters.createdFrom || filters.createdTo) count++
    if (filters.filingFrom || filters.filingTo) count++
    if (filters.submissionFrom || filters.submissionTo) count++
    if (filters.publishedFrom || filters.publishedTo) count++
    if (filters.grantFrom || filters.grantTo) count++
    if (filters.facultyAuthorIds && filters.facultyAuthorIds.length > 0) count++
    if (filters.studentAuthorIds && filters.studentAuthorIds.length > 0) count++
    return count
  }, [filters])

  const filterContent = (
    <Tabs defaultValue="dates" className="w-full flex flex-col">
      <TabsList className="grid w-full grid-cols-4 shrink-0">
        <TabsTrigger value="dates">Dates</TabsTrigger>
        <TabsTrigger value="fees">Fees</TabsTrigger>
        <TabsTrigger value="authors">Authors</TabsTrigger>
        <TabsTrigger value="other">Other</TabsTrigger>
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

            {/* Filing Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Filing Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={localFilters.filingFrom || ""}
                    onChange={(e) => handleDateChange('filingFrom', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.filingTo || ""}
                    onChange={(e) => handleDateChange('filingTo', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.filingFrom || localFilters.filingTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange('filingFrom', 'filingTo')}
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
                    value={localFilters.submissionFrom || ""}
                    onChange={(e) => handleDateChange('submissionFrom', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.submissionTo || ""}
                    onChange={(e) => handleDateChange('submissionTo', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.submissionFrom || localFilters.submissionTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange('submissionFrom', 'submissionTo')}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear submission date range
                </Button>
              )}
            </div>

            <Separator />

            {/* Published Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Published Date Range</Label>
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
                  Clear published date range
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
                    value={localFilters.grantFrom || ""}
                    onChange={(e) => handleDateChange('grantFrom', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.grantTo || ""}
                    onChange={(e) => handleDateChange('grantTo', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.grantFrom || localFilters.grantTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearDateRange('grantFrom', 'grantTo')}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear grant date range
                </Button>
              )}
            </div>
          </div>
     
      </TabsContent>

      <TabsContent value="fees" className="scrollbar-gradient mt-4 overflow-auto max-h-[50vh]">
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
                Filter copyrights by faculty authors
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
                Filter copyrights by student authors
              </p>
            </div>
          </div>
        
      </TabsContent>

      <TabsContent value="other" className="scrollbar-gradient mt-4 overflow-auto max-h-[50vh]">
        <div className="space-y-6 pb-4 pr-4">
            {/* Copyright Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Copyright Status</Label>
              <Select
                value={localFilters.copyrightStatus || ""}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    copyrightStatus: value as CopyrightStatus || undefined,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select copyright status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value={CopyrightStatus.SUBMITTED}>Submitted</SelectItem>
                  <SelectItem value={CopyrightStatus.UNDER_REVIEW}>Under Review</SelectItem>
                  <SelectItem value={CopyrightStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={CopyrightStatus.PUBLISHED}>Published</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter by copyright publication status
              </p>
            </div>

            <Separator />

            {/* Teacher Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Teacher Status</Label>
              <Select
                value={localFilters.teacherStatus || ""}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    teacherStatus: value as TeacherStatus || undefined,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value={TeacherStatus.UPLOADED}>Uploaded</SelectItem>
                  <SelectItem value={TeacherStatus.ACCEPTED}>Accepted</SelectItem>
                  <SelectItem value={TeacherStatus.PUBLISHED}>Published</SelectItem>
                  <SelectItem value={TeacherStatus.UPDATE}>Update</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter by teacher verification status
              </p>
            </div>

            <Separator />

            {/* Registration Number Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Registration Number</Label>
              <Input
                placeholder="Enter registration number..."
                value={localFilters.regNo || ""}
                onChange={(e) => handleRegNoChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Search by copyright registration number
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
