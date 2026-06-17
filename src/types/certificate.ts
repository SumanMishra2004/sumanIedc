export const USER_ROLES = ["ADMIN", "FACULTY", "STUDENT"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const CERTIFICATE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "APPROVED"] as const
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number]

export const TEACHER_STATUSES = ["UPLOADED", "ACCEPTED", "UPDATE", "REJECTED", "PUBLISHED"] as const
export type TeacherStatus = (typeof TEACHER_STATUSES)[number]

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
