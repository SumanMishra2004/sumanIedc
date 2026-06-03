"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, User2, Building2, Phone, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export type EditableUser = {
  id: string
  name: string | null
  email: string | null
  role: string
  image: string | null
  department: string | null
  phone: string | null
  bio: string | null
  profileCompleted: boolean
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  STUDENT: "default",
  FACULTY: "secondary",
  ADMIN: "destructive",
}

export function UserEditForm({ user }: { user: EditableUser }) {
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState(user.name ?? "")
  const [department, setDepartment] = useState(user.department ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [bio, setBio] = useState(user.bio ?? "")
  const [image, setImage] = useState(user.image ?? "")
  const [profileCompleted, setProfileCompleted] = useState(user.profileCompleted)
  const [isSaving, setIsSaving] = useState(false)
  const [previewError, setPreviewError] = useState(false)

  const initials = (user.name ?? "?")[0].toUpperCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department, phone, bio, image, profileCompleted }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Update failed")

      toast({ title: "User updated", description: "Changes saved successfully." })
      router.push(`/dashboard/admin/users/${user.id}`)
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Details
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Avatar Preview */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Profile Picture</CardTitle>
              <CardDescription>Preview of the current image</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="relative">
                {image && !previewError ? (
                  <Image
                    src={image}
                    alt={name || "User"}
                    width={96}
                    height={96}
                    className="rounded-full object-cover ring-4 ring-border"
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary ring-4 ring-border">
                    {initials}
                  </div>
                )}
              </div>
              {/* Image URL field inside the card for context */}
              <div className="w-full space-y-2">
                <Label htmlFor="image" className="flex items-center gap-1.5 text-xs">
                  <ImageIcon className="h-3.5 w-3.5" /> Image URL
                </Label>
                <Input
                  id="image"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={image}
                  onChange={(e) => { setImage(e.target.value); setPreviewError(false) }}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a public image URL or leave blank for auto-generated avatar.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Edit User Information</CardTitle>
              <CardDescription>
                You can update name, department, phone, bio, and profile status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Read-only: Email & Role */}
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Read-only — Cannot be changed
                </p>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Role</p>
                    <Badge variant={roleBadgeVariant[user.role] ?? "outline"}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1.5">
                  <User2 className="h-3.5 w-3.5" /> Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Department
                </Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short description about the user…"
                  rows={3}
                />
              </div>

              {/* Profile Completed toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Profile Completed
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mark this user&apos;s profile as complete
                  </p>
                </div>
                <Switch
                  checked={profileCompleted}
                  onCheckedChange={setProfileCompleted}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
