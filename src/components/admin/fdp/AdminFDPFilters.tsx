"use client"

import { X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FDPStatus } from "@prisma/client"

export interface FDPFilterValues {
  fdpStatus?: FDPStatus
  isPublic?: boolean
}

interface AdminFDPFiltersProps {
  filters: FDPFilterValues
  onFilterChange: (key: keyof FDPFilterValues, value: any) => void
  onClearFilters: () => void
}

const FDP_STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
]

export default function AdminFDPFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: AdminFDPFiltersProps) {
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </div>

      <Select
        value={filters.fdpStatus ?? "all"}
        onValueChange={(value) =>
          onFilterChange("fdpStatus", value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="FDP Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {FDP_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.isPublic === undefined ? "all" : String(filters.isPublic)}
        onValueChange={(value) =>
          onFilterChange(
            "isPublic",
            value === "all" ? undefined : value === "true"
          )
        }
      >
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Visibility" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Visibilities</SelectItem>
          <SelectItem value="true">🌐 Public</SelectItem>
          <SelectItem value="false">🔒 Private</SelectItem>
        </SelectContent>
      </Select>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      )}
    </div>
  )
}
