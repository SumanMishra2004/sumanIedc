import { UserRole } from "@prisma/client"

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
  startDate: Date | string
  endDate: Date | string
  topic: string | null
  duration: string | null
  remark: string | null
  userId: string
  user: User
  createdAt: Date | string
  updatedAt: Date | string
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
}

export interface CreateFDPInput {
  title: string
  description?: string
  keywords?: string[]
  organizedBy?: string
  startDate: string | Date
  endDate: string | Date
  topic?: string
  duration?: string
  remark?: string
}

export interface UpdateFDPInput {
  title?: string
  description?: string
  keywords?: string[]
  organizedBy?: string
  startDate?: string | Date
  endDate?: string | Date
  topic?: string
  duration?: string
  remark?: string
}

export interface FDPStats {
  total: number
  monthWiseCounts: { month: string; count: number }[]
}

export type FDPStatsResponse = FDPStats

export interface ApiResponse<T> {
  data?: T
  error?: string
}
