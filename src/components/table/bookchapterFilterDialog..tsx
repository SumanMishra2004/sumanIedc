"use client"

import * as React from "react"
import { FilterIcon, X, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface FilterValues {
  // Basic Filters
  status?: string
  isPublic?: boolean
  title?: string
  isbnIssn?: string
  
  // Numeric Range Filters
  minFees?: number
  maxFees?: number
  
  // Date Range Filters
  createdAfter?: string
  createdBefore?: string
  updatedAfter?: string
  updatedBefore?: string
  
  // Author Filters
  teacherName?: string[]
  
  // Pagination & Sorting (handled separately, not in dialog)
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface FilterDialogProps {
  filters: FilterValues
  onFiltersChange: (filters: Partial<FilterValues>) => void
  onClearFilters: () => void
  statusOptions?: { value: string; label: string }[]
  triggerButton?: React.ReactNode
}

const defaultStatusOptions = [
  { value: "ACCEPTED", label: "Accepted" },
  { value: "COMMUNICATED", label: "Communicated" },
  { value: "PUBLISHED", label: "Published" },
]

export function FilterDialog({
  filters,
  onFiltersChange,
  onClearFilters,
  statusOptions = defaultStatusOptions,
  triggerButton,
}: FilterDialogProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [localFilters, setLocalFilters] = React.useState<FilterValues>(filters)
  const [teacherInput, setTeacherInput] = React.useState("")
  const [titleInput, setTitleInput] = React.useState("")
  const [isbnInput, setIsbnInput] = React.useState("")

  // Sync local filters with external filters when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
      setTitleInput(filters.title || "")
      setIsbnInput(filters.isbnIssn || "")
    }
  }, [open, filters])

  // Debounce title input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLocalFilters((prev) => ({
        ...prev,
        title: titleInput || undefined,
      }))
    }, 500)

    return () => clearTimeout(timer)
  }, [titleInput])

  // Debounce ISBN/ISSN input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLocalFilters((prev) => ({
        ...prev,
        isbnIssn: isbnInput || undefined,
      }))
    }, 500)

    return () => clearTimeout(timer)
  }, [isbnInput])

  // Date handlers
  const handleCreatedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      createdAfter: value || undefined,
    }))
  }

  const handleCreatedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      createdBefore: value || undefined,
    }))
  }

  const handleUpdatedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedAfter: value || undefined,
    }))
  }

  const handleUpdatedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedBefore: value || undefined,
    }))
  }

  const clearCreatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      createdAfter: undefined,
      createdBefore: undefined,
    }))
  }

  const clearUpdatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedAfter: undefined,
      updatedBefore: undefined,
    }))
  }

  // Basic filter handlers
  const handleStatusChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : value,
    }))
  }

  const handleVisibilityChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      isPublic: value === "all" ? undefined : value === "public",
    }))
  }

  const handleTitleChange = (value: string) => {
    setTitleInput(value)
  }

  const handleIsbnIssnChange = (value: string) => {
    setIsbnInput(value)
  }

  // Fee range handlers
  const handleMinFeesChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      minFees: value ? Number(value) : undefined,
    }))
  }

  const handleMaxFeesChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      maxFees: value ? Number(value) : undefined,
    }))
  }

  // Teacher filter handlers
  const handleAddTeacher = () => {
    if (teacherInput.trim()) {
      setLocalFilters((prev) => {
        const currentTeachers = prev.teacherName || []
        if (!currentTeachers.includes(teacherInput.trim())) {
          return {
            ...prev,
            teacherName: [...currentTeachers, teacherInput.trim()],
          }
        }
        return prev
      })
      setTeacherInput("")
    }
  }

  const handleRemoveTeacher = (teacherName: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      teacherName: prev.teacherName?.filter((name) => name !== teacherName),
    }))
  }

  const clearAllTeachers = () => {
    setLocalFilters((prev) => ({
      ...prev,
      teacherName: undefined,
    }))
    setTeacherInput("")
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {
      status: undefined,
      isPublic: undefined,
      title: undefined,
      isbnIssn: undefined,
      minFees: undefined,
      maxFees: undefined,
      createdAfter: undefined,
      createdBefore: undefined,
      updatedAfter: undefined,
      updatedBefore: undefined,
      teacherName: undefined,
    }
    setLocalFilters(clearedFilters)
    onClearFilters()
    setOpen(false)
  }

  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.status) count++
    if (filters.isPublic !== undefined) count++
    if (filters.title) count++
    if (filters.isbnIssn) count++
    if (filters.minFees !== undefined) count++
    if (filters.maxFees !== undefined) count++
    if (filters.createdAfter || filters.createdBefore) count++
    if (filters.updatedAfter || filters.updatedBefore) count++
    if (filters.teacherName && filters.teacherName.length > 0) count++
    return count
  }, [filters])

  const triggerButtonContent = triggerButton || (
    <Button variant="outline" className="gap-2 relative bg-accent hover:bg-accent/80">
      <FilterIcon className="h-4 w-4" />
      <span className="hidden lg:inline">Advanced Filters</span>
      {activeFilterCount > 0 && (
        <Badge
          variant="default"
          className="rounded-full px-2 py-0.5 text-xs absolute -top-2 -right-2"
          style={{
            background: "linear-gradient(to right, var(--first-color), var(--second-color))",
            color: "white",
          }}
        >
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  )

  const filterContent = (
    <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col overflow-hidden">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dates">Dates</TabsTrigger>
        <TabsTrigger value="fees">Fees</TabsTrigger>
        <TabsTrigger value="authors">Authors</TabsTrigger>
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
                    value={localFilters.createdAfter || ""}
                    onChange={(e) => handleCreatedDateFromChange(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.createdBefore || ""}
                    onChange={(e) => handleCreatedDateToChange(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.createdAfter || localFilters.createdBefore) && (
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

            {/* Updated Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Updated Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={localFilters.updatedAfter || ""}
                    onChange={(e) => handleUpdatedDateFromChange(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.updatedBefore || ""}
                    onChange={(e) => handleUpdatedDateToChange(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {(localFilters.updatedAfter || localFilters.updatedBefore) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearUpdatedDateRange}
                  className="w-fit h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear updated date range
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="fees" className="space-y-4 mt-4 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-4">
            {/* Fee Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Registration Fees Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minFees" className="text-xs text-muted-foreground">
                    Minimum (₹)
                  </Label>
                  <Input
                    id="minFees"
                    type="number"
                    placeholder="0"
                    value={localFilters.minFees || ""}
                    onChange={(e) => handleMinFeesChange(e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFees" className="text-xs text-muted-foreground">
                    Maximum (₹)
                  </Label>
                  <Input
                    id="maxFees"
                    type="number"
                    placeholder="100000"
                    value={localFilters.maxFees || ""}
                    onChange={(e) => handleMaxFeesChange(e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
              </div>

              {(localFilters.minFees !== undefined ||
                localFilters.maxFees !== undefined) && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">
                    Range: ₹
                    {localFilters.minFees || 0} - ₹
                    {localFilters.maxFees || "∞"}
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

            {/* Quick Fee Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleMinFeesChange("0")
                    handleMaxFeesChange("5000")
                  }}
                >
                  ₹0 - ₹5,000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleMinFeesChange("5000")
                    handleMaxFeesChange("10000")
                  }}
                >
                  ₹5,000 - ₹10,000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleMinFeesChange("10000")
                    handleMaxFeesChange("20000")
                  }}
                >
                  ₹10,000 - ₹20,000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleMinFeesChange("20000")
                    handleMaxFeesChange("")
                  }}
                >
                  ₹20,000+
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="authors" className="space-y-4 mt-4 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-4">
            {/* Teacher Name Input */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Filter by Author Names</Label>
              <div className="text-xs text-muted-foreground mb-2">
                Add teacher names to filter. Backend will match partial names.
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter teacher name..."
                  value={teacherInput}
                  onChange={(e) => setTeacherInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTeacher()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddTeacher}
                  disabled={!teacherInput.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Selected Teachers */}
              {localFilters.teacherName && localFilters.teacherName.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Selected Teachers ({localFilters.teacherName.length})
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAllTeachers}
                      className="h-6 text-xs"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                    {localFilters.teacherName.map((name) => (
                      <Badge
                        key={name}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => handleRemoveTeacher(name)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Note */}
            </div>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
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