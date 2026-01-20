'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface SpecialUser {
  id: string
  email: string
  role: string
}

export default function SpecialUsersManagement() {
  const [specialUsers, setSpecialUsers] = useState<SpecialUser[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSpecialUsers()
  }, [])

  const fetchSpecialUsers = async () => {
    try {
      const response = await fetch('/api/admin/special-users')
      const data = await response.json()
      if (response.ok) {
        setSpecialUsers(data.specialUsers)
      }
    } catch (error) {
      console.error('Error fetching special users:', error)
    }
  }

  const handleAddSpecialUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/special-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Special user added successfully' })
        setEmail('')
        setRole('STUDENT')
        fetchSpecialUsers()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add special user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveSpecialUser = async (userEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${userEmail} from special users?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/special-users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Special user removed successfully' })
        fetchSpecialUsers()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to remove special user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'FACULTY':
        return 'bg-purple-100 text-purple-800'
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800'
      case 'STUDENT':
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Special Users Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Special User Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Special User</CardTitle>
            <CardDescription>
              Assign special roles to users before they sign up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSpecialUser} className="space-y-4">
              {message && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="FACULTY">Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Special User'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Special Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Special Users</CardTitle>
            <CardDescription>
              Users with pre-assigned roles ({specialUsers.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {specialUsers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No special users added yet
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveSpecialUser(user.email)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
