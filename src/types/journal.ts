import { 
  TeacherStatus, 
  JournalStatus,
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode
} from "@prisma/client"

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export interface JournalAuthor {
  id: string
  userId: string
  journalId: string
  user: User
}

export interface Journal {
  id: string
  serialNo: string
  title: string
  journalName: string
  imageUrl: string | null
  documentUrl: string | null
  abstract: string | null
  scope: JournalScope
  reviewType: JournalReviewType
  accessType: JournalAccessType
  indexing: JournalIndexing
  quartile: JournalQuartile
  publicationMode: JournalPublicationMode
  impactFactor: number | null
  impactFactorDate: Date | string | null
  publisher: string | null
  publicationDate: Date | string | null
  doi: string | null
  paperLink: string | null
  keywords: string[]
  registrationFees: number | null
  reimbursement: number | null
  journalStatus: JournalStatus
  teacherStatus: TeacherStatus
  isPublic: boolean
  createdAt: Date | string
  updatedAt: Date | string
  studentAuthors: JournalAuthor[]
  facultyAuthors: JournalAuthor[]
}

export interface JournalListResponse {
  journals: Journal[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface JournalFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  journalStatus?: JournalStatus
  teacherStatus?: TeacherStatus
  isPublic?: boolean
  scope?: JournalScope
  reviewType?: JournalReviewType
  accessType?: JournalAccessType
  indexing?: JournalIndexing
  quartile?: JournalQuartile
  publicationMode?: JournalPublicationMode
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
  minImpactFactor?: number
  maxImpactFactor?: number
  facultyAuthorIds?: string[]
  studentAuthorIds?: string[]
}

export interface CreateJournalInput {
  serialNo: string
  title: string
  journalName: string
  imageUrl?: string
  documentUrl?: string
  abstract?: string
  scope: JournalScope
  reviewType: JournalReviewType
  accessType: JournalAccessType
  indexing: JournalIndexing
  quartile?: JournalQuartile
  publicationMode: JournalPublicationMode
  impactFactor?: number
  impactFactorDate?: string | Date
  publisher?: string
  publicationDate?: string | Date
  doi?: string
  paperLink?: string
  keywords?: string[]
  registrationFees?: number
  reimbursement?: number
  journalStatus?: JournalStatus
  teacherStatus?: TeacherStatus
  isPublic?: boolean
  studentAuthorIds?: string[]
  facultyAuthorIds?: string[]
}

export type UpdateJournalInput = Partial<CreateJournalInput>

export interface JournalStatsResponse {
  total: number
  publicCount: number
  privateCount: number
  statusCounts: Array<{
    status: TeacherStatus
    count: number
  }>
  journalStatusCounts: Array<{
    status: JournalStatus
    count: number
  }>
  scopeCounts: Array<{
    scope: JournalScope
    count: number
  }>
  indexingCounts: Array<{
    indexing: JournalIndexing
    count: number
  }>
  financials: {
    totalRegistrationFees: number
    totalReimbursement: number
    avgRegistrationFees: number
    avgReimbursement: number
    avgImpactFactor: number
  }
  recentJournals: Journal[]
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
