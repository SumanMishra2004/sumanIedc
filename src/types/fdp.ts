import { FDPStatus } from "@prisma/client"

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export interface FDP {
  id: string
  title: string
  description: string | null
  keywords: string[]
  organizedBy: string | null
  startDate: Date | string | null
  endDate: Date | string | null
  topic: string | null
  duration: string | null
  remark: string | null
  userId: string
  user: User
  createdAt: Date | string
  updatedAt: Date | string
  isPublic: boolean
  fdpStatus: FDPStatus
  updateComment: string | null
}

export interface FDPListResponse {
  fdps: FDP[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface FDPFilters {
  search?: string
  startDate?: string
  endDate?: string
  organizedBy?: string
  topic?: string
  page?: number
  limit?: number
  isPublic?: boolean
  fdpStatus?: FDPStatus
  sortBy?: string
  sortOrder?: "asc" | "desc"
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
}

export interface CreateFDPInput {
  title: string
  description?: string | null
  keywords?: string[]
  organizedBy?: string | null
  startDate: string | Date | null
  endDate: string | Date | null
  topic?: string | null
  duration?: string | null
  remark?: string | null
  isPublic?: boolean
  fdpStatus?: FDPStatus
  updateComment?: string | null
}

export interface UpdateFDPInput {
  title?: string
  description?: string | null
  keywords?: string[]
  organizedBy?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  topic?: string | null
  duration?: string | null
  remark?: string | null
  isPublic?: boolean
  fdpStatus?: FDPStatus
  updateComment?: string | null
}

export interface FDPStats {
  total: number
  submitted: number
  underReview: number
  approved: number
  monthWiseCounts: { month: string; count: number }[]
}

export type FDPStatsResponse = FDPStats

export interface ApiResponse<T> {
  data?: T
  error?: string
}
