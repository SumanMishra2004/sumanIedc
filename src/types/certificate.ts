import { UserRole } from "@prisma/client"

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export interface Certificate {
  id: string
  title: string
  description: string | null
  keywords: string[]
  documentUrl: string | null
  offeredBy: string | null
  dateOfCompletion: Date | string
  remark: string | null
  isPublic: boolean
  userId: string
  user: User
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CertificateListResponse {
  certificates: Certificate[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface CertificateFilters {
  search?: string
  startDate?: string
  endDate?: string
  offeredBy?: string
  isPublic?: boolean
  page?: number
  limit?: number
}

export interface CreateCertificateInput {
  title: string
  description?: string
  keywords?: string[]
  documentUrl?: string
  offeredBy?: string
  dateOfCompletion: string | Date
  remark?: string
  isPublic?: boolean
}

export interface UpdateCertificateInput {
  title?: string
  description?: string
  keywords?: string[]
  documentUrl?: string
  offeredBy?: string
  dateOfCompletion?: string | Date
  remark?: string
  isPublic?: boolean
}

export interface CertificateStats {
  total: number
  publicCount: number
  privateCount: number
  monthWiseCounts: { month: string; count: number }[]
  certificateTypeCounts?: { type: string; count: number }[]
}

export type CertificateStatsResponse = CertificateStats

export interface ApiResponse<T> {
  data?: T
  error?: string
}
