"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { GrantInFilters } from "@/types/grant-in"
import { GrantInStatus } from "@prisma/client"

interface FilterDialogProps {
  filters: GrantInFilters
  onFiltersChange: (filters: Partial<GrantInFilters>) => void
  onClearRun: () => void
  embedded?: boolean
}

// DatePicker defined outside to avoid "component created during render" error
function DatePicker({ date, onSelect }: { date?: Date; onSelect: (date?: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
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

export function GrantFilterDialog({ 
  filters, 
  onFiltersChange, 
  onClearRun,
  embedded = false
}: FilterDialogProps) {
  
  // Helper to handle date changes
  const handleDateChange = (date: Date | undefined, field: keyof GrantInFilters) => {
    onFiltersChange({ [field]: date ? date.toISOString() : undefined })
  }

  return (
    <div className={cn("grid gap-4", !embedded && "p-4 border rounded-md")}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Filters</h3>
          <Button variant="ghost" size="icon" onClick={onClearRun}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid gap-2">
        <Label>Status</Label>
        <Select 
          value={filters.grantInStatus} 
          onValueChange={(val) => onFiltersChange({ grantInStatus: val as GrantInStatus })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(GrantInStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Project Code</Label>
        <Input 
          placeholder="Code..." 
          value={filters.projectCode || ''}
          onChange={(e) => onFiltersChange({ projectCode: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <Label>Amount (Min)</Label>
          <Input 
            type="number" 
            placeholder="Min"
            value={filters.grantedAmountMin || ''}
            onChange={(e) => onFiltersChange({ grantedAmountMin: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div className="grid gap-2">
          <Label>Amount (Max)</Label>
          <Input 
            type="number" 
            placeholder="Max"
            value={filters.grantedAmountMax || ''}
            onChange={(e) => onFiltersChange({ grantedAmountMax: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <Label>App Date From</Label>
          <DatePicker 
            date={filters.applicationDateFrom ? new Date(filters.applicationDateFrom) : undefined}
            onSelect={(date) => handleDateChange(date, 'applicationDateFrom')}
          />
        </div>
        <div className="grid gap-2">
          <Label>App Date To</Label>
          <DatePicker 
            date={filters.applicationDateTo ? new Date(filters.applicationDateTo) : undefined}
            onSelect={(date) => handleDateChange(date, 'applicationDateTo')}
          />
        </div>
      </div>

      {/* Grant Dates only relevant if approved but good to filter by */}
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <Label>Grant Date From</Label>
          <DatePicker 
            date={filters.grantDateFrom ? new Date(filters.grantDateFrom) : undefined}
            onSelect={(date) => handleDateChange(date, 'grantDateFrom')}
          />
        </div>
        <div className="grid gap-2">
          <Label>Grant Date To</Label>
          <DatePicker 
            date={filters.grantDateTo ? new Date(filters.grantDateTo) : undefined}
            onSelect={(date) => handleDateChange(date, 'grantDateTo')}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Visibility</Label>
        <Select 
          value={filters.isPublic !== undefined ? String(filters.isPublic) : undefined}
          onValueChange={(val) => onFiltersChange({ isPublic: val === 'true' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Public</SelectItem>
            <SelectItem value="false">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {embedded && (
        <Button variant="secondary" className="w-full mt-2" onClick={onClearRun}>
          Clear Filters
        </Button>
      )}
    </div>
  )
}
