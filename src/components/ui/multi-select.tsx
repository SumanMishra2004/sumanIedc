"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

// --- Type Definition ---
export type UserOption = {
  id: string
  name: string
  email: string
  department: string
  avatarUrl?: string
}

// --- Mock Data (Replace with API fetch later) ---
const users: UserOption[] = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.j@example.com",
    department: "Engineering",
    avatarUrl: "https://github.com/shadcn.png",
  },
  {
    id: "2",
    name: "Sarah Williams",
    email: "s.williams@example.com",
    department: "Marketing",
    avatarUrl: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "m.brown@corp.net",
    department: "Sales",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.d@design.io",
    department: "Design",
    avatarUrl: "https://i.pravatar.cc/150?u=emily",
  },
  {
    id: "5",
    name: "James Wilson",
    email: "j.wilson@dev.co",
    department: "Engineering",
  },
]

interface MultiSelectProps {
  /** Array of selected user IDs */
  selectedUsers?: string[]
  /** Callback when selection changes */
  onChange?: (values: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelectUser({
  selectedUsers = [],
  onChange,
  placeholder = "Select team members...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // --- Handlers ---
  
  const handleSelect = (userId: string) => {
    const newSelected = selectedUsers.includes(userId)
      ? selectedUsers.filter((id) => id !== userId)
      : [...selectedUsers, userId]
    onChange?.(newSelected)
  }

  const handleRemove = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening popover when clicking remove
    const newSelected = selectedUsers.filter((id) => id !== userId)
    onChange?.(newSelected)
  }

  // Custom filter logic to search Name, Email OR Department
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    user.email.toLowerCase().includes(inputValue.toLowerCase()) ||
    user.department.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-[44px] px-3 py-2 hover:bg-background",
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 items-center w-full">
            {selectedUsers.length > 0 ? (
              selectedUsers.map((userId) => {
                const user = users.find((u) => u.id === userId)
                if (!user) return null
                return (
                  <Badge
                    key={userId}
                    variant="secondary"
                    className="flex items-center gap-2 pr-1 pl-1 py-1 text-sm font-normal rounded-md border-input border"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="text-[9px]">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[100px]">{user.name}</span>
                    <div
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground cursor-pointer transition-colors"
                      onClick={(e) => handleRemove(userId, e)}
                    >
                      <X className="h-3 w-3" />
                    </div>
                  </Badge>
                )
              })
            ) : (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}> 
          {/* Note: shouldFilter={false} is critical because we are doing custom filtering above */}
          <CommandInput
            placeholder="Search name, email, or dept..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.includes(user.id)
                return (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => handleSelect(user.id)}
                    className="cursor-pointer aria-selected:bg-accent"
                  >
                    <div className="flex items-center w-full gap-3">
                      
                      {/* Checkbox State */}
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      {/* Text Content */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate text-foreground">
                            {user.name}
                          </span>
                          {/* Department Badge */}
                          <Badge variant="outline" className="ml-2 text-[10px] h-5 px-1.5 shrink-0 text-muted-foreground">
                            {user.department}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}