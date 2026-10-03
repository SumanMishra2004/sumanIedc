/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import { SpecialUserForm } from "@/components/admin/SpecialUserForm"

import { SpecialUserTable } from "@/components/admin/SpecialUserTable"
import { Skeleton } from "@/components/ui/skeleton"

interface SpecialUser {
  id: string
  email: string
  role: string
}

export default function SpecialUserPage() {
  const [users, setUsers] = useState<SpecialUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/special-users")
      const data = await response.json()
      setUsers(data.all_user || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[500px]" />
          <Skeleton className="h-[500px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (

      <div className="w-full p-3">
        <SpecialUserTable data={users} onRefresh={fetchUsers} />
      </div>
    
  )
}
