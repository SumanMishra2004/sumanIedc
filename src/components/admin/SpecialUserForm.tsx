
"use client"

import * as React from "react"
import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useToast } from "@/hooks/use-toast"
import { clearFacultyCache } from "@/lib/faculty-cache"

interface SpecialUserFormProps {
  onSuccess: () => void
}

export function SpecialUserForm({
  onSuccess,
}: SpecialUserFormProps) {
  const { toast } = useToast()

  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const resetForm = () => {
    setEmail("")
    setRole("")
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!email.trim() || !role) {
      toast({
        title: "Validation Error",
        description: "Please enter an email and select a role.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        "/api/admin/special-users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            role,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add special user"
        )
      }

      toast({
        title: "Success",
        description: "Special user added successfully.",
      })

      clearFacultyCache()

      resetForm()
      setOpen(false)
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (value: boolean) => {
    if (isLoading) return

    setOpen(value)

    if (!value) {
      resetForm()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Special User
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Add Special User
          </DialogTitle>

          <DialogDescription>
            Enter the user's email and select their role.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="special-user-email">
              Email Address
            </Label>

            <Input
              id="special-user-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="special-user-role">
              Role
            </Label>

            <Select
              value={role}
              onValueChange={setRole}
              disabled={isLoading}
            >
              <SelectTrigger id="special-user-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="FACULTY">
                  Faculty
                </SelectItem>

                <SelectItem value="EDITOR">
                  Editor
                </SelectItem>

                <SelectItem value="ADMIN">
                  Admin
                </SelectItem>

                <SelectItem value="SUPERADMIN">
                  SuperAdmin
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                isLoading ||
                !email.trim() ||
                !role
              }
            >
              {isLoading
                ? "Adding..."
                : "Add Special User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
