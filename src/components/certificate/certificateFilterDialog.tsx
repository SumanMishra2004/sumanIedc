
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
import { CertificateFilters } from "@/types/certificate"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterDialogProps {
  filters: CertificateFilters
  onFiltersChange: (filters: Partial<CertificateFilters>) => void
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
  const [localFilters, setLocalFilters] = React.useState<Partial<CertificateFilters>>(filters)

  // Sync local filters with external filters when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  const handleApply = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleClear = () => {
    setLocalFilters({})
    onClearFilters()
    setOpen(false)
  }

  const activeFilterCount = Object.keys(filters).length

  const content = (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="space-y-2">
        <Label>Keyword Search</Label>
        <Input
          placeholder="Search items..."
          value={localFilters.search || ""}
          onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
        />
      </div>

       {/* Visibility Status */}
       <div className="space-y-2">
        <Label>Visibility</Label>
        <Select
          value={localFilters.isPublic !== undefined ? String(localFilters.isPublic) : "all"}
          onValueChange={(val) => {
              if (val === "all") {
                  const { isPublic, ...rest } = localFilters;
                  setLocalFilters(rest);
              } else {
                  setLocalFilters({ ...localFilters, isPublic: val === "true" });
              }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Public</SelectItem>
            <SelectItem value="false">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton || (
            <Button variant="outline" size="sm" className="h-8 border-dashed">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal lg:hidden">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Filter Certificates</DrawerTitle>
            <DrawerDescription>
              Refine your search results using the filters below.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {content}
          </div>
          <DrawerFooter className="pt-2">
            <Button onClick={handleApply}>Apply Filters</Button>
            <Button variant="outline" onClick={handleClear}>Clear Filters</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal lg:hidden">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Certificates</DialogTitle>
          <DialogDescription>
             Refine your search results using the filters below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
            {content}
          </div>
        </ScrollArea>
        <DialogFooter>
           <Button variant="outline" onClick={handleClear}>Clear</Button>
           <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
