"use client"

import * as React from "react"
import { FilterIcon, X, Plus, Trash2 } from "lucide-react"

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
import { BookChapterFilters } from "@/types/book-chapter"
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
  filters: BookChapterFilters
  onFiltersChange: (filters: Partial<BookChapterFilters>) => void
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
  const [localFilters, setLocalFilters] = React.useState<Partial<BookChapterFilters>>(filters)
  const [selectedFaculty, setSelectedFaculty] = React.useState<User[]>([])
  const [selectedStudents, setSelectedStudents] = React.useState<User[]>([])

  // Sync local filters with external filters when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  // Date handlers - using API field names
  const handleCreatedFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      createdFrom: value || undefined,
    }))
  }

  const handleCreatedToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      createdTo: value || undefined,
    }))
  }

  const handlePublishedFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      publishedFrom: value || undefined,
    }))
  }

  const handlePublishedToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      publishedTo: value || undefined,
    }))
  }

  const clearCreatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      createdFrom: undefined,
      createdTo: undefined,
    }))
  }

  const clearPublishedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      publishedFrom: undefined,
      publishedTo: undefined,
    }))
  }

  // Fee range handlers - using API field names
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

  // Publisher filter
  const handlePublisherChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      publisher: value || undefined,
    }))
  }

  // Keyword filter
  const handleKeywordChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      keyword: value || undefined,
    }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: Partial<BookChapterFilters> = {
      bookChapterStatus: undefined,
      teacherStatus: undefined,
      isPublic: undefined,
      keyword: undefined,
      publisher: undefined,
      search: undefined,
      minRegistrationFees: undefined,
      maxRegistrationFees: undefined,
      minReimbursement: undefined,
      maxReimbursement: undefined,
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
    if (filters.bookChapterStatus) count++
    if (filters.teacherStatus) count++
    if (filters.isPublic !== undefined) count++
    if (filters.keyword) count++
    if (filters.publisher) count++
    if (filters.minRegistrationFees !== undefined) count++
    if (filters.maxRegistrationFees !== undefined) count++
    if (filters.minReimbursement !== undefined) count++
    if (filters.maxReimbursement !== undefined) count++
    if (filters.createdFrom || filters.createdTo) count++
    if (filters.publishedFrom || filters.publishedTo) count++
    if (filters.facultyAuthorIds && filters.facultyAuthorIds.length > 0) count++
    if (filters.studentAuthorIds && filters.studentAuthorIds.length > 0) count++
    return count
  }, [filters])
  const filterContent = (
    <Tabs defaultValue="dates" className="w-full flex-1 flex flex-col overflow-hidden">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="dates">Dates</TabsTrigger>
        <TabsTrigger value="fees">Fees</TabsTrigger>
        <TabsTrigger value="authors">Authors</TabsTrigger>
        <TabsTrigger value="other">Other</TabsTrigger>
      </TabsList>

      <TabsContent value="dates" className="space-y-4 mt-4 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
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
                    onChange={(e) => handleCreatedFromChange(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.createdTo || ""}
                    onChange={(e) => handleCreatedToChange(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.createdFrom || localFilters.createdTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearCreatedDateRange}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear created date range
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
                    onChange={(e) => handlePublishedFromChange(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.publishedTo || ""}
                    onChange={(e) => handlePublishedToChange(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.publishedFrom || localFilters.publishedTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearPublishedDateRange}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear published date range
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="fees" className="space-y-4 mt-4 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-4">
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

           
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="authors" className="space-y-4 mt-4 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-4">
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
                Filter book chapters by faculty authors
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
                Filter book chapters by student authors
              </p>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="other" className="space-y-4 mt-4 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-4">
            {/* Book Chapter Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Book Chapter Status</Label>
              <Select
                value={localFilters.bookChapterStatus || "all"}
                onValueChange={(value) => {
                  setLocalFilters((prev) => ({
                    ...prev,
                    bookChapterStatus: value === "all" ? undefined : value as any,
                  }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select book chapter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SUBMITTED">📤 Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">🔍 Under Review</SelectItem>
                  <SelectItem value="APPROVED">✅ Approved</SelectItem>
                  <SelectItem value="PUBLISHED">📚 Published</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter by book chapter publication status
              </p>
            </div>

            <Separator />

            {/* Teacher Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Teacher Status</Label>
              <Select
                value={localFilters.teacherStatus || "all"}
                onValueChange={(value) => {
                  setLocalFilters((prev) => ({
                    ...prev,
                    teacherStatus: value === "all" ? undefined : value as any,
                  }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select teacher status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="UPLOADED">📁 Uploaded</SelectItem>
                  <SelectItem value="ACCEPTED">✔️ Accepted</SelectItem>
                  <SelectItem value="PUBLISHED">📖 Published</SelectItem>
                  <SelectItem value="UPDATE">🔄 Update</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter by teacher verification status
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
            </div>

            <Separator />

            {/* Keyword Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Keyword</Label>
              <Input
                placeholder="Enter keyword..."
                value={localFilters.keyword || ""}
                onChange={(e) => handleKeywordChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Search by specific keywords associated with book chapters
              </p>
            </div>
          </div>
        </ScrollArea>
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
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-xl font-bold">Advanced Filters</DrawerTitle>
            <DrawerDescription>
              Apply multiple filters to narrow down your search results
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden px-4">
            {filterContent}
          </div>
          <DrawerFooter className="pt-4">
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
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold">Advanced Filters</DialogTitle>
          <DialogDescription>
            Apply multiple filters to narrow down your search results
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {filterContent}
        </div>
        <DialogFooter className="pt-4 gap-2">
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