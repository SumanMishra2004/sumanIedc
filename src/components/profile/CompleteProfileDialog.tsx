"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { setupProfileAction, skipProfileSetupAction } from "@/lib/actions/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function CompleteProfileDialog() {
  const { data: session, update } = useSession()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSkipping, setIsSkipping] = React.useState(false)

  const [name, setName] = React.useState("")
  const [department, setDepartment] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [bio, setBio] = React.useState("")

  React.useEffect(() => {
    if (session?.user && !session.user.profileCompleted) {
      setName(session.user.name ?? "")
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("department", department)
      formData.append("phone", phone)
      formData.append("bio", bio)

      const result = await setupProfileAction(formData)
      if ("error" in result) {
        toast({ title: "Failed to save profile", description: result.error, variant: "destructive" })
      } else {
        await update({ name, profileCompleted: true })
        toast({ title: "Profile completed successfully!" })
        setIsOpen(false)
      }
    } catch (err) {
      toast({ title: "An error occurred", description: "Please try again later.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      const result = await skipProfileSetupAction()
      if ("error" in result) {
        toast({ title: "Error skipping setup", description: result.error, variant: "destructive" })
      } else {
        await update({ profileCompleted: true })
        toast({ title: "Profile setup skipped for now." })
        setIsOpen(false)
      }
    } catch (err) {
      toast({ title: "An error occurred", variant: "destructive" })
    } finally {
      setIsSkipping(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent showCloseButton={false} className="max-w-md bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#c9f53b] text-black text-xs font-bold">IEDC</span>
            Complete your profile
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Please fill in these basic details to set up your profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="complete-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Full Name *
            </Label>
            <Input
              id="complete-name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || isSkipping}
              className="bg-background border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complete-dept" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Department
            </Label>
            <Input
              id="complete-dept"
              placeholder="e.g. Computer Science"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isLoading || isSkipping}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complete-phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Phone Number
            </Label>
            <Input
              id="complete-phone"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading || isSkipping}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complete-bio" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Brief Bio
            </Label>
            <Textarea
              id="complete-bio"
              placeholder="Tell us a bit about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isLoading || isSkipping}
              className="bg-background border-border text-foreground resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading || isSkipping}
              className="w-full sm:w-auto"
            >
              {isSkipping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Skipping...
                </>
              ) : (
                "Skip for now"
              )}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isSkipping}
              className="w-full sm:w-auto bg-[#c9f53b] text-black hover:bg-[#c9f53b]/90 font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save details"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
