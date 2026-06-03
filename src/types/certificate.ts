import { UserRole, CertificateStatus, TeacherStatus } from "@prisma/client"

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
  certificateStatus: CertificateStatus
  updateComment: string | null
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
  certificateStatus?: CertificateStatus
  sortBy?: string
  sortOrder?: "asc" | "desc"
  dateOfCompletionFrom?: string
  dateOfCompletionTo?: string
}

export interface CreateCertificateInput {
  title: string
  description?: string | null
  keywords?: string[]
  documentUrl?: string | null
  offeredBy?: string | null
  dateOfCompletion: string | Date
  remark?: string | null
  isPublic?: boolean
  certificateStatus?: CertificateStatus
  updateComment?: string | null
}

export interface UpdateCertificateInput {
  title?: string
  description?: string | null
  keywords?: string[]
  documentUrl?: string | null
  offeredBy?: string | null
  dateOfCompletion?: string | Date
  remark?: string | null
  isPublic?: boolean
  certificateStatus?: CertificateStatus
  updateComment?: string | null
}

export interface CertificateStats {
  total: number
  publicCount: number
  privateCount: number
  submitted: number
  underReview: number
  approved: number
  monthWiseCounts: { month: string; count: number }[]
  certificateTypeCounts?: { type: string; count: number }[]
}

export type CertificateStatsResponse = CertificateStats

export interface ApiResponse<T> {
  data?: T
  error?: string
}
