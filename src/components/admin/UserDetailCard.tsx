"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  User2,
  CheckCircle2,
  XCircle,
  Pencil,
  Hash,
  CalendarDays,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export type UserDetail = {
  id: string
  name: string | null
  email: string | null
  role: string
  image: string | null
  department: string | null
  phone: string | null
  bio: string | null
  profileCompleted: boolean
  emailVerified: string | null
  accounts: { provider: string; type: string }[]
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  STUDENT: "default",
  FACULTY: "secondary",
  ADMIN: "destructive",
}

// Extract approximate creation time from CUID
function cuidToDate(id: string): string {
  try {
    // CUIDs start with 'c' followed by a timestamp-derived segment
    // We can estimate from emailVerified or just say "N/A" 
    return "—"
  } catch {
    return "—"
  }
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium break-all">
          {value ?? <span className="text-muted-foreground italic">Not provided</span>}
        </div>
      </div>
    </div>
  )
}

export function UserDetailCard({ user }: { user: UserDetail }) {
  const router = useRouter()
  const initials = (user.name ?? "?")[0].toUpperCase()

  const providers =
    user.accounts.length > 0
      ? user.accounts.map((a) => a.provider).join(", ")
      : "Credentials (email/password)"

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/admin/users")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Users
        </Button>
        <Button
          size="sm"
          onClick={() => router.push(`/dashboard/admin/users/${user.id}/edit`)}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" /> Edit User
        </Button>
      </div>

      {/* Profile hero */}
      <Card>
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User"}
                  width={96}
                  height={96}
                  className="rounded-full object-cover ring-4 ring-border"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary ring-4 ring-border">
                  {initials}
                </div>
              )}
            </div>

            {/* Name / email / badges */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">
                {user.name ?? <span className="text-muted-foreground italic">No Name</span>}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant={roleBadgeVariant[user.role] ?? "outline"}>
                  {user.role}
                </Badge>
                {user.profileCompleted ? (
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Profile Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5" /> Incomplete Profile
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User2 className="h-4 w-4" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border px-4">
            <InfoRow icon={User2} label="Full Name" value={user.name} />
            <InfoRow icon={Mail} label="Email Address" value={user.email} />
            <InfoRow icon={ShieldCheck} label="Role" value={
              <Badge variant={roleBadgeVariant[user.role] ?? "outline"} className="mt-0.5">
                {user.role}
              </Badge>
            } />
            <InfoRow icon={Building2} label="Department" value={user.department} />
            <InfoRow icon={Phone} label="Phone" value={user.phone} />
            <InfoRow
              icon={CheckCircle2}
              label="Profile Completed"
              value={
                user.profileCompleted ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )
              }
            />
            {user.bio && (
              <div className="py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Bio</p>
                <p className="text-sm leading-relaxed text-foreground">{user.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" /> Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border px-4">
            <InfoRow icon={Hash} label="User ID" value={
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {user.id}
              </code>
            } />
            <InfoRow icon={CalendarDays} label="Email Verified" value={
              user.emailVerified
                ? new Date(user.emailVerified).toLocaleDateString("en-IN", {
                    year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })
                : <span className="text-amber-600 text-sm">Not verified</span>
            } />
            <InfoRow icon={KeyRound} label="Auth Provider" value={providers} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
