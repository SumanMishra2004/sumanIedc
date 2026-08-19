"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Shield, ShieldAlert, Search, Loader2, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { isAdminOrHigher, canAssignRole, canManageUser, type UserRoleString } from "@/lib/auth/permissions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserRow {
  id: string
  name: string | null
  email: string | null
  role: string
  image: string | null
  department: string | null
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT: "bg-green-100 text-green-800",
  FACULTY: "bg-purple-100 text-purple-800",
  EDITOR: "bg-orange-100 text-orange-800",
  ADMIN: "bg-red-100 text-red-800",
  SUPERADMIN: "bg-red-200 text-red-900 font-bold",
}

export default function RoleManagementPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const [users, setUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  // Confirmation dialog state
  const [pendingChange, setPendingChange] = useState<{
    userId: string
    userName: string
    currentRole: string
    newRole: string
  } | null>(null)
  const [isChanging, setIsChanging] = useState(false)

  const actorRole = session?.user?.role ?? "STUDENT"
  const actorId = session?.user?.id

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/user?limit=200")
      const data = await res.json()
      if (res.ok && data.success) {
        setUsers(data.data)
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-5xl p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdminOrHigher(actorRole)) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center flex flex-col items-center gap-3">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="text-lg font-semibold text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground">This page is only accessible to administrators.</p>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleRoleChangeRequest = (user: UserRow, newRole: string) => {
    // Self-role change prevention
    if (user.id === actorId) {
      toast({ title: "Not allowed", description: "You cannot change your own role.", variant: "destructive" })
      return
    }

    if (!canManageUser(actorRole, user.role)) {
      toast({ title: "Not allowed", description: "You cannot manage this user's role.", variant: "destructive" })
      return
    }

    if (!canAssignRole(actorRole, newRole as UserRoleString)) {
      toast({ title: "Not allowed", description: "You cannot assign this role.", variant: "destructive" })
      return
    }

    setPendingChange({ userId: user.id, userName: user.name ?? user.email ?? user.id, currentRole: user.role, newRole })
  }

  const confirmRoleChange = async () => {
    if (!pendingChange) return
    setIsChanging(true)

    try {
      const res = await fetch(`/api/admin/users/${pendingChange.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole: pendingChange.newRole }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update role")
      }

      toast({ title: "Role updated", description: `${pendingChange.userName} is now ${pendingChange.newRole}.` })
      await fetchUsers()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" })
    } finally {
      setIsChanging(false)
      setPendingChange(null)
    }
  }

  const assignableRoles: UserRoleString[] = (
    ["STUDENT", "FACULTY", "EDITOR", "ADMIN", "SUPERADMIN"] as UserRoleString[]
  ).filter((r) => canAssignRole(actorRole, r))

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <Shield className="h-6 w-6 text-primary" />
          Role Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign and manage user roles. Changes take effect immediately.
        </p>
      </div>

      {/* Role hierarchy card */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Role Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            {["STUDENT", "FACULTY", "EDITOR", "ADMIN", "SUPERADMIN"].map((r, i, arr) => (
              <span key={r} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[r] ?? ""}`}>{r}</span>
                {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {actorRole === "SUPERADMIN"
              ? "You can assign any role including SUPERADMIN."
              : "As ADMIN you can assign STUDENT, FACULTY, EDITOR, and ADMIN. You cannot assign or demote SUPERADMIN."}
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {["STUDENT", "FACULTY", "EDITOR", "ADMIN", "SUPERADMIN"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Click a role badge to change it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No users found.</p>
          ) : (
            filteredUsers.map((user) => {
              const isSelf = user.id === actorId
              const canManage = !isSelf && canManageUser(actorRole, user.role)

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                      <AvatarFallback className="text-xs">{(user.name ?? "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSelf && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                    {canManage ? (
                      <Select
                        value={user.role}
                        onValueChange={(val) => handleRoleChangeRequest(user, val)}
                      >
                        <SelectTrigger className="h-7 text-xs w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableRoles.map(r => (
                            <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[user.role] ?? ""}`}>
                        {user.role}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog open={pendingChange !== null} onOpenChange={(o) => !o && setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Change <strong>{pendingChange?.userName}</strong> from{" "}
              <Badge variant="outline">{pendingChange?.currentRole}</Badge> to{" "}
              <Badge variant="outline">{pendingChange?.newRole}</Badge>?
              <br /><br />
              This takes effect immediately. The user will receive the new role on their next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChanging}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              disabled={isChanging}
              className="bg-primary text-primary-foreground"
            >
              {isChanging ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Changing…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Confirm Change</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
