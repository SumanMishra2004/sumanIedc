"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { changePasswordAction } from "@/lib/actions/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ShieldCheck, Bell, Palette, Lock } from "lucide-react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  const [isLoading, setIsLoading] = React.useState(false)
  const [emailNotifs, setEmailNotifs] = React.useState(true)
  const [securityAlerts, setSecurityAlerts] = React.useState(true)
  const [marketingNotifs, setMarketingNotifs] = React.useState(false)

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await changePasswordAction(formData)
      if ("error" in result) {
        toast({
          title: "Error updating password",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: result.message,
        })
        e.currentTarget.reset()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = () => {
    toast({
      title: "Settings saved",
      description: "Your notification and system preferences have been updated.",
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6 w-full max-w-4xl space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account security, notifications, and portal preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* ── SECURITY / PASSWORD CHANGE ── */}
        <Card className="border-white/[0.06] bg-card">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#c9f53b]/10 text-[#c9f53b]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Change Password</CardTitle>
              <CardDescription className="text-xs">Update your security credentials.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="currentPassword">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="newPassword">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="confirmPassword">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Repeat new password"
                  className="bg-background border-border text-foreground"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#c9f53b] text-black hover:bg-[#c9f53b]/90 font-semibold mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── NOTIFICATIONS ── */}
        <Card className="border-white/[0.06] bg-card">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#c9f53b]/10 text-[#c9f53b]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Notifications</CardTitle>
              <CardDescription className="text-xs">Configure how you receive updates and alerts.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive daily digests, verification emails, and team updates.</p>
                </div>
                <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Security Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified about password changes, new logins, and critical security issues.</p>
                </div>
                <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Marketing & Announcements</Label>
                  <p className="text-xs text-muted-foreground">Stay up to date with new features, newsletters, and surveys.</p>
                </div>
                <Switch checked={marketingNotifs} onCheckedChange={setMarketingNotifs} />
              </div>
            </div>

            <Button onClick={handleSavePreferences} className="bg-[#c9f53b] text-black hover:bg-[#c9f53b]/90 font-semibold">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* ── THEME PREFERENCES ── */}
        <Card className="border-white/[0.06] bg-card">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#c9f53b]/10 text-[#c9f53b]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Appearance</CardTitle>
              <CardDescription className="text-xs">Customize the look and theme of your dashboard.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className={theme === "light" ? "bg-[#c9f53b] text-black hover:bg-[#c9f53b]" : "border-border"}
                onClick={() => setTheme("light")}
              >
                Light Mode
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className={theme === "dark" ? "bg-[#c9f53b] text-black hover:bg-[#c9f53b]" : "border-border"}
                onClick={() => setTheme("dark")}
              >
                Dark Mode
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className={theme === "system" ? "bg-[#c9f53b] text-black hover:bg-[#c9f53b]" : "border-border"}
                onClick={() => setTheme("system")}
              >
                System Default
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
