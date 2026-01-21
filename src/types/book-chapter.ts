import { ResearchStatus } from "@prisma/client"

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export interface BookChapterAuthor {
  id: string
  userId: string
  bookChapterId: string
  user: User
}

export interface BookChapter {
  id: string
  title: string
  abstract: string | null
  imageUrl: string | null
  documentUrl: string | null
  status: ResearchStatus
  isbnIssn: string | null
  registrationFees: number | null
  reimbursement: number | null
  isPublic: boolean
  keywords: string[]
  doi: string | null
  publicationDate: Date | string | null
  publisher: string | null
  createdAt: Date | string
  updatedAt: Date | string
  studentAuthors: BookChapterAuthor[]
  facultyAuthors: BookChapterAuthor[]
}

export interface BookChapterListResponse {
  bookChapters: BookChapter[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface BookChapterFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: ResearchStatus
  isPublic?: boolean
  keyword?: string
  publisher?: string
  search?: string
  createdFrom?: string
  createdTo?: string
  publishedFrom?: string
  publishedTo?: string
  minRegistrationFees?: number
  maxRegistrationFees?: number
  minReimbursement?: number
  maxReimbursement?: number
}

export interface CreateBookChapterInput {
  title: string
  abstract?: string
  imageUrl?: string
  documentUrl?: string
  status?: ResearchStatus
  isbnIssn?: string
  registrationFees?: number
  reimbursement?: number
  isPublic?: boolean
  keywords?: string[]
  doi?: string
  publicationDate?: string | Date
  publisher?: string
  studentAuthorIds?: string[]
  facultyAuthorIds?: string[]
}

export type UpdateBookChapterInput = Partial<CreateBookChapterInput>

export interface BookChapterStatsResponse {
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
    avgRegistrationFees: number
    avgReimbursement: number
  }
  recentChapters: Array<{
    id: string
    title: string
    status: ResearchStatus
    createdAt: Date | string
  }>
  monthlyTrend: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface BulkDeleteResponse {
  message: string
  count: number
}
