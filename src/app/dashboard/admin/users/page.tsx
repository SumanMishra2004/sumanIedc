"use client"

import { useEffect, useState, useCallback } from "react"
import { Users } from "lucide-react"
import { UserTable, type UserRow } from "@/components/admin/UserTable"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"

export default function AllUsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/user?limit=200")
      const data = await res.json()
      if (res.ok && data.success) {
        setUsers(data.data)
      }
    } catch (e) {
      console.error("Failed to fetch users:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      // schedule fetch on next tick to avoid synchronous setState during effect
      const id = setTimeout(() => {
        void fetchUsers()
      }, 0)
      return () => clearTimeout(id)
    }
  }, [status, fetchUsers])

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6 space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-lg font-semibold text-destructive">Access Denied</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This page is only accessible to administrators.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <Users className="h-6 w-6 text-primary" />
          All Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all registered users in the system.
        </p>
      </div>

      <UserTable data={users} onRefresh={fetchUsers} />
    </div>
  )
}
