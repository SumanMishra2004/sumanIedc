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

export interface JournalFilterValues {
  teacherStatus?: string
  journalStatus?: string
  indexing?: string
  quartile?: string
  scope?: string
}

interface AdminJournalFiltersProps {
  filters: JournalFilterValues
  onFilterChange: (key: keyof JournalFilterValues, value: string | undefined) => void
  onClearFilters: () => void
}

const TEACHER_STATUS_OPTIONS = [
  { value: "UPLOADED", label: "Uploaded" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "UPDATE", label: "Update" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PUBLISHED", label: "Published" },
]

const JOURNAL_STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
]

const INDEXING_OPTIONS = [
  { value: "SCOPUS", label: "Scopus" },
  { value: "WEB_OF_SCIENCE", label: "Web of Science" },
  { value: "SCI", label: "SCI" },
  { value: "SCIE", label: "SCIE" },
  { value: "SSCI", label: "SSCI" },
  { value: "AHCI", label: "AHCI" },
  { value: "UGC_CARE", label: "UGC Care" },
  { value: "DOAJ", label: "DOAJ" },
  { value: "PUBMED", label: "PubMed" },
  { value: "IEEE_XPLORE", label: "IEEE Xplore" },
  { value: "NONE", label: "None" },
]

const QUARTILE_OPTIONS = [
  { value: "Q1", label: "Q1" },
  { value: "Q2", label: "Q2" },
  { value: "Q3", label: "Q3" },
  { value: "Q4", label: "Q4" },
  { value: "NOT_APPLICABLE", label: "Not Applicable" },
]

const SCOPE_OPTIONS = [
  { value: "INTERNATIONAL", label: "International" },
  { value: "NATIONAL", label: "National" },
  { value: "REGIONAL", label: "Regional" },
  { value: "LOCAL", label: "Local" },
]

export default function AdminJournalFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: AdminJournalFiltersProps) {
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
        value={filters.teacherStatus ?? "all"}
        onValueChange={(value) =>
          onFilterChange("teacherStatus", value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Teacher Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Teacher Status</SelectItem>
          {TEACHER_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.journalStatus ?? "all"}
        onValueChange={(value) =>
          onFilterChange("journalStatus", value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Journal Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Journal Status</SelectItem>
          {JOURNAL_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.indexing ?? "all"}
        onValueChange={(value) =>
          onFilterChange("indexing", value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Indexing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Indexing</SelectItem>
          {INDEXING_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.quartile ?? "all"}
        onValueChange={(value) =>
          onFilterChange("quartile", value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder="Quartile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Quartiles</SelectItem>
          {QUARTILE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.scope ?? "all"}
        onValueChange={(value) =>
          onFilterChange("scope", value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Scope" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Scopes</SelectItem>
          {SCOPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
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
