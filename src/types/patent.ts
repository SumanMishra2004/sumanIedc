import { PatentStatus, TeacherStatus } from "@prisma/client"

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export interface PatentAuthor {
  id: string
  userId: string
  patentId: string
  user: User
}

export interface Patent {
  id: string
  title: string
  keywords: string[]
  grantedPatentNo: string | null
  abstract: string | null
  imageUrl: string | null
  documentUrl: string | null
  filingDate: Date | string | null
  submissionDate: Date | string | null
  publicationDate: Date | string | null
  grantDate: Date | string | null
  applicationNo: string | null
  isPublic: boolean
  patentLink: string | null
  teacherStatus: TeacherStatus
  patentStatus: PatentStatus
  createdAt: Date | string
  updatedAt: Date | string
  studentAuthors: PatentAuthor[]
  facultyAuthors: PatentAuthor[]
  updateComment: string | null
}

export interface PatentListResponse {
  patents: Patent[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PatentFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  patentStatus?: PatentStatus
  teacherStatus?: TeacherStatus
  isPublic?: boolean
  keyword?: string
  applicationNo?: string
  grantedPatentNo?: string
  createdFrom?: string
  createdTo?: string
  filingDateFrom?: string
  filingDateTo?: string
  submissionDateFrom?: string
  submissionDateTo?: string
  publicationDateFrom?: string
  publicationDateTo?: string
  grantDateFrom?: string
  grantDateTo?: string
  facultyAuthorIds?: string[]
  studentAuthorIds?: string[]
}

export interface CreatePatentInput {
  title: string
  keywords: string[]
  grantedPatentNo?: string | null
  abstract?: string | null
  imageUrl?: string | null
  documentUrl?: string | null
  filingDate?: string | null
  submissionDate?: string | null
  publicationDate?: string | null
  grantDate?: string | null
  applicationNo?: string | null
  isPublic?: boolean
  patentLink?: string | null
  patentStatus?: PatentStatus
  teacherStatus?: TeacherStatus
  studentAuthors?: string[] // Application User IDs
  facultyAuthors?: string[] // Application User IDs
  studentAuthorIds?: string[]
  facultyAuthorIds?: string[]
  updateComment?: string | null
}

export type UpdatePatentInput = Partial<CreatePatentInput>

export interface PatentStatsResponse {
  total: number
  submitted: number
  underReview: number
  approved: number
  granted: number
  patentStatusCounts: Array<{
    status: PatentStatus
    count: number
  }>
  teacherStatusCounts: Array<{
    status: TeacherStatus
    count: number
  }>
  filingDateTrends: {
    monthlyTrend: Array<{ month: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
    weeklyTrend: Array<{ week: string; count: number }>
  }
  submissionDateTrends: {
    monthlyTrend: Array<{ month: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
    weeklyTrend: Array<{ week: string; count: number }>
  }
  publicationDateTrends: {
    monthlyTrend: Array<{ month: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
    weeklyTrend: Array<{ week: string; count: number }>
  }
  grantDateTrends: {
    monthlyTrend: Array<{ month: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
    weeklyTrend: Array<{ week: string; count: number }>
  }
}

export interface BulkDeleteResponse {
  count: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}
