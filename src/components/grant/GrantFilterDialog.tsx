"use client"

import * as React from "react"
import { CalendarIcon, SlidersHorizontal, X, RotateCcw } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { GrantInFilters } from "@/types/grant-in"
import { GrantInStatus } from "@prisma/client"

interface FilterDialogProps {
  filters: GrantInFilters
  onFiltersChange: (filters: Partial<GrantInFilters>) => void
  onClearRun: () => void
  embedded?: boolean
}

function DatePicker({ date, onSelect, placeholder = "Pick a date" }: { date?: Date; onSelect: (date?: Date) => void; placeholder?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 text-sm",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          {date ? format(date, "dd MMM yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function FilterContent({
  filters,
  onFiltersChange,
  onClearRun,
}: Omit<FilterDialogProps, "embedded">) {
  const handleDateChange = (date: Date | undefined, field: keyof GrantInFilters) => {
    onFiltersChange({ [field]: date ? date.toISOString() : undefined })
  }

  return (
    <div className="space-y-6 py-1">
      {/* Status */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
        <Select
          value={filters.grantInStatus}
          onValueChange={(val) => onFiltersChange({ grantInStatus: val as GrantInStatus })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(GrantInStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Project Code */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project Code</Label>
        <Input
          placeholder="e.g. PROJ-2024-001"
          className="h-9"
          value={filters.projectCode || ""}
          onChange={(e) => onFiltersChange({ projectCode: e.target.value || undefined })}
        />
      </div>

      <Separator />

      {/* Amount Range */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Granted Amount (₹)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Min</span>
            <Input
              type="number"
              placeholder="0"
              className="h-9"
              value={filters.grantedAmountMin || ""}
              onChange={(e) =>
                onFiltersChange({ grantedAmountMin: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Max</span>
            <Input
              type="number"
              placeholder="No limit"
              className="h-9"
              value={filters.grantedAmountMax || ""}
              onChange={(e) =>
                onFiltersChange({ grantedAmountMax: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Application Date */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application Date</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">From</span>
            <DatePicker
              date={filters.applicationDateFrom ? new Date(filters.applicationDateFrom) : undefined}
              onSelect={(date) => handleDateChange(date, "applicationDateFrom")}
              placeholder="Start date"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">To</span>
            <DatePicker
              date={filters.applicationDateTo ? new Date(filters.applicationDateTo) : undefined}
              onSelect={(date) => handleDateChange(date, "applicationDateTo")}
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Grant Date */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grant Date</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">From</span>
            <DatePicker
              date={filters.grantDateFrom ? new Date(filters.grantDateFrom) : undefined}
              onSelect={(date) => handleDateChange(date, "grantDateFrom")}
              placeholder="Start date"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">To</span>
            <DatePicker
              date={filters.grantDateTo ? new Date(filters.grantDateTo) : undefined}
              onSelect={(date) => handleDateChange(date, "grantDateTo")}
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Visibility */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visibility</Label>
        <Select
          value={filters.isPublic !== undefined ? String(filters.isPublic) : "all"}
          onValueChange={(val) =>
            onFiltersChange({ isPublic: val === "all" ? undefined : val === "true" })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All grants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grants</SelectItem>
            <SelectItem value="true">Public only</SelectItem>
            <SelectItem value="false">Private only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function countActiveFilters(filters: GrantInFilters): number {
  return Object.values(filters).filter((v) => v !== undefined && v !== "" && v !== null).length
}

export function GrantFilterDialog({
  filters,
  onFiltersChange,
  onClearRun,
  embedded = false,
}: FilterDialogProps) {
  const [open, setOpen] = React.useState(false)
  const activeCount = countActiveFilters(filters)

  if (embedded) {
    return (
      <FilterContent
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearRun={onClearRun}
      />
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 text-sm font-medium">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-4 min-w-4 px-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-85 sm:w-100 md:w-120 lg:w-150 flex flex-col">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Filter Grants</SheetTitle>
          <SheetDescription className="text-xs">
            Narrow down grants using the options below.
          </SheetDescription>
        </SheetHeader>
  

        <div className="flex-1 overflow-y-auto scrollbar-gradient  pr-1 -mr-1">
          <FilterContent
            filters={filters}
            onFiltersChange={onFiltersChange}
            onClearRun={onClearRun}
          />
        </div>

        <SheetFooter className="flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => {
              onClearRun()
            }}
            disabled={activeCount === 0}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear all
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}