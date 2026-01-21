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

export function SpecialUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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
          Assign special roles to users by their email address
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
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="FACULTY">Faculty</SelectItem>
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
            <p><span className="font-medium">Student:</span> Basic access to dashboard</p>
            <p><span className="font-medium">Faculty:</span> Access to admin panels and advanced features</p>
            <p><span className="font-medium">Admin:</span> Full system access and management</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
