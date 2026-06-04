"use client"

import { useEffect, useState } from "react"
import { ProfileHeroCard } from "./ProfileHeroCard"
import { ProfileStatsRow } from "./ProfileStatsRow"
import { ResearchFeed } from "./ResearchFeed"
import { ProfileSkeleton } from "./ProfileSkeleton"
import { AlertCircle } from "lucide-react"

interface ProfileData {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    bio: string | null
    department: string | null
    phone: string | null
    role: string
    profileCompleted: boolean
    coverImage?: string | null
    institution?: string | null
    linkedinLink?: string | null
    skills?: string[]
    enrollmentNo?: string | null
    degree?: string | null
    currentYear?: string | null
    currentSemester?: string | null
    graduationYear?: string | null
    resumeLink?: string | null
    portfolioLink?: string | null
    githubLink?: string | null
    researchInterests?: string[]
    designation?: string | null
    yearsOfExperience?: string | null
    areasOfExpertise?: string[]
    orcidId?: string | null
  }
  isOwnProfile: boolean
  stats: {
    total: number
    journals: number
    bookChapters: number
    conferences: number
    patents: number
    copyrights: number
    certificates: number
    fdps: number
    achievements: number
  }
  research: {
    journals: unknown[]
    bookChapters: unknown[]
    conferences: unknown[]
    patents: unknown[]
    copyrights: unknown[]
    certificates: unknown[]
    fdps: unknown[]
    achievements: unknown[]
  }
}

interface ProfileViewerProps {
  userId?: string
}

export function ProfileViewer({ userId }: ProfileViewerProps) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = userId ? `/api/profile?userId=${userId}` : "/api/profile"
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <ProfileSkeleton />

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="font-medium text-foreground">Failed to load profile</p>
          <p className="text-sm text-muted-foreground mt-1">{error ?? "User not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProfileHeroCard user={data.user} isOwnProfile={data.isOwnProfile} />
      <ProfileStatsRow stats={data.stats} userRole={data.user.role} />
      <ResearchFeed
        research={data.research}
        isOwnProfile={data.isOwnProfile}
        userRole={data.user.role}
      />
    </div>
  )
}
