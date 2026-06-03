"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { setupProfileAction } from "@/lib/actions/auth"
import { uploadFile } from "@/lib/appwrite"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, User } from "lucide-react"

interface ProfileFormProps {
  user: {
    id: string
    name: string | null
    email: string | null
    bio: string | null
    department: string | null
    phone: string | null
    image: string | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { update } = useSession()
  const { toast } = useToast()

  const [name, setName] = useState(user.name ?? "")
  const [bio, setBio] = useState(user.bio ?? "")
  const [department, setDepartment] = useState(user.department ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [image, setImage] = useState(user.image ?? "")
  
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadFile(file)
      setImage(url)
      toast({
        title: "Image Uploaded",
        description: "Your profile picture has been uploaded successfully.",
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      // Make sure image URL is passed
      formData.set("image", image)

      const result = await setupProfileAction(formData)

      if ("error" in result) {
        toast({
          title: "Update Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        // Sync NextAuth session
        await update({
          name,
          image: image || undefined,
          profileCompleted: true,
        })
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully saved.",
        })
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Update Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initials = name
    ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U"

  return (
    <Card className="border-[#c9f53b]/15 bg-[#0c0c0c]/40 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl">Personal Information</CardTitle>
        <CardDescription>
          Update your personal details, contact number, and biography.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-[#c9f53b]/40">
                <AvatarImage src={image} alt={name} className="object-cover" />
                <AvatarFallback className="bg-muted text-lg font-bold text-muted-foreground">{initials}</AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#c9f53b]" />
                </div>
              )}
            </div>
            
            <div className="space-y-1.5 text-center sm:text-left">
              <Label className="text-sm font-semibold">Profile Picture</Label>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="avatar-upload"
                  disabled={isUploading || isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isLoading}
                  className="gap-2 border-[#c9f53b]/20 hover:bg-[#c9f53b]/10 hover:text-[#c9f53b]"
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </Button>
                {image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImage("")}
                    disabled={isUploading || isLoading}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP. Max 2MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your Name"
                disabled={isLoading || isUploading}
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user.email ?? ""}
                disabled
                className="opacity-60 cursor-not-allowed bg-[#080808]/50"
              />
              <p className="text-[10px] text-muted-foreground">
                Email cannot be changed after registration.
              </p>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                disabled={isLoading || isUploading}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                disabled={isLoading || isUploading}
              />
            </div>
          </div>

          {/* Biography */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="bio">Biography</Label>
              <span className="text-[10px] text-muted-foreground">
                {bio.length}/500
              </span>
            </div>
            <Textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 500))}
              placeholder="Tell us about your research interests, background..."
              rows={4}
              className="resize-none"
              disabled={isLoading || isUploading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#c9f53b] hover:bg-[#c9f53b]/90 text-black font-semibold"
            disabled={isLoading || isUploading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
