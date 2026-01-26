import { ResearchStatus } from "@prisma/client"

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export interface CopyrightAuthor {
  id: string
  userId: string
  copyrightId: string
  user: User
}

export interface Copyright {
  id: string
  serialNo: string
  title: string
  abstract: string | null
  imageUrl: string | null
  documentUrl: string | null
  dateOfFiling: Date | string | null
  dateOfSubmission: Date | string | null
  dateOfPublished: Date | string | null
  dateOfGrant: Date | string | null
  registrationFees: number | null
  reimbursement: number | null
  status: ResearchStatus
  isPublic: boolean
  createdAt: Date | string
  updatedAt: Date | string
  studentAuthors: CopyrightAuthor[]
  facultyAuthors: CopyrightAuthor[]
}

export interface CopyrightListResponse {
  copyrights: Copyright[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CopyrightFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: ResearchStatus
  isPublic?: boolean
  serialNo?: string
  search?: string
  createdFrom?: string
  createdTo?: string
  filingFrom?: string
  filingTo?: string
  submissionFrom?: string
  submissionTo?: string
  publishedFrom?: string
  publishedTo?: string
  grantFrom?: string
  grantTo?: string
  minRegistrationFees?: number
  maxRegistrationFees?: number
  minReimbursement?: number
  maxReimbursement?: number
  facultyAuthorIds?: string[]
  studentAuthorIds?: string[]
}

export interface CreateCopyrightInput {
  serialNo: string
  title: string
  abstract?: string
  imageUrl?: string
  documentUrl?: string
  dateOfFiling?: string | Date
  dateOfSubmission?: string | Date
  dateOfPublished?: string | Date
  dateOfGrant?: string | Date
  registrationFees?: number
  reimbursement?: number
  status?: ResearchStatus
  isPublic?: boolean
  studentAuthorIds?: string[]
  facultyAuthorIds?: string[]
}

export type UpdateCopyrightInput = Partial<CreateCopyrightInput>

export interface CopyrightStatsResponse {
  total: number
  publicCount: number
  privateCount: number
  statusCounts: Array<{
    status: ResearchStatus
    count: number
  }>
  financials: {
    totalRegistrationFees: number
    totalReimbursement: number
    averageRegistrationFees: number
    averageReimbursement: number
  }
  recentCopyrights: Array<{
    id: string
    title: string
    status: ResearchStatus
    createdAt: Date | string
  }>
  monthlyTrend: Array<{
    month: string
    count: number
  }>
  dailyTrend: Array<{
    date: string
    count: number
  }>
  weeklyTrend: Array<{
    week: string
    count: number
  }>
}
