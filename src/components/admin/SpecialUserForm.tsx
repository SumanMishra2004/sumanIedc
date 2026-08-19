"use client"

import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { clearFacultyCache } from "@/lib/faculty-cache"
import { useSession } from "next-auth/react"
import { canAssignRole, type UserRoleString } from "@/lib/auth/permissions"

export function SpecialUserForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: session } = useSession()
  const actorRole = session?.user?.role ?? 'STUDENT'

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Only show roles that the current actor can assign
  const allRoles: { value: UserRoleString; label: string }[] = [
    { value: 'STUDENT', label: 'Student' },
    { value: 'FACULTY', label: 'Faculty' },
    { value: 'EDITOR', label: 'Editor' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPERADMIN', label: 'SuperAdmin' },
  ]
  const assignableRoles = allRoles.filter(r => canAssignRole(actorRole, r.value))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/special-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add special user")
      }

      toast({
        title: "Success",
        description: "Special user added successfully",
      })

      setEmail("")
      setRole("")
      // Invalidate the faculty list cookie so forms pick up the change
      clearFacultyCache()
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add Special User
        </CardTitle>
        <CardDescription>
          Pre-assign a role to an email address. When the user registers, they will receive this role automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={isLoading}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Special User"}
          </Button>
        </form>

        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold">Role Descriptions:</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium">Student:</span> Default role — can submit research and manage own profile</p>
            <p><span className="font-medium">Faculty:</span> Can review submissions, participate as co-author, verify co-authorship requests</p>
            <p><span className="font-medium">Editor:</span> Can review and approve/reject research submissions</p>
            <p><span className="font-medium">Admin:</span> Full system access — user management, access control, statistics</p>
            {canAssignRole(actorRole, 'SUPERADMIN') && (
              <p><span className="font-medium">SuperAdmin:</span> Highest authority — can manage admins and all system settings</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
