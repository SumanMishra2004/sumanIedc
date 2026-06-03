"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { UserDetailCard, type UserDetail } from "@/components/admin/UserDetailCard"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== "authenticated") return
    const fetchUser = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load user")
        setUser(data.data)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong")
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [id, status])

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-5xl p-6 space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-40" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-lg font-semibold text-destructive">Access Denied</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This page is only accessible to administrators.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-lg font-semibold text-destructive">Error</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <UserDetailCard user={user} />
    </div>
  )
}
